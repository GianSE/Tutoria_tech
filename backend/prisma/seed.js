import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🌱 Iniciando seed robusto do banco de dados...");

  const defaultPass = await bcrypt.hash("password123", 10);

  // 1. Admin
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@projeto.com" } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: "Administrador",
        email: "admin@projeto.com",
        password: await bcrypt.hash("admin", 10),
        role: "ADMIN",
      },
    });
    console.log("✅ Admin criado.");
  }

  // 2. Mentoras (10)
  const FIRST_NAMES = ["Ana", "Beatriz", "Carla", "Daniela", "Elena", "Fernanda", "Gabriela", "Helena", "Isabela", "Juliana", "Mariana", "Patrícia", "Renata", "Sofia", "Thais", "Vanessa", "Alice", "Carolina", "Diana", "Elisa"];
  const LAST_NAMES = ["Silva", "Oliveira", "Santos", "Lima", "Costa", "Souza", "Rocha", "Dias", "Martins", "Pereira", "Almeida", "Nascimento", "Barbosa", "Melo", "Cardoso", "Ribeiro"];

  const mentors = [];
  for (let i = 0; i < 10; i++) {
    const email = `mentora${i + 1}@tutoria.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
      user = await prisma.user.create({
        data: { name, email, password: defaultPass, role: "MENTORA" }
      });
    }
    mentors.push(user);
  }
  console.log(`✅ ${mentors.length} mentoras preparadas.`);

  // 3. Alunas (30)
  const alunas = [];
  for (let i = 1; i <= 30; i++) {
    const email = `aluna${i}@tutoria.com`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const fnIdx = (i + 5) % FIRST_NAMES.length;
      const lnIdx = (i * 3) % LAST_NAMES.length;
      const name = `${FIRST_NAMES[fnIdx]} ${LAST_NAMES[lnIdx]}`;
      user = await prisma.user.create({
        data: { name, email, password: defaultPass, role: "ALUNA" }
      });
    }
    alunas.push(user);
  }
  console.log(`✅ ${alunas.length} alunas preparadas.`);

  // 4. Equipes (5)
  const teamNames = ["DevStars", "CodeQueens", "CyberGirls", "AlgorithmAngels", "LogicLadies"];
  const teams = [];
  const teamStatus = ["IDEACAO", "PROTOTIPAGEM", "EM_DESENVOLVIMENTO", "CONCLUIDO"];
  
  for (let i = 0; i < teamNames.length; i++) {
    const name = teamNames[i];
    let team = await prisma.team.findFirst({ where: { name } });
    if (!team) {
      const mentor = mentors[i % mentors.length];
      const startIdx = i * 6;
      const teamAlunas = alunas.slice(startIdx, startIdx + 6);
      
      team = await prisma.team.create({
        data: {
          name,
          mentorId: mentor.id,
          status: teamStatus[i % teamStatus.length],
          whatsappUrl: "https://chat.whatsapp.com/exemplo",
          telegramUrl: "https://t.me/exemplo",
          students: { connect: teamAlunas.map(a => ({ id: a.id })) }
        }
      });
    }
    teams.push(team);
  }
  console.log(`✅ ${teams.length} equipes criadas.`);

  // 5. Materiais (7)
  const materialList = [
    { title: "Introdução à Lógica de Programação", cat: "Iniciante", type: "PDF" },
    { title: "Guia de HTML e CSS para Iniciantes", cat: "WebDesign", type: "Ebook" },
    { title: "Algoritmos e Estruturas de Dados", cat: "Intermediário", type: "Guia" },
    { title: "Versionamento com Git e GitHub", cat: "Ferramentas", type: "Vídeo Aula" },
    { title: "Desenvolvimento Mobile com React Native", cat: "Avançado", type: "Curso" },
    { title: "Design UI/UX no Figma", cat: "Design", type: "Template" },
    { title: "Banco de Dados e SQL", cat: "Backend", type: "CheatSheet" },
  ];
  const materialsCount = await prisma.material.count();
  if (materialsCount < 7) {
    for (const m of materialList) {
       await prisma.material.create({
         data: { title: m.title, category: m.cat, type: m.type, description: `Conteúdo completo sobre ${m.title}.` }
       });
    }
    console.log("✅ 7 Materiais publicados.");
  }

  // 6. Agenda (15 sessões: 10 realizadas, 5 pendentes)
  const scheduleCount = await prisma.schedule.count();
  if (scheduleCount < 15) {
    // 10 Realizadas (Passado)
    for (let i = 1; i <= 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 3)); // Intervalo de 3 dias no passado
      await prisma.schedule.create({
        data: {
          title: `Sessão de Tutoria #${i}`,
          date,
          local: "Laboratório 01 / Online",
          status: "REALIZADA",
          type: "SESSAO_DE_TUTORIA",
          presencas: Math.floor(Math.random() * 20) + 10
        }
      });
    }
    // 5 Pendentes (Futuro)
    for (let i = 1; i <= 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + (i * 2)); // Futuro
      await prisma.schedule.create({
        data: {
          title: `Meetup Tech - Workshop ${i}`,
          date,
          local: "Auditório Central",
          status: "PENDENTE",
          type: "TECHNOVATION_EVENT"
        }
      });
    }
    console.log("✅ 15 sessões de agenda criadas.");
  }

  // 7. System Settings
  const settingsCount = await prisma.systemSetting.count();
  if (settingsCount === 0) {
    const contextPath = path.resolve(__dirname, "../src/docs/rose-context.md");
    let defaultPrompt = "Voce e a Rose, assistente IA do Tutoria Tech. Responda com clareza, empatia e foco educacional.";
    try { defaultPrompt = await fs.readFile(contextPath, "utf-8"); } catch {}
    await prisma.systemSetting.createMany({
      data: [
        { key: "ROSE_SYSTEM_PROMPT", value: defaultPrompt },
        { key: "GEMINI_API_KEY", value: "" },
      ],
    });
    console.log("✅ Configurações iniciais criadas.");
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
