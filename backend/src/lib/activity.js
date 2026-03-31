import prisma from "../lib/prisma.js";

/**
 * Registra uma entrada no log de atividades do sistema.
 * @param {string} description - Texto descrevendo o evento
 */
export async function logActivity(description) {
  try {
    await prisma.activityLog.create({ data: { description } });
  } catch (err) {
    // Log não deve travar o fluxo principal
    console.error("[ActivityLog] Falha ao registrar atividade:", err.message);
  }
}
