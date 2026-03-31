/**
 * Fábrica de decorator que exige papel(is) no JWT.
 * Uso: onRequest: [requireRole(app, "ADMIN", "MENTORA")]
 */
export function requireRole(app, ...roles) {
  return async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      return reply.status(401).send({ message: "Token inválido ou expirado." });
    }
    if (!roles.includes(req.user.role)) {
      return reply.status(403).send({
        message: `Acesso negado. Requer papel: ${roles.join(" ou ")}.`,
      });
    }
  };
}
