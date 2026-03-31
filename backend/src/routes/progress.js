import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";
import { requireRole } from "../lib/requireRole.js";

const STAGE_LABELS = {
  INICIO:       "Início",
  DESENVOLVENDO: "Desenvolvendo",
  AVANCADO:     "Avançado",
  CONCLUIDO:    "Concluído",
};

/**
 * Rotas de progresso individual de aluna por equipe
 * Prefixo: /api/teams (reutiliza o prefixo de teams)
 *
 * GET  /api/teams/:teamId/progress         → progresso de todas as alunas da equipe
 * PUT  /api/teams/:teamId/progress/:userId → atualiza progresso de uma aluna (ADMIN/MENTORA)
 */
export async function progressRoutes(app) {
  // GET — lista progresso de todas as alunas da equipe
  app.get("/:teamId/progress", async (req, reply) => {
    const teamId = Number(req.params.teamId);

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        students: { select: { id: true, name: true, email: true } },
        progressRecords: {
          include: { student: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!team) return reply.status(404).send({ message: "Equipe não encontrada." });

    // Garante que toda aluna tenha uma entrada (mesmo sem progresso registrado)
    const progressMap = Object.fromEntries(
      team.progressRecords.map((p) => [p.studentId, p])
    );

    const results = team.students.map((student) => ({
      student,
      progress: progressMap[student.id] ?? {
        stage: "INICIO",
        notes: null,
        updatedAt: null,
      },
    }));

    return reply.send({ teamId, teamName: team.name, students: results });
  });

  // PUT — cria ou atualiza progresso de uma aluna específica
  app.put("/:teamId/progress/:studentId", {
    onRequest: [requireRole(app, "ADMIN", "MENTORA")],
    schema: {
      body: {
        type: "object",
        properties: {
          stage: {
            type: "string",
            enum: ["INICIO", "DESENVOLVENDO", "AVANCADO", "CONCLUIDO"],
          },
          notes: { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const teamId    = Number(req.params.teamId);
    const studentId = Number(req.params.studentId);
    const { stage, notes } = req.body;

    // Verifica se a aluna pertence à equipe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { students: { select: { id: true } } },
    });
    if (!team) return reply.status(404).send({ message: "Equipe não encontrada." });

    const isStudent = team.students.some((s) => s.id === studentId);
    if (!isStudent) {
      return reply.status(400).send({ message: "Esta aluna não pertence à equipe." });
    }

    const data = {};
    if (stage !== undefined) data.stage = stage;
    if (notes !== undefined) data.notes = notes;

    const progress = await prisma.studentProgress.upsert({
      where: { teamId_studentId: { teamId, studentId } },
      update: data,
      create: { teamId, studentId, stage: stage ?? "INICIO", notes: notes ?? null },
      include: { student: { select: { id: true, name: true } } },
    });

    await logActivity(
      `Progresso de ${progress.student.name} atualizado para "${STAGE_LABELS[progress.stage]}"`
    );

    return reply.send(progress);
  });
}
