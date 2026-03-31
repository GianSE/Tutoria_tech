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
      equipesAtivas,
      sessoesRealizadas,
      materiaisPublicados,
      atividadesRecentes,
      teamsGrouped,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "ALUNA" } }),
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
}
