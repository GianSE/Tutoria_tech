import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Verifica se o admin ja existe para evitar duplicatas
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@projeto.com" },
  });

  if (existingAdmin) {
    console.log(
      "✅ Usuário administrador já existe. Nenhuma ação necessária."
    );
  } else {
    // Hash da senha antes de salvar (custo 10 e seguro e rapido)
    const hashedPassword = await bcrypt.hash("admin", 10);

    const admin = await prisma.user.create({
      data: {
        name: "Administrador",
        email: "admin@projeto.com",
        password: hashedPassword,
        role: "ADMIN",        // ADMIN permanece igual no novo enum
      },
    });

    console.log(`✅ Usuário administrador criado com sucesso!`);
    console.log(`   ID   : ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role : ${admin.role}`);
  }

  const settingsCount = await prisma.systemSetting.count();
  if (settingsCount === 0) {
    const contextPath = path.resolve(__dirname, "../src/docs/rose-context.md");
    let defaultPrompt = "Voce e a Rose, assistente IA do Tutoria Tech. Responda com clareza, empatia e foco educacional.";

    try {
      defaultPrompt = await fs.readFile(contextPath, "utf-8");
    } catch (error) {
      console.warn("⚠️ Nao foi possivel ler o prompt padrao da Rose. Usando fallback interno.");
    }

    await prisma.systemSetting.createMany({
      data: [
        { key: "ROSE_SYSTEM_PROMPT", value: defaultPrompt },
        { key: "GEMINI_API_KEY", value: "" },
      ],
    });

    console.log("✅ Configuracoes iniciais da IA criadas em system_settings.");
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
