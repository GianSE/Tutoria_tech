import prisma from "../lib/prisma.js";
import { requireRole } from "../lib/requireRole.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";

const M_ENDPOINT   = process.env.MINIO_ENDPOINT    || "minio";
const M_PORT       = process.env.MINIO_PORT        || "9000";
const M_ACCESS_KEY = process.env.MINIO_ACCESS_KEY  || "minioadmin";
const M_SECRET_KEY = process.env.MINIO_SECRET_KEY  || "minioadmin";
const M_SECURE     = process.env.MINIO_USE_SSL === "true";
const BUCKET_NAME  = process.env.MINIO_BUCKET_NAME || "materiais";
const PYTHON_API_URL = process.env.PYTHON_API_URL  || "http://python-ia:8000";

const s3 = new S3Client({
  endpoint: `${M_SECURE ? "https" : "http"}://${M_ENDPOINT}:${M_PORT}`,
  region: "us-east-1",
  credentials: { accessKeyId: M_ACCESS_KEY, secretAccessKey: M_SECRET_KEY },
  forcePathStyle: true,
});

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === "NotFound" || err.name === "NoSuchBucket") {
      await s3.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
      await s3.send(new PutBucketPolicyCommand({
        Bucket: BUCKET_NAME,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [{ Effect: "Allow", Principal: { AWS: ["*"] }, Action: ["s3:GetObject"], Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`] }],
        }),
      }));
    } else throw err;
  }
}

async function uploadKnowledgeFile(buffer, filename, mimetype) {
  await ensureBucket();
  const key = `knowledge-${Date.now()}-${filename}`;
  await s3.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key, Body: buffer, ContentType: mimetype }));
  return key;
}

async function getGeminiKey() {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "GEMINI_API_KEY" } });
  return setting?.value || "";
}

async function triggerKnowledgeProcessing(documentId, fileKey, apiKey) {
  if (!apiKey) return;
  fetch(`${PYTHON_API_URL}/process_knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, file_name: fileKey, gemini_api_key: apiKey }),
  }).catch((err) => console.error("[knowledge] Erro ao chamar python-ia:", err));
}

async function triggerUrlProcessing(documentId, url, apiKey) {
  if (!apiKey) return;
  fetch(`${PYTHON_API_URL}/process_url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document_id: documentId, url, gemini_api_key: apiKey }),
  }).catch((err) => console.error("[knowledge] Erro ao chamar python-ia para URL:", err));
}

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

  // POST /knowledge/upload — Faz upload de um arquivo e cria KnowledgeDocument
  app.post("/knowledge/upload", { onRequest: [adminOnly(app)] }, async (req, reply) => {
    try {
      const data = await req.file();
      if (!data) return reply.status(400).send({ message: "Nenhum arquivo enviado." });

      const allowed = [".md", ".pdf", ".docx", ".txt", ".xlsx", ".csv", ".pptx"];
      const ext = path.extname(data.filename).toLowerCase();
      if (!allowed.includes(ext)) {
        return reply.status(400).send({ message: "Formato não suportado." });
      }

      const buffer = await data.toBuffer();
      const fileKey = await uploadKnowledgeFile(buffer, data.filename, data.mimetype);
      const doc = await prisma.knowledgeDocument.create({ data: { filename: fileKey } });

      const apiKey = await getGeminiKey();
      if (apiKey) triggerKnowledgeProcessing(doc.id, fileKey, apiKey);

      return reply.status(201).send({ message: "Arquivo enviado com sucesso.", document: doc });
    } catch (err) {
      console.error("[knowledge/upload]", err);
      return reply.status(500).send({ message: err.message || "Erro ao fazer upload." });
    }
  });

  // POST /knowledge/crawl — Rastreia links internos de um site e retorna a lista
  app.post("/knowledge/crawl", { onRequest: [adminOnly(app)] }, async (req, reply) => {
    const { url } = req.body ?? {};
    if (!url || !url.startsWith("http")) {
      return reply.status(400).send({ message: "URL inválida." });
    }
    try {
      const res = await fetch(`${PYTHON_API_URL}/crawl_site`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, max_pages: 30 }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "error") {
        return reply.status(500).send({ message: data.message ?? "Erro ao rastrear o site." });
      }
      return reply.send({ urls: data.urls, total: data.total });
    } catch (err) {
      return reply.status(500).send({ message: "Erro de comunicação com o serviço de IA." });
    }
  });

  // POST /knowledge/crawl-add — Cria KnowledgeDocuments para uma lista de URLs
  app.post("/knowledge/crawl-add", { onRequest: [adminOnly(app)] }, async (req, reply) => {
    const { urls } = req.body ?? {};
    if (!Array.isArray(urls) || urls.length === 0) {
      return reply.status(400).send({ message: "Informe ao menos uma URL." });
    }

    const apiKey = await getGeminiKey();
    const results = [];

    for (const url of urls) {
      const existing = await prisma.knowledgeDocument.findFirst({ where: { filename: url } });
      if (existing) {
        results.push({ url, status: "já existe", id: existing.id });
        continue;
      }
      const doc = await prisma.knowledgeDocument.create({ data: { filename: url } });
      if (apiKey) triggerUrlProcessing(doc.id, url, apiKey);
      results.push({ url, status: "adicionada", id: doc.id });
    }

    return reply.send({ message: `${results.filter(r => r.status === "adicionada").length} URL(s) adicionada(s).`, results });
  });

  // POST /knowledge/url — Adiciona uma URL como documento de conhecimento
  app.post("/knowledge/url", { onRequest: [adminOnly(app)] }, async (req, reply) => {
    const { url } = req.body ?? {};
    if (!url || !url.startsWith("http")) {
      return reply.status(400).send({ message: "URL inválida. Deve começar com http." });
    }

    const existing = await prisma.knowledgeDocument.findFirst({ where: { filename: url } });
    if (existing) return reply.status(409).send({ message: "Esta URL já está na base de conhecimento." });

    const doc = await prisma.knowledgeDocument.create({ data: { filename: url } });

    const apiKey = await getGeminiKey();
    if (apiKey) triggerUrlProcessing(doc.id, url, apiKey);

    return reply.status(201).send({ message: "URL adicionada com sucesso.", document: doc });
  });

  // POST /knowledge/reprocess — Dispara vetorização de documentos existentes
  app.post("/knowledge/reprocess", { onRequest: [adminOnly(app)] }, async (req, reply) => {
    const { ids } = req.body ?? {};
    if (!ids || !ids.length) return reply.status(400).send({ message: "Informe os IDs a reprocessar." });

    const apiKey = await getGeminiKey();
    if (!apiKey) return reply.status(503).send({ message: "Configure a Gemini API Key antes de vetorizar." });

    const docs = await prisma.knowledgeDocument.findMany({ where: { id: { in: ids } } });

    for (const doc of docs) {
      const isUrl = doc.filename.startsWith("http");
      if (isUrl) {
        triggerUrlProcessing(doc.id, doc.filename, apiKey);
      } else {
        triggerKnowledgeProcessing(doc.id, doc.filename, apiKey);
      }
    }

    return reply.send({ message: `Reprocessamento iniciado para ${docs.length} documento(s).` });
  });

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



