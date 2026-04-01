import prisma from "../lib/prisma.js";
import { requireRole } from "../lib/requireRole.js";

const STOP_WORDS = new Set([
  "a", "o", "os", "as", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas",
  "que", "para", "por", "com", "um", "uma", "uns", "umas", "como", "se", "ao", "aos", "ou",
  "eu", "tu", "ele", "ela", "eles", "elas", "me", "te", "lhe", "nos", "voces", "vocês", "isso",
  "isto", "essa", "esse", "essas", "esses", "ja", "já", "la", "lá", "ai", "aí", "sera", "será",
  "nao", "não", "sim", "sobre", "minha", "meu", "suas", "seu", "projeto", "rose",
]);

const GROUP_BY_VALUES = new Set(["day", "week", "month"]);

function normalizeToken(token) {
  return token
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getDateKeysInRange(startDate, endDate) {
  const keys = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthStart(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getPeriodKeysInRange(startDate, endDate, groupBy) {
  if (groupBy === "day") {
    return getDateKeysInRange(startDate, endDate);
  }

  const keys = [];

  if (groupBy === "week") {
    const cursor = getWeekStart(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
      keys.push(getISOWeekKey(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }

    return keys;
  }

  const cursor = getMonthStart(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (cursor <= end) {
    keys.push(getPeriodKey(cursor, "month"));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return keys;
}

function toStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getISOWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getPeriodKey(date, groupBy) {
  if (groupBy === "week") {
    return getISOWeekKey(date);
  }
  if (groupBy === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  return date.toISOString().slice(0, 10);
}

export async function analyticsRoutes(fastify) {
  fastify.get(
    "/top-terms",
    { preHandler: [requireRole(fastify, "ADMIN")] },
    async (req, reply) => {
      try {
        const now = new Date();
        const fallbackStart = new Date(now);
        fallbackStart.setDate(fallbackStart.getDate() - 6);

        const { startDate, endDate, groupBy } = req.query ?? {};
        const selectedGroupBy = GROUP_BY_VALUES.has(groupBy) ? groupBy : "day";

        const parsedStartDate = startDate ? new Date(`${startDate}T00:00:00`) : fallbackStart;
        const parsedEndDate = endDate ? new Date(`${endDate}T00:00:00`) : now;

        if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
          return reply.status(400).send({ message: "Datas inválidas. Use o formato YYYY-MM-DD." });
        }

        const rangeStart = toStartOfDay(parsedStartDate);
        const rangeEnd = toEndOfDay(parsedEndDate);

        if (rangeStart > rangeEnd) {
          return reply.status(400).send({ message: "A data inicial não pode ser maior que a data final." });
        }

        const questions = await prisma.chatAnalytics.findMany({
          where: { createdAt: { gte: rangeStart, lte: rangeEnd } },
          select: { question: true, createdAt: true },
          orderBy: { createdAt: "asc" },
          take: 2000,
        });

        const termCount = new Map();
        const periodKeys = getPeriodKeysInRange(rangeStart, rangeEnd, selectedGroupBy);
        const periodCount = new Map(periodKeys.map((key) => [key, 0]));

        for (const row of questions) {
          const periodKey = getPeriodKey(row.createdAt, selectedGroupBy);
          periodCount.set(periodKey, (periodCount.get(periodKey) ?? 0) + 1);

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

        const questionsByPeriod = Array.from(periodCount.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([period, total]) => ({ period, total }));

        return reply.send({
          topTerms,
          groupBy: selectedGroupBy,
          range: {
            startDate: rangeStart.toISOString().slice(0, 10),
            endDate: rangeEnd.toISOString().slice(0, 10),
          },
          questionsByPeriod,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ message: "Erro ao gerar analytics de perguntas." });
      }
    },
  );
}
