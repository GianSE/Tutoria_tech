import prisma from "../lib/prisma.js";
import { requireRole } from "../lib/requireRole.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


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


  // ── DELETE /:id — remove uma opção ──────────────────────────────────────────
  app.delete("/:id", {
    onRequest: [adminOnly(app)]
  }, async (req, reply) => {
    const id = Number(req.params.id);
    await prisma.systemOption.delete({ where: { id } });
    return reply.send({ message: "Opção removida com sucesso." });
  });

  // ── AI SETTINGS ─────────────────────────────────────────────────────────────

  // GET /ai — Busca as configurações de IA (Gemini Key e Rose Prompt)
  app.get("/ai", { onRequest: [adminOnly(app)] }, async (_req, reply) => {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["GEMINI_API_KEY", "ROSE_SYSTEM_PROMPT"] } }
    });

    const result = {
      apiKey: settings.find(s => s.key === "GEMINI_API_KEY")?.value || "",
      systemPrompt: settings.find(s => s.key === "ROSE_SYSTEM_PROMPT")?.value || ""
    };

    return reply.send(result);
  });

  // PUT /ai — Salva as configurações de IA
  app.put("/ai", { onRequest: [adminOnly(app)] }, async (req, reply) => {
    const { apiKey, systemPrompt } = req.body;

    if (apiKey !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "GEMINI_API_KEY" },
        update: { value: apiKey },
        create: { key: "GEMINI_API_KEY", value: apiKey }
      });
    }

    if (systemPrompt !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: "ROSE_SYSTEM_PROMPT" },
        update: { value: systemPrompt },
        create: { key: "ROSE_SYSTEM_PROMPT", value: systemPrompt }
      });
    }

    return reply.send({
      message: "Configurações de IA salvas com sucesso.",
      data: { apiKey, systemPrompt }
    });
  });

  // GET /ai/default-prompt — Lê o prompt padrão do arquivo filesystem
  app.get("/ai/default-prompt", { onRequest: [adminOnly(app)] }, async (_req, reply) => {
    try {
      const filePath = path.join(__dirname, "../docs/rose-context.md");
      const content = await fs.readFile(filePath, "utf-8");
      return reply.send({ prompt: content });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ message: "Erro ao ler prompt padrão no servidor." });
    }
  });

  // POST /ai/test — Testa a conexão com a IA usando a chave fornecida
  app.post("/ai/test", { onRequest: [adminOnly(app)] }, async (req, reply) => {
    const { apiKey } = req.body;
    const pythonApiUrl = process.env.PYTHON_API_URL || "http://python-ia:8000";

    try {
      const response = await fetch(`${pythonApiUrl}/test_key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemini_api_key: apiKey })
      });

      const data = await response.json();

      if (!response.ok) {
        return reply.status(response.status).send({ message: data.detail || "Falha ao validar a chave no Python IA." });
      }

      return reply.send({ message: "Conexão com Gemini validada com sucesso!" });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ message: "Erro de comunicação com o serviço de IA." });
    }
  });

  // ── KNOWLEDGE BASE ─────────────────────────────────────────────────────────

  // GET /knowledge — Lista documentos da base de conhecimento
  app.get("/knowledge", { onRequest: [adminOnly(app)] }, async (_req, reply) => {
    const docs = await prisma.knowledgeDocument.findMany({
      include: {
        _count: { select: { chunks: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    const publicBase = process.env.MINIO_PUBLIC_URL || `http://localhost:9000`;
    const bucketName = process.env.MINIO_BUCKET_NAME || "materiais";

    const result = docs.map(d => ({
      ...d,
      chunksCount: d._count.chunks,
      fileUrl: `${publicBase}/${bucketName}/${d.filename}`
    }));

    return reply.send(result);
  });

  // DELETE /knowledge/:id — Remove um documento
  app.delete("/knowledge/:id", { onRequest: [adminOnly(app)] }, async (req, reply) => {
    const id = Number(req.params.id);
    await prisma.knowledgeDocument.delete({ where: { id } });
    return reply.send({ message: "Documento removido da base de conhecimento." });
  });

  // GET /knowledge/:id/chunks — Busca o conteúdo processado (chunks) do documento
  app.get("/knowledge/:id/chunks", { onRequest: [adminOnly(app)] }, async (req, reply) => {
    const id = Number(req.params.id);
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { documentId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, content: true }
    });
    return reply.send(chunks);
  });

  // ── SYSTEM OPTIONS (GENERIC) ───────────────────────────────────────────────

  // GET /:group — lista opções de um grupo específico
  // Movido para o final para não conflitar com rotas estáticas /ai e /knowledge
  app.get("/:group", async (req, reply) => {
    const { group } = req.params;
    const options = await prisma.systemOption.findMany({
      where: { group },
      orderBy: { label: "asc" }
    });
    return reply.send(options);
  });

  // POST / — cria ou atualiza uma opção
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
}



