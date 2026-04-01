import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../lib/prisma.js";

export async function chatRoutes(fastify, options) {
  fastify.post("/", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const { history = [], message } = req.body;

      // Analytics nao bloqueante: registra pergunta sem atrasar resposta
      void prisma.chatAnalytics.create({
        data: {
          question: String(message ?? ""),
          role: String(req.user?.role ?? "ALUNA"),
        },
      }).catch((error) => {
        req.log.error(error);
      });

      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ["GEMINI_API_KEY", "ROSE_SYSTEM_PROMPT"] } },
      });

      const settingsMap = new Map(settings.map((item) => [item.key, item.value]));

      // 1. Carregar chave da IA exclusivamente do banco
      const apiKey = (settingsMap.get("GEMINI_API_KEY") || "").trim();
      if (!apiKey) {
        return reply.status(503).send({
          message: "A assistente Rose ainda nao foi configurada. Um ADMIN precisa configurar a IA no painel.",
        });
      }

      // 2. Carregar prompt da Rose exclusivamente do banco
      let systemInstruction = (settingsMap.get("ROSE_SYSTEM_PROMPT") || "").trim();
      if (!systemInstruction) {
        return reply.status(503).send({
          message: "O prompt da Rose ainda nao foi configurado. Um ADMIN precisa configurar a IA no painel.",
        });
      }

      const knowledgeDocs = await prisma.knowledgeDocument.findMany({
        orderBy: { createdAt: "asc" },
        select: { content: true },
      });

      const knowledgeTexts = knowledgeDocs
        .map((doc) => (doc.content || "").trim())
        .filter(Boolean)
        .join("\n\n");

      if (knowledgeTexts) {
        systemInstruction += `\n\n--- BASE DE CONHECIMENTO ---\n${knowledgeTexts}`;
      }

      // 3. Inicializar a IA
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
      });

      // 4. Iniciar um chat mantendo o histórico
      const chat = model.startChat({
        history: history.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.parts[0]?.text || msg.text || "" }],
        })),
        generationConfig: {
          maxOutputTokens: 600,
        },
      });

      // 5. Enviar a nova mensagem do usuário e aguardar resposta
      const result = await chat.sendMessage(message);
      const responseText = result.response.text();

      return reply.send({ response: responseText });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ message: "Erro ao processar a mensagem pela IA." });
    }
  });
}
