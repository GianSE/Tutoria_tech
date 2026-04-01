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

      const genAI = new GoogleGenerativeAI(apiKey);
      let ragContext = "";

      try {
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const embeddingResult = await embeddingModel.embedContent(message);
        const userVectorValues = embeddingResult?.embedding?.values ?? [];

        if (Array.isArray(userVectorValues) && userVectorValues.length > 0) {
          const nearestChunks = await prisma.$queryRaw`
            SELECT content
            FROM knowledge_chunks
            ORDER BY embedding <=> ${userVectorValues}::vector
            LIMIT 5
          `;

          ragContext = (nearestChunks ?? [])
            .map((row) => row.content)
            .filter(Boolean)
            .join("\n\n");
        }
      } catch (embeddingError) {
        req.log.warn(embeddingError, "Falha ao gerar embedding/buscar contexto RAG. Seguindo sem contexto vetorial.");
      }

      if (ragContext) {
        systemInstruction += `\n\n--- BASE DE CONHECIMENTO ---\n${ragContext}`;
      }

      // 3. Inicializar a IA
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
