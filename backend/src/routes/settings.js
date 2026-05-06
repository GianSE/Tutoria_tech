import prisma from "../lib/prisma.js";
import { requireRole } from "../lib/requireRole.js";

/**
 * Rotas de Configurações do Sistema (System Options)
 * Prefixo: /api/settings
 */
export async function settingsRoutes(app) {
  // Apenas ADMIN pode gerenciar configurações
  const adminOnly = (app) => requireRole(app, "ADMIN");

  // ── GET / — lista todas as opções ──────────────────────────────────────────
  app.get("/", async (_req, reply) => {
    const options = await prisma.systemOption.findMany({
      orderBy: { label: "asc" }
    });
    return reply.send(options);
  });

  // ── GET /:group — lista opções de um grupo específico ───────────────────────
  app.get("/:group", async (req, reply) => {
    const { group } = req.params;
    const options = await prisma.systemOption.findMany({
      where: { group },
      orderBy: { label: "asc" }
    });
    return reply.send(options);
  });

  // ── POST / — cria ou atualiza uma opção ─────────────────────────────────────
  app.post("/", {
    onRequest: [adminOnly(app)],
    schema: {
      body: {
        type: "object",
        required: ["group", "value", "label"],
        properties: {
          group: { type: "string" },
          value: { type: "string" },
          label: { type: "string" },
          color: { type: "string" }
        }
      }
    }
  }, async (req, reply) => {
    const { group, value, label, color } = req.body;
    
    const option = await prisma.systemOption.upsert({
      where: { group_value: { group, value } },
      update: { label, color },
      create: { group, value, label, color }
    });

    return reply.send(option);
  });

  // ── DELETE /:id — remove uma opção ──────────────────────────────────────────
  app.delete("/:id", {
    onRequest: [adminOnly(app)]
  }, async (req, reply) => {
    const id = Number(req.params.id);
    await prisma.systemOption.delete({ where: { id } });
    return reply.send({ message: "Opção removida com sucesso." });
  });
}
