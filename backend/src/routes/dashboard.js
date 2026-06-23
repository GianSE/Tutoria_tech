import prisma from "../lib/prisma.js";

/**
 * Rotas do Dashboard
 * Prefixo: /api/dashboard
 */
export async function dashboardRoutes(app) {
  // ── GET /stats — KPIs principais ────────────────────────────────────────────
  app.get("/stats", async (_req, reply) => {
    const [
      totalAlunas,
      totalMentoras,
      equipesAtivas,
      sessoesRealizadas,
      materiaisPublicados,
      atividadesRecentes,
      teamsGrouped,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "ALUNA" } }),
      prisma.user.count({ where: { role: "MENTORA" } }),
      prisma.team.count(),
      prisma.schedule.count({ where: { status: "REALIZADA" } }),
      prisma.material.count(),
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Agrupa equipes por status para o card de fases Technovation
      prisma.team.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    // Converte o groupBy em objeto plano: { IDEACAO: 2, PROTOTIPAGEM: 1, ... }
    const teamsPerStatus = teamsGrouped.reduce((acc, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    return reply.send({
      totalAlunas,
      totalMentoras,
      equipesAtivas,
      sessoesRealizadas,
      materiaisPublicados,
      atividadesRecentes,
      teamsPerStatus,
    });
  });

  // ── GET /activities — para o painel de notificações ──────────────────────────
  app.get("/activities", async (_req, reply) => {
    const activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return reply.send(activities);
  });

  // ── GET /my-data — dados personalizados por papel ─────────────────────────
  app.get("/my-data", { onRequest: [app.authenticate] }, async (req, reply) => {
    const { id: userId, role } = req.user;

    const upcomingEvents = await prisma.schedule.findMany({
      where: { status: "PENDENTE", date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 3,
      select: { id: true, title: true, date: true, local: true, type: true },
    });

    if (role === "ALUNA") {
      const teams = await prisma.team.findMany({
        where: { students: { some: { id: userId } } },
        include: {
          mentor: { select: { id: true, name: true } },
          progressRecords: {
            where: { studentId: userId },
            select: { stage: true, notes: true, updatedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedTeams = teams.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        mentor: t.mentor,
        myProgress: t.progressRecords[0] ?? { stage: "INICIO", notes: null },
      }));

      return reply.send({ teams: formattedTeams, upcomingEvents });
    }

    if (role === "MENTORA") {
      const myTeams = await prisma.team.findMany({
        where: { mentorId: userId },
        include: {
          students: { select: { id: true, name: true, email: true } },
          progressRecords: {
            include: { student: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedTeams = myTeams.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        studentCount: t.students.length,
        students: t.students.map((s) => ({
          ...s,
          progress: t.progressRecords.find((p) => p.studentId === s.id) ?? {
            stage: "INICIO",
            notes: null,
          },
        })),
      }));

      return reply.send({ myTeams: formattedTeams, upcomingEvents });
    }

    // ADMIN: não usa este endpoint
    return reply.send({});
  });
}
