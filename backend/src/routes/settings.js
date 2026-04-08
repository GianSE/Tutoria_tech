import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import prisma from "../lib/prisma.js";
import { requireRole } from "../lib/requireRole.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const M_ENDPOINT = process.env.MINIO_ENDPOINT || "minio";
const M_PORT = process.env.MINIO_PORT || "9000";
const M_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "minioadmin";
const M_SECRET_KEY = process.env.MINIO_SECRET_KEY || "minioadmin";
const M_SECURE = process.env.MINIO_USE_SSL === "true";
const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "materiais";

const s3Client = new S3Client({
  endpoint: `${M_SECURE ? "https" : "http"}://${M_ENDPOINT}:${M_PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: M_ACCESS_KEY,
    secretAccessKey: M_SECRET_KEY,
  },
  forcePathStyle: true,
});

function maskApiKey(apiKey) {
  if (!apiKey) return "";
  return `${apiKey.slice(0, 6)}***`;
}

function isAllowedKnowledgeExtension(filename = "") {
  const ext = path.extname(filename).toLowerCase();
  const allowedExts = [".md", ".pdf", ".docx", ".txt", ".xlsx", ".csv", ".pptx"];
  return allowedExts.includes(ext);
}

function preprocessKnowledgeContent(text = "") {
  return text
    .replace(/[\u0000\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{4,}/g, "\n\n")
    .trim();
}

function splitIntoChunks(text = "") {
  return text
    .split(/\n\n+/g)
    .map((p) => p.trim())
    .filter((p) => p.length >= 50);
}

export async function settingsRoutes(app) {
  const adminOnly = { onRequest: [requireRole(app, "ADMIN")] };

  app.get("/ai", adminOnly, async (_req, reply) => {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: ["GEMINI_API_KEY", "ROSE_SYSTEM_PROMPT"] } },
    });

    const map = new Map(settings.map((item) => [item.key, item.value]));
    const apiKey = map.get("GEMINI_API_KEY") ?? "";
    const systemPrompt = map.get("ROSE_SYSTEM_PROMPT") ?? "";

    return reply.send({
      apiKey: maskApiKey(apiKey),
      systemPrompt,
    });
  });

  app.put("/ai", adminOnly, async (req, reply) => {
    const { apiKey = "", systemPrompt = "" } = req.body ?? {};

    if (typeof systemPrompt !== "string") {
      return reply.status(400).send({ message: "systemPrompt precisa ser texto." });
    }

    await prisma.systemSetting.upsert({
      where: { key: "ROSE_SYSTEM_PROMPT" },
      update: { value: systemPrompt },
      create: { key: "ROSE_SYSTEM_PROMPT", value: systemPrompt },
    });

    const canUpdateApiKey =
      typeof apiKey === "string" && apiKey.trim() !== "" && !apiKey.includes("*");

    if (canUpdateApiKey) {
      await prisma.systemSetting.upsert({
        where: { key: "GEMINI_API_KEY" },
        update: { value: apiKey.trim() },
        create: { key: "GEMINI_API_KEY", value: apiKey.trim() },
      });
    }

    const saved = await prisma.systemSetting.findMany({
      where: { key: { in: ["GEMINI_API_KEY", "ROSE_SYSTEM_PROMPT"] } },
    });

    const map = new Map(saved.map((item) => [item.key, item.value]));

    return reply.send({
      message: "Configuracoes da IA salvas com sucesso.",
      data: {
        apiKey: maskApiKey(map.get("GEMINI_API_KEY") ?? ""),
        systemPrompt: map.get("ROSE_SYSTEM_PROMPT") ?? "",
      },
    });
  });

  app.post("/ai/test", adminOnly, async (req, reply) => {
    // ... codigo de test mantido inalterado
    const { apiKey = "" } = req.body ?? {};

    const submittedKey = typeof apiKey === "string" ? apiKey.trim() : "";
    let keyToTest = "";

    if (submittedKey && !submittedKey.includes("*")) {
      keyToTest = submittedKey;
    } else {
      const keySetting = await prisma.systemSetting.findUnique({ where: { key: "GEMINI_API_KEY" } });
      keyToTest = keySetting?.value?.trim() || "";
    }

    if (!keyToTest) {
      return reply.status(400).send({ message: "Nenhuma Gemini API Key valida foi informada para teste." });
    }

    try {
      const genAI = new GoogleGenerativeAI(keyToTest);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent("Responda apenas com: OK");
      const text = result.response.text() || "OK";

      return reply.send({
        success: true,
        message: "Conexao com Google Generative AI validada com sucesso.",
        response: text,
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(400).send({
        success: false,
        message: "Falha ao validar a Gemini API Key. Verifique a chave e tente novamente.",
      });
    }
  });

  app.get("/knowledge", adminOnly, async (_req, reply) => {
    const docs = await prisma.knowledgeDocument.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        createdAt: true,
      },
    });

    return reply.send(docs);
  });

  app.post("/knowledge/upload", adminOnly, async (req, reply) => {
    try {
      const file = await req.file();

      if (!file) {
        return reply.status(400).send({ message: "Nenhum arquivo foi enviado." });
      }

      const buffer = await file.toBuffer();
      
      // Cria um filename único para não sobrescrever arquivos no MinIO
      const uniqueFileName = `${Date.now()}-${file.filename}`;

      // Salva no MinIO primeiramente
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: uniqueFileName,
          Body: buffer,
          ContentType: file.mimetype,
        })
      );

      // Salva o registro no banco antes do processamento e vetorização em background
      const created = await prisma.knowledgeDocument.create({
        data: { filename: uniqueFileName },
        select: { id: true, filename: true, createdAt: true },
      });

      const keySetting = await prisma.systemSetting.findUnique({
        where: { key: "GEMINI_API_KEY" },
      });
      const apiKey = keySetting?.value?.trim() || "";

      if (apiKey) {
        // Envia para processamento em background pelo microsserviço Python
        const pythonApiUrl = process.env.PYTHON_API_URL || "http://python-ia:8000";
        fetch(`${pythonApiUrl}/process_knowledge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_id: created.id,
            file_name: uniqueFileName,
            gemini_api_key: apiKey
          }),
        }).catch(err => req.log.error(err, "Falha ao avisar python-ia sobre novo knowledge document"));
      }

      return reply.status(201).send({
        message: "Arquivo recebido. A IA está processando o documento em segundo plano.",
        data: created,
      });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ message: "Erro ao processar upload de arquivo." });
    }
  });

  app.delete("/knowledge/:id", adminOnly, async (req, reply) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return reply.status(400).send({ message: "ID invalido." });
    }

    try {
      const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
      if (!doc) {
        return reply.status(404).send({ message: "Documento nao encontrado." });
      }

      // Remover do MinIO
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: doc.filename,
          })
        );
      } catch (minioErr) {
        req.log.warn(minioErr, `Erro ao remover ${doc.filename} do MinIO. Continuando com remocao DB...`);
      }

      // Remover do banco de dados e os knowledge_chunks associados via CASCADE
      await prisma.knowledgeDocument.delete({ where: { id } });
      return reply.send({ message: "Documento e vetores removidos com sucesso." });
    } catch (dbErr) {
      req.log.error(dbErr);
      return reply.status(500).send({ message: "Erro ao excluir o documento." });
    }
  });
}
