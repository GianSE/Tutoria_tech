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

      // 1. Carregar chave da IA e o prompt do banco
      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ["GEMINI_API_KEY", "ROSE_SYSTEM_PROMPT"] } },
      });
      const settingsMap = new Map(settings.map((item) => [item.key, item.value]));

      const apiKey = (settingsMap.get("GEMINI_API_KEY") || "").trim();
      if (!apiKey) {
        return reply.status(503).send({
          message: "A assistente Rose ainda nao foi configurada. Um ADMIN precisa configurar a IA no painel.",
        });
      }

      const systemInstruction = (settingsMap.get("ROSE_SYSTEM_PROMPT") || "").trim();

      // Repassar a pergunta e a chave para o novo microsserviço (python-ia)
      const pythonApiUrl = process.env.PYTHON_API_URL || "http://python-ia:8000";

      const response = await fetch(`${pythonApiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: message,
          gemini_api_key: apiKey,
          system_prompt: systemInstruction,
          history: history, // Repassa o histórico também
          context_strategy: "TBD"
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Python IA retornou erro: ${response.status} - ${errText}`);
      }

      const pythonData = await response.json();

      return reply.send({ response: pythonData.answer });
    } catch (error) {
      req.log.error(error);
      return reply.status(500).send({ message: "Erro ao processar a mensagem pela IA." });
    }
  });
}
