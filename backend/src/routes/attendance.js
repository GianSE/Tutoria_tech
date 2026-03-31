import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";
import { requireRole } from "../lib/requireRole.js";

/**
 * Rotas de controle de presença por sessão
 * Prefixo: /api/schedules/:scheduleId/attendance
 *
 * GET  /  → lista quem está presente nesta sessão
 * PUT  /  → define lista completa de presentes (ADMIN/MENTORA)
 * POST /:userId/toggle → marca/desmarca um usuário (ADMIN/MENTORA)
 */
export async function attendanceRoutes(app) {
  // GET — lista presenças da sessão com dados do usuário
  app.get("/:scheduleId/attendance", async (req, reply) => {
    const scheduleId = Number(req.params.scheduleId);

    const session = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { id: true, title: true, status: true },
    });
    if (!session) return reply.status(404).send({ message: "Sessão não encontrada." });

    const attendances = await prisma.attendance.findMany({
      where: { scheduleId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { user: { name: "asc" } },
    });

    return reply.send({
      session,
      attendances,
      presencasCount: attendances.length,
    });
  });

  // PUT — substitui a lista inteira de presentes
  app.put("/:scheduleId/attendance", {
    onRequest: [requireRole(app, "ADMIN", "MENTORA")],
    schema: {
      body: {
        type: "object",
        required: ["userIds"],
        properties: {
          userIds: { type: "array", items: { type: "integer" } },
        },
      },
    },
  }, async (req, reply) => {
    const scheduleId = Number(req.params.scheduleId);
    const { userIds } = req.body;

    const session = await prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!session) return reply.status(404).send({ message: "Sessão não encontrada." });

    // Remove tudo e recria
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { scheduleId } }),
      ...userIds.map((userId) =>
        prisma.attendance.create({ data: { scheduleId, userId } })
      ),
      // Atualiza o campo numérico de presencas na sessão
      prisma.schedule.update({
        where: { id: scheduleId },
        data: { presencas: userIds.length },
      }),
    ]);

    await logActivity(
      `Presença registrada: "${session.title}" — ${userIds.length} participante(s)`
    );

    const updated = await prisma.attendance.findMany({
      where: { scheduleId },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    return reply.send({ presencasCount: updated.length, attendances: updated });
  });

  // POST /:scheduleId/attendance/:userId/toggle — alterna presença individual
  app.post("/:scheduleId/attendance/:userId/toggle", {
    onRequest: [requireRole(app, "ADMIN", "MENTORA")],
  }, async (req, reply) => {
    const scheduleId = Number(req.params.scheduleId);
    const userId     = Number(req.params.userId);

    const existing = await prisma.attendance.findUnique({
      where: { scheduleId_userId: { scheduleId, userId } },
    });

    if (existing) {
      await prisma.attendance.delete({ where: { id: existing.id } });
    } else {
      await prisma.attendance.create({ data: { scheduleId, userId } });
    }

    // Atualiza contagem
    const count = await prisma.attendance.count({ where: { scheduleId } });
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { presencas: count },
    });

    return reply.send({ present: !existing, presencasCount: count });
  });
}
