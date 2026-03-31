import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

/**
 * Rotas de autenticação
 * Prefixo: /api/auth
 */
export async function authRoutes(app) {
  // POST /api/auth/login
  app.post("/login", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email:    { type: "string", format: "email" },
          password: { type: "string", minLength: 1 },
        },
      },
    },
  }, async (req, reply) => {
    const { email, password } = req.body;

    // Busca o usuário pelo e-mail
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.status(401).send({ message: "Credenciais inválidas." });
    }

    // Verifica senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return reply.status(401).send({ message: "Credenciais inválidas." });
    }

    // Gera o JWT com payload mínimo (sem expor senha)
    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: "8h" }
    );

    return reply.send({
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  });

  // POST /api/auth/me — valida token e retorna dados do usuário logado
  app.get("/me", {
    onRequest: [app.authenticate],
  }, async (req, reply) => {
    const { id } = req.user;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) return reply.status(404).send({ message: "Usuário não encontrado." });
    return reply.send(user);
  });
}
