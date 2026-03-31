import prisma from "../lib/prisma.js";
import { logActivity } from "../lib/activity.js";

/**
 * CRUD de Materiais de Apoio
 * Prefixo: /api/materials
 */
export async function materialRoutes(app) {
  // ── GET / — lista todos os materiais ────────────────────────────────────────
  app.get("/", async (_req, reply) => {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
    });
    return reply.send(materials);
  });

  // ── GET /:id — busca material por ID ────────────────────────────────────────
  app.get("/:id", async (req, reply) => {
    const material = await prisma.material.findUnique({
      where: { id: Number(req.params.id) },
    });
    if (!material) return reply.status(404).send({ message: "Material não encontrado." });
    return reply.send(material);
  });

  // ── POST / — cria material ───────────────────────────────────────────────────
  app.post("/", {
    schema: {
      body: {
        type: "object",
        required: ["title"],
        properties: {
          title:       { type: "string" },
          description: { type: "string" },
          fileUrl:     { type: "string" },
          category:    { type: "string" },
          type:        { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const { title, description, fileUrl, category, type } = req.body;

    const material = await prisma.material.create({
      data: { title, description, fileUrl, category: category ?? "Geral", type: type ?? "Guia" },
    });

    await logActivity(`Novo material publicado: "${title}"`);
    return reply.status(201).send(material);
  });

  // ── PUT /:id — atualiza material ─────────────────────────────────────────────
  app.put("/:id", {
    schema: {
      body: {
        type: "object",
        properties: {
          title:       { type: "string" },
          description: { type: "string" },
          fileUrl:     { type: "string" },
          category:    { type: "string" },
          type:        { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const id = Number(req.params.id);
    const { title, description, fileUrl, category, type } = req.body;

    const data = {};
    if (title       !== undefined) data.title       = title;
    if (description !== undefined) data.description = description;
    if (fileUrl     !== undefined) data.fileUrl     = fileUrl;
    if (category    !== undefined) data.category    = category;
    if (type        !== undefined) data.type        = type;

    try {
      const material = await prisma.material.update({ where: { id }, data });
      return reply.send(material);
    } catch {
      return reply.status(404).send({ message: "Material não encontrado." });
    }
  });

  // ── DELETE /:id — remove material ───────────────────────────────────────────
  app.delete("/:id", async (req, reply) => {
    const id = Number(req.params.id);
    try {
      const material = await prisma.material.delete({ where: { id } });
      await logActivity(`Material removido: "${material.title}"`);
      return reply.status(204).send();
    } catch {
      return reply.status(404).send({ message: "Material não encontrado." });
    }
  });
}
