import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function chatRoutes(fastify, options) {
  fastify.post("/", { preHandler: [fastify.authenticate] }, async (req, reply) => {
    try {
      const { history = [], message } = req.body;

      // 1. Verificar se a chave existe
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return reply.status(500).send({ message: "A chave GEMINI_API_KEY não está configurada no servidor." });
      }

      // 2. Ler as instruções da Rose (Contexto)
      const contextPath = path.join(__dirname, "../docs/rose-context.md");
      const systemInstruction = await fs.readFile(contextPath, "utf-8");

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
