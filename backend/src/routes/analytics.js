import prisma from "../lib/prisma.js";
import { requireRole } from "../lib/requireRole.js";

const STOP_WORDS = new Set([
  "a", "o", "os", "as", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas",
  "que", "para", "por", "com", "um", "uma", "uns", "umas", "como", "se", "ao", "aos", "ou",
  "eu", "tu", "ele", "ela", "eles", "elas", "me", "te", "lhe", "nos", "voces", "vocês", "isso",
  "isto", "essa", "esse", "essas", "esses", "ja", "já", "la", "lá", "ai", "aí", "sera", "será",
  "nao", "não", "sim", "sobre", "minha", "meu", "suas", "seu", "projeto", "rose",
]);

function normalizeToken(token) {
  return token
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getLastSevenDaysKeys() {
  const keys = [];
  const today = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }

  return keys;
}

export async function analyticsRoutes(fastify) {
  fastify.get(
    "/top-terms",
    { preHandler: [requireRole(fastify, "ADMIN")] },
    async (_req, reply) => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const questions = await prisma.chatAnalytics.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { question: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 2000,
        });

        const termCount = new Map();
        const dayKeys = getLastSevenDaysKeys();
        const dayCount = new Map(dayKeys.map((key) => [key, 0]));

        for (const row of questions) {
          const dayKey = row.createdAt.toISOString().slice(0, 10);
          if (dayCount.has(dayKey)) {
            dayCount.set(dayKey, (dayCount.get(dayKey) ?? 0) + 1);
          }

          const tokens = String(row.question ?? "")
            .split(/\s+/)
            .map(normalizeToken)
            .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

          for (const token of tokens) {
            termCount.set(token, (termCount.get(token) ?? 0) + 1);
          }
        }

        const topTerms = Array.from(termCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([term, count]) => ({ term, count }));

        const questionsByDay = dayKeys.map((date) => ({
          date,
          total: dayCount.get(date) ?? 0,
        }));

        return reply.send({ topTerms, questionsByDay });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao gerar analytics de perguntas." });
      }
    },
  );
}
