import { GoogleGenerativeAI } from "@google/generative-ai";
import path from "path";
import prisma from "../lib/prisma.js";
import { requireRole } from "../lib/requireRole.js";

function maskApiKey(apiKey) {
  if (!apiKey) return "";
  return `${apiKey.slice(0, 6)}***`;
}

function isAllowedKnowledgeExtension(filename = "") {
  const ext = path.extname(filename).toLowerCase();
  return ext === ".md";
}

function preprocessKnowledgeContent(text = "") {
  return text
    .replace(/[\u0000\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{4,}/g, "\n\n")
    .trim();
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

      if (!isAllowedKnowledgeExtension(file.filename)) {
        return reply.status(400).send({
          message: "Formato invalido. Envie apenas arquivos .md.",
        });
      }

      const buffer = await file.toBuffer();
      const content = preprocessKnowledgeContent(buffer.toString("utf-8"));

      if (!content) {
        return reply.status(400).send({ message: "O arquivo enviado esta vazio." });
      }

      const created = await prisma.knowledgeDocument.create({
        data: {
          filename: file.filename,
          content,
        },
        select: {
          id: true,
          filename: true,
          createdAt: true,
        },
      });

      return reply.status(201).send({
        message: "Arquivo enviado com sucesso.",
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
      await prisma.knowledgeDocument.delete({ where: { id } });
      return reply.send({ message: "Documento removido com sucesso." });
    } catch {
      return reply.status(404).send({ message: "Documento nao encontrado." });
    }
  });
}
