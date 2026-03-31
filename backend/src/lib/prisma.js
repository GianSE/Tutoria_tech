import { PrismaClient } from "@prisma/client";

// Singleton do PrismaClient para não abrir múltiplas conexões
const prisma = new PrismaClient({
  log: ["error", "warn"],
});

export default prisma;
