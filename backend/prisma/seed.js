import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Verifica se o admin já existe para evitar duplicatas
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@projeto.com" },
  });

  if (existingAdmin) {
    console.log(
      "✅ Usuário administrador já existe. Nenhuma ação necessária."
    );
    return;
  }

  // Hash da senha antes de salvar (custo 10 é seguro e rápido)
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

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
