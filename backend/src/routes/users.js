import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";

/**
 * CRUD de Usuários
 * Prefixo: /api/users
 */
export async function userRoutes(app) {
  // ── GET / — lista todos os usuários ────────────────────────────────────────
  app.get("/", async (_req, reply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return reply.send(users);
  });

  // ── GET /:id — busca um usuário ─────────────────────────────────────────────
  app.get("/:id", async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return reply.status(404).send({ message: "Usuário não encontrado." });
    return reply.send(user);
  });

  // ── POST / — cria usuário ───────────────────────────────────────────────────
  app.post("/", {
    schema: {
      body: {
        type: "object",
        required: ["name", "email", "password", "role"],
        properties: {
          name:     { type: "string" },
          email:    { type: "string", format: "email" },
          password: { type: "string", minLength: 4 },
          role:     { type: "string", enum: ["ADMIN", "MENTORA", "ALUNA"] },
        },
      },
    },
  }, async (req, reply) => {
    const { name, email, password, role } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return reply.status(409).send({ message: "E-mail já cadastrado." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await logActivity(`Novo usuário cadastrado: ${name} (${role})`);
    return reply.status(201).send(user);
  });

  // ── PUT /:id — atualiza usuário ─────────────────────────────────────────────
  app.put("/:id", {
    schema: {
      body: {
        type: "object",
        properties: {
          name:     { type: "string" },
          email:    { type: "string", format: "email" },
          password: { type: "string", minLength: 4 },
          role:     { type: "string", enum: ["ADMIN", "MENTORA", "ALUNA"] },
        },
      },
    },
  }, async (req, reply) => {
    const id = Number(req.params.id);
    const { name, email, role, password } = req.body;

    const data = {};
    if (name)     data.name  = name;
    if (email)    data.email = email;
    if (role)     data.role  = role;
    if (password) data.password = await bcrypt.hash(password, 10);

    try {
      const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      return reply.send(user);
    } catch {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }
  });

  // ── DELETE /:id — remove usuário ─────────────────────────────────────────────
  app.delete("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    try {
      const user = await prisma.user.delete({ where: { id } });
      await logActivity(`Usuário removido: ${user.name}`);
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }
  });
}
