import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";
import { requireRole } from "../lib/requireRole.js";

const adminOnly = (app) => requireRole(app, "ADMIN");

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

  // ── POST / — cria equipe (ADMIN ou MENTORA) ──────────────────────────────────
  app.post("/", {
    onRequest: [app.authenticate],
    schema: {
      body: {
        type: "object",
        required: ["name", "mentorId"],
        properties: {
          name:         { type: "string" },
          description:  { type: "string" },
          mentorId:     { type: "integer" },
          studentIds:   { type: "array", items: { type: "integer" } },
          thunkableUrl: { type: "string" },
          telegramUrl:  { type: "string" },
          whatsappUrl:  { type: "string" },
          accessCode:   { type: "string" },
          status:       {
            type: "string",
            enum: ["IDEACAO", "PROTOTIPAGEM", "EM_DESENVOLVIMENTO", "CONCLUIDO"],
          },
        },
      },
    },
  }, async (req, reply) => {
    const { name, description, mentorId, studentIds = [], thunkableUrl, telegramUrl, whatsappUrl, accessCode, status } = req.body;

    const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
    if (!mentor || mentor.role !== "MENTORA") {
      return reply.status(400).send({ message: "mentorId deve referenciar um usuário com papel MENTORA." });
    }

    // Segurança: Mentora só cria equipe para si mesma. Admin cria para qualquer uma.
    if (req.user.role === "MENTORA" && mentorId !== req.user.id) {
      return reply.status(403).send({ message: "Você só pode criar equipes para você mesma." });
    }

    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        thunkableUrl,
        telegramUrl: telegramUrl || null,
        whatsappUrl: whatsappUrl || null,
        accessCode:  accessCode || null,
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

  // ── PUT /:id — atualiza equipe (ADMIN ou MENTORA da própria equipe) ──────────
  app.put("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const existingTeam = await prisma.team.findUnique({ where: { id } });
    if (!existingTeam) return reply.status(404).send({ message: "Equipe não encontrada." });

    // Permissão: ADMIN ou Mentora da própria equipe
    if (userRole !== "ADMIN" && (userRole !== "MENTORA" || existingTeam.mentorId !== userId)) {
      return reply.status(403).send({ message: "Você não tem permissão para editar esta equipe." });
    }

    const { name, description, mentorId, studentIds, thunkableUrl, telegramUrl, whatsappUrl, accessCode, status } = req.body;

    if (mentorId && userRole === "ADMIN") {
      const mentor = await prisma.user.findUnique({ where: { id: mentorId } });
      if (!mentor || mentor.role !== "MENTORA") {
        return reply.status(400).send({ message: "mentorId deve referenciar um usuário com papel MENTORA." });
      }
    }

    const data = {};
    if (name)                    data.name         = name;
    if (description !== undefined) data.description = description || null;
    if (thunkableUrl !== undefined) data.thunkableUrl = thunkableUrl;
    if (telegramUrl  !== undefined) data.telegramUrl  = telegramUrl || null;
    if (whatsappUrl  !== undefined) data.whatsappUrl  = whatsappUrl || null;
    if (accessCode   !== undefined) data.accessCode   = accessCode || null;
    if (status)                  data.status       = status;
    
    // Mentora não pode mudar o mentor da equipe, só ADMIN
    if (mentorId && userRole === "ADMIN") data.mentor = { connect: { id: mentorId } };
    
    if (studentIds)              data.students     = { set: studentIds.map((sid) => ({ id: sid })) };

    const team = await prisma.team.update({
      where: { id },
      data,
      include: {
        mentor:   { select: { id: true, name: true, email: true } },
        students: { select: { id: true, name: true, email: true } },
      },
    });
    return reply.send(team);
  });

  // ── POST /:id/join — aluna entra na equipe via senha ───────────────────────
  app.post("/:id/join", async (req, reply) => {
    const id = Number(req.params.id);
    const { code } = req.body;
    const userId = req.user.id;

    const team = await prisma.team.findUnique({ 
      where: { id },
      include: { students: true }
    });

    if (!team) return reply.status(404).send({ message: "Equipe não encontrada." });
    
    if (team.accessCode && team.accessCode !== code) {
      return reply.status(403).send({ message: "Senha da tutoria incorreta." });
    }

    // Adiciona aluna à equipe
    await prisma.team.update({
      where: { id },
      data: {
        students: { connect: { id: userId } }
      }
    });

    await logActivity(`Usuário ${userId} entrou na equipe ${team.name}`);
    return reply.send({ message: "Você entrou na equipe com sucesso!" });
  });

  // ── DELETE /:id — remove equipe (ADMIN) ──────────────────────────────────────
  app.delete("/:id", {
    onRequest: [adminOnly(app)],
  }, async (req, reply) => {
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
