import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";

import { authRoutes }       from "./routes/auth.js";
import { userRoutes }       from "./routes/users.js";
import { teamRoutes }       from "./routes/teams.js";
import { materialRoutes }   from "./routes/materials.js";
import { scheduleRoutes }   from "./routes/schedule.js";
import { dashboardRoutes }  from "./routes/dashboard.js";
import { attendanceRoutes } from "./routes/attendance.js";
import { progressRoutes }   from "./routes/progress.js";
import { chatRoutes }       from "./routes/chat.js";
import { settingsRoutes }   from "./routes/settings.js";

const app = Fastify({ logger: true });

// ─── Plugins ──────────────────────────────────────────────────────────────────
await app.register(cors, { origin: "http://localhost:5173" });

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "fallback_secret_troque_em_producao",
});

await app.register(multipart, {
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Decorator para uso simples em decoradores inline
app.decorate("authenticate", async (req, reply) => {
  try { await req.jwtVerify(); }
  catch { return reply.status(401).send({ message: "Token inválido ou expirado." }); }
});

// ─── Rotas ────────────────────────────────────────────────────────────────────
await app.register(authRoutes,       { prefix: "/api/auth" });
await app.register(userRoutes,       { prefix: "/api/users" });
await app.register(teamRoutes,       { prefix: "/api/teams" });
await app.register(progressRoutes,   { prefix: "/api/teams" });      // compartilha prefixo /api/teams
await app.register(materialRoutes,   { prefix: "/api/materials" });
await app.register(scheduleRoutes,   { prefix: "/api/schedules" });
await app.register(attendanceRoutes, { prefix: "/api/schedules" });  // compartilha prefixo /api/schedules
await app.register(dashboardRoutes,  { prefix: "/api/dashboard" });
await app.register(settingsRoutes,   { prefix: "/api/settings" });
await app.register(chatRoutes,       { prefix: "/api/chat" });

// Health-check
app.get("/", async () => ({ status: "ok", service: "tutoria-backend" }));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "3001");
try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`🚀 Backend rodando em http://0.0.0.0:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
