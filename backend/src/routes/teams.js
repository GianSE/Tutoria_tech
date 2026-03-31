import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";

/**
 * CRUD de Equipes (Tutorias)
 * Prefixo: /api/teams
 */
export async function teamRoutes(app) {
  // ── GET / — lista equipes com mentora e alunas ───────────────────────────────
  app.get("/", async (_req, reply) => {
    const teams = await prisma.team.findMany({
      include: {
        mentor:   { select: { id: true, name: true, email: true } },
        students: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return reply.send(teams);
  });

  // ── GET /:id — busca equipe por ID ───────────────────────────────────────────
  app.get("/:id", async (req, reply) => {
    const team = await prisma.team.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        mentor:   { select: { id: true, name: true, email: true } },
        students: { select: { id: true, name: true, email: true } },
      },
    });
    if (!team) return reply.status(404).send({ message: "Equipe não encontrada." });
    return reply.send(team);
  });

  // ── POST / — cria equipe ─────────────────────────────────────────────────────
  app.post("/", {
    schema: {
      body: {
        type: "object",
        required: ["name", "mentorId"],
        properties: {
          name:        { type: "string" },
          mentorId:    { type: "integer" },
          studentIds:  { type: "array", items: { type: "integer" } },
          thunkableUrl:{ type: "string" },
          status:      {
            type: "string",
            enum: ["IDEACAO", "PROTOTIPAGEM", "EM_DESENVOLVIMENTO", "CONCLUIDO"],
          },
        },
      },
    },
  }, async (req, reply) => {
    const { name, mentorId, studentIds = [], thunkableUrl, status } = req.body;

    // Valida que a mentora existe e tem o papel correto
    const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
    if (!mentor || mentor.role !== "MENTORA") {
      return reply.status(400).send({ message: "mentorId deve referenciar um usuário com papel MENTORA." });
    }

    const team = await prisma.team.create({
      data: {
        name,
        thunkableUrl,
        status: status ?? "IDEACAO",
        mentor:   { connect: { id: mentorId } },
        students: { connect: studentIds.map((id) => ({ id })) },
      },
      include: {
        mentor:   { select: { id: true, name: true, email: true } },
        students: { select: { id: true, name: true, email: true } },
      },
    });

    await logActivity(`Nova equipe criada: ${name} (mentora: ${mentor.name})`);
    return reply.status(201).send(team);
  });

  // ── PUT /:id — atualiza equipe ───────────────────────────────────────────────
  app.put("/:id", {
    schema: {
      body: {
        type: "object",
        properties: {
          name:         { type: "string" },
          mentorId:     { type: "integer" },
          studentIds:   { type: "array", items: { type: "integer" } },
          thunkableUrl: { type: "string" },
          status:       {
            type: "string",
            enum: ["IDEACAO", "PROTOTIPAGEM", "EM_DESENVOLVIMENTO", "CONCLUIDO"],
          },
        },
      },
    },
  }, async (req, reply) => {
    const id = Number(req.params.id);
    const { name, mentorId, studentIds, thunkableUrl, status } = req.body;

    // Valida mentora se informada
    if (mentorId) {
      const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
      if (!mentor || mentor.role !== "MENTORA") {
        return reply.status(400).send({ message: "mentorId deve referenciar um usuário com papel MENTORA." });
      }
    }

    const data = {};
    if (name)         data.name         = name;
    if (thunkableUrl !== undefined) data.thunkableUrl = thunkableUrl;
    if (status)       data.status       = status;
    if (mentorId)     data.mentor       = { connect: { id: mentorId } };
    // `set` substitui completamente a lista de alunas
    if (studentIds)   data.students     = { set: studentIds.map((sid) => ({ id: sid })) };

    try {
      const team = await prisma.team.update({
        where: { id },
        data,
        include: {
          mentor:   { select: { id: true, name: true, email: true } },
          students: { select: { id: true, name: true, email: true } },
        },
      });
      return reply.send(team);
    } catch {
      return reply.status(404).send({ message: "Equipe não encontrada." });
    }
  });

  // ── DELETE /:id — remove equipe ──────────────────────────────────────────────
  app.delete("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    try {
      const team = await prisma.team.delete({ where: { id } });
      await logActivity(`Equipe removida: ${team.name}`);
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: "Equipe não encontrada." });
    }
  });
}
