import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";
import { requireRole } from "../lib/requireRole.js";

const VALID_TYPES   = ["MENINAS_NO_LAB", "RODA_DE_CONVERSA", "SESSAO_DE_TUTORIA", "TECHNOVATION_EVENT"];
const VALID_STATUS  = ["PENDENTE", "REALIZADA", "CANCELADA"];

const adminOrMentor = (app) => requireRole(app, "ADMIN", "MENTORA");

/**
 * CRUD de Agendamentos / Sessões
 * Prefixo: /api/schedules
 */
export async function scheduleRoutes(app) {
  // ── GET / — lista todos os agendamentos ──────────────────────────────────────
  app.get("/", async (req, reply) => {
    const { status, type } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type)   where.type   = type;

    const schedules = await prisma.schedule.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        attendances: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    const now = new Date();
    const result = schedules.map((s) => ({
      ...s,
      isOverdue: s.status === "PENDENTE" && s.date < now,
    }));

    return reply.send(result);
  });

  // ── GET /:id — busca agendamento por ID ──────────────────────────────────────
  app.get("/:id", async (req, reply) => {
    const schedule = await prisma.schedule.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        attendances: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });
    if (!schedule) return reply.status(404).send({ message: "Agendamento não encontrado." });
    const now = new Date();
    return reply.send({ ...schedule, isOverdue: schedule.status === "PENDENTE" && schedule.date < now });
  });

  // ── POST / — cria agendamento (ADMIN / MENTORA) ───────────────────────────────
  app.post("/", {
    onRequest: [adminOrMentor(app)],
    schema: {
      body: {
        type: "object",
        required: ["title", "date"],
        properties: {
          title:       { type: "string" },
          description: { type: "string" },
          date:        { type: "string" },
          local:       { type: "string" },
          type:        { type: "string", enum: VALID_TYPES },
          status:      { type: "string", enum: VALID_STATUS },
          presencas:   { type: "integer", minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const { title, description, date, local, type, status, presencas } = req.body;

    const schedule = await prisma.schedule.create({
      data: {
        title,
        description,
        date:      new Date(date),
        local,
        type:      type      ?? "SESSAO_DE_TUTORIA",
        status:    status    ?? "PENDENTE",
        presencas: presencas ?? 0,
      },
    });

    await logActivity(`Novo evento agendado: "${title}" em ${new Date(date).toLocaleDateString("pt-BR")}`);
    return reply.status(201).send(schedule);
  });

  // ── PUT /:id — atualiza agendamento (ADMIN / MENTORA) ────────────────────────
  app.put("/:id", {
    onRequest: [adminOrMentor(app)],
    schema: {
      body: {
        type: "object",
        properties: {
          title:       { type: "string" },
          description: { type: "string" },
          date:        { type: "string" },
          local:       { type: "string" },
          type:        { type: "string", enum: VALID_TYPES },
          status:      { type: "string", enum: VALID_STATUS },
          presencas:   { type: "integer", minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const id = Number(req.params.id);
    const { title, description, date, local, type, status, presencas } = req.body;

    const data = {};
    if (title       !== undefined) data.title       = title;
    if (description !== undefined) data.description = description;
    if (date        !== undefined) data.date        = new Date(date);
    if (local       !== undefined) data.local       = local;
    if (type        !== undefined) data.type        = type;
    if (status      !== undefined) data.status      = status;
    if (presencas   !== undefined) data.presencas   = presencas;

    // Registra atividade se a sessão foi marcada como realizada
    if (status === "REALIZADA") {
      const old = await prisma.schedule.findUnique({ where: { id }, select: { title: true } });
      if (old) await logActivity(`Sessão "${old.title}" marcada como realizada`);
    }

    try {
      const schedule = await prisma.schedule.update({ where: { id }, data });
      return reply.send(schedule);
    } catch {
      return reply.status(404).send({ message: "Agendamento não encontrado." });
    }
  });

  // ── DELETE /:id — remove agendamento (ADMIN / MENTORA) ───────────────────────
  app.delete("/:id", {
    onRequest: [adminOrMentor(app)],
  }, async (req, reply) => {
    const id = Number(req.params.id);
    try {
      await prisma.schedule.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: "Agendamento não encontrado." });
    }
  });
}
