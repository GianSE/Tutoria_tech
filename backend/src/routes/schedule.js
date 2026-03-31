import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";

const VALID_TYPES   = ["MENINAS_NO_LAB", "RODA_DE_CONVERSA", "SESSAO_DE_TUTORIA", "TECHNOVATION_EVENT"];
const VALID_STATUS  = ["PENDENTE", "REALIZADA", "CANCELADA"];

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
    });
    return reply.send(schedules);
  });

  // ── GET /:id — busca agendamento por ID ──────────────────────────────────────
  app.get("/:id", async (req, reply) => {
    const schedule = await prisma.schedule.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!schedule) return reply.status(404).send({ message: "Agendamento não encontrado." });
    return reply.send(schedule);
  });

  // ── POST / — cria agendamento ─────────────────────────────────────────────────
  app.post("/", {
    schema: {
      body: {
        type: "object",
        required: ["title", "date"],
        properties: {
          title:     { type: "string" },
          date:      { type: "string" },   // ISO 8601
          local:     { type: "string" },
          type:      { type: "string", enum: VALID_TYPES },
          status:    { type: "string", enum: VALID_STATUS },
          presencas: { type: "integer", minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const { title, date, local, type, status, presencas } = req.body;

    const schedule = await prisma.schedule.create({
      data: {
        title,
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

  // ── PUT /:id — atualiza agendamento ──────────────────────────────────────────
  app.put("/:id", {
    schema: {
      body: {
        type: "object",
        properties: {
          title:     { type: "string" },
          date:      { type: "string" },
          local:     { type: "string" },
          type:      { type: "string", enum: VALID_TYPES },
          status:    { type: "string", enum: VALID_STATUS },
          presencas: { type: "integer", minimum: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const id = Number(req.params.id);
    const { title, date, local, type, status, presencas } = req.body;

    const data = {};
    if (title     !== undefined) data.title     = title;
    if (date      !== undefined) data.date      = new Date(date);
    if (local     !== undefined) data.local     = local;
    if (type      !== undefined) data.type      = type;
    if (status    !== undefined) data.status    = status;
    if (presencas !== undefined) data.presencas = presencas;

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

  // ── DELETE /:id — remove agendamento ─────────────────────────────────────────
  app.delete("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    try {
      await prisma.schedule.delete({ where: { id } });
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: "Agendamento não encontrado." });
    }
  });
}
