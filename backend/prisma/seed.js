import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── MinIO client (para seed de arquivos de conhecimento) ─────────────────────
const BUCKET = process.env.MINIO_BUCKET_NAME || "materiais";
const s3Seed = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT || "minio"}:${process.env.MINIO_PORT || "9000"}`,
  region: "us-east-1",
  credentials: {
    accessKeyId:     process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true,
});

async function ensureBucketSeed() {
  try {
    await s3Seed.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === "NotFound" || err.name === "NoSuchBucket") {
      await s3Seed.send(new CreateBucketCommand({ Bucket: BUCKET }));
      await s3Seed.send(new PutBucketPolicyCommand({
        Bucket: BUCKET,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [{ Effect: "Allow", Principal: { AWS: ["*"] }, Action: ["s3:GetObject"], Resource: [`arn:aws:s3:::${BUCKET}/*`] }],
        }),
      }));
    } else throw err;
  }
}

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  const defaultPass = await bcrypt.hash("password123", 10);

  // ── 1. Usuários fixos de demonstração (upsert por email) ─────────────────────
  const admin = await prisma.user.upsert({
    where:  { email: "admin@projeto.com" },
    update: {},
    create: { name: "Administrador", email: "admin@projeto.com", password: await bcrypt.hash("admin", 10), role: "ADMIN" },
  });

  // mentora1 — usada no botão de acesso rápido
  const mentora1 = await prisma.user.upsert({
    where:  { email: "mentora1@tutoria.com" },
    update: { name: "Ana Silva" },
    create: { name: "Ana Silva", email: "mentora1@tutoria.com", password: defaultPass, role: "MENTORA" },
  });

  // aluna1 — usada no botão de acesso rápido
  const aluna1 = await prisma.user.upsert({
    where:  { email: "aluna1@tutoria.com" },
    update: { name: "Beatriz Oliveira" },
    create: { name: "Beatriz Oliveira", email: "aluna1@tutoria.com", password: defaultPass, role: "ALUNA" },
  });

  console.log("✅ Usuários de demonstração garantidos.");

  // ── 2. Demais mentoras (2–10) ─────────────────────────────────────────────────
  const FIRST = ["Carla", "Daniela", "Elena", "Fernanda", "Gabriela", "Helena", "Isabela", "Juliana", "Mariana"];
  const LAST  = ["Santos", "Lima", "Costa", "Souza", "Rocha", "Dias", "Martins", "Pereira", "Almeida"];

  const mentors = [mentora1];
  for (let i = 0; i < 9; i++) {
    const email = `mentora${i + 2}@tutoria.com`;
    const user = await prisma.user.upsert({
      where:  { email },
      update: {},
      create: { name: `${FIRST[i]} ${LAST[i]}`, email, password: defaultPass, role: "MENTORA" },
    });
    mentors.push(user);
  }

  // ── 3. Demais alunas (2–30) ───────────────────────────────────────────────────
  const FN = ["Carolina", "Diana", "Elisa", "Fernanda", "Giovana", "Helena", "Isabela", "Julia", "Karla", "Laura",
              "Mariana", "Natalia", "Olivia", "Patricia", "Quintina", "Raquel", "Sofia", "Tatiana", "Ursula", "Vanessa",
              "Wendy", "Xenia", "Yasmin", "Zara", "Amanda", "Bruna", "Camila", "Debora", "Erika"];
  const LN = ["Ribeiro", "Cardoso", "Nascimento", "Barbosa", "Melo", "Ferreira", "Cavalcanti", "Azevedo", "Moreira",
              "Correia", "Teixeira", "Freitas", "Carvalho", "Monteiro", "Lopes", "Vieira", "Cunha", "Pinto", "Macedo", "Ramos",
              "Gomes", "Borges", "Figueiredo", "Moraes", "Andrade", "Castro", "Marques", "Rezende", "Torres"];

  const alunas = [aluna1];
  for (let i = 0; i < 29; i++) {
    const email = `aluna${i + 2}@tutoria.com`;
    const user = await prisma.user.upsert({
      where:  { email },
      update: {},
      create: { name: `${FN[i]} ${LN[i]}`, email, password: defaultPass, role: "ALUNA" },
    });
    alunas.push(user);
  }

  console.log(`✅ ${mentors.length} mentoras e ${alunas.length} alunas preparadas.`);

  // ── 4. Times (upsert: atualiza accessCode, descrição e conecta alunas) ────────
  const teamData = [
    {
      name:        "DevStars",
      status:      "EM_DESENVOLVIMENTO",
      accessCode:  "devstars2024",
      description: "Desenvolvendo um app de apoio ao estudo para alunas do ensino médio.",
      mentorIdx:   0,          // mentora1
      alunaRange:  [0, 6],     // aluna1..aluna6 (inclui aluna1)
    },
    {
      name:        "CodeQueens",
      status:      "PROTOTIPAGEM",
      accessCode:  "codequeens01",
      description: "App de doação de alimentos para combater o desperdício na cidade.",
      mentorIdx:   1,
      alunaRange:  [6, 12],
    },
    {
      name:        "CyberGirls",
      status:      "IDEACAO",
      accessCode:  "cybergirls99",
      description: "Soluções digitais para segurança online de adolescentes.",
      mentorIdx:   2,
      alunaRange:  [12, 18],
    },
    {
      name:        "AlgorithmAngels",
      status:      "CONCLUIDO",
      accessCode:  "angels2024",
      description: "App de tutoria entre estudantes do ensino médio — projeto finalizado!",
      mentorIdx:   3,
      alunaRange:  [18, 24],
    },
    {
      name:        "LogicLadies",
      status:      "PROTOTIPAGEM",
      accessCode:  "logicladies",
      description: "Plataforma gamificada para ensino de lógica de programação.",
      mentorIdx:   4,
      alunaRange:  [24, 30],
    },
  ];

  const teams = [];
  for (const td of teamData) {
    const mentor     = mentors[td.mentorIdx];
    const teamAlunas = alunas.slice(...td.alunaRange);

    let team = await prisma.team.findFirst({ where: { name: td.name } });
    if (!team) {
      team = await prisma.team.create({
        data: {
          name:        td.name,
          description: td.description,
          mentorId:    mentor.id,
          status:      td.status,
          accessCode:  td.accessCode,
          whatsappUrl: "https://chat.whatsapp.com/exemplo",
          telegramUrl: "https://t.me/exemplo",
          students:    { connect: teamAlunas.map((a) => ({ id: a.id })) },
        },
      });
    } else {
      // Garante que os campos novos e as alunas estejam corretos
      team = await prisma.team.update({
        where: { id: team.id },
        data:  {
          description: td.description,
          accessCode:  td.accessCode,
          whatsappUrl: "https://chat.whatsapp.com/exemplo",
          telegramUrl: "https://t.me/exemplo",
          students:    { connect: teamAlunas.map((a) => ({ id: a.id })) },
        },
      });
    }
    teams.push(team);
  }

  console.log(`✅ ${teams.length} equipes garantidas (com accessCode e alunas conectadas).`);

  // ── 5. Progresso das alunas (upsert — sobrescreve se já existe) ───────────────
  // Formato: [teamIndex, alunaIndexDentroDoTime, stage, notes]
  const progressData = [
    // ─── DevStars (team 0) — mentora1 + aluna1..aluna6 ───────────────────────
    // aluna1 (idx 0 no time) → demonstração principal do acesso rápido
    [0, 0, "AVANCADO",      "Evolução incrível! Já implementou 3 telas com design responsivo e integração com API."],
    [0, 1, "DESENVOLVENDO", "Aprendendo React Native com consistência. Precisa praticar mais os hooks de estado."],
    [0, 2, "DESENVOLVENDO", "Concluiu o módulo de banco de dados. Progresso sólido e constante."],
    [0, 3, "CONCLUIDO",     "Liderou a entrega do módulo de autenticação. Trabalho impecável!"],
    [0, 4, "INICIO",        "Iniciando a jornada. Completou a configuração do ambiente de desenvolvimento."],
    [0, 5, "AVANCADO",      "Destaque em UI/UX. Criou todos os mockups no Figma e já iniciou a implementação."],

    // ─── CodeQueens (team 1) ─────────────────────────────────────────────────
    [1, 0, "CONCLUIDO",    "Entregou o protótipo funcional com todas as features. Parabéns!"],
    [1, 1, "AVANCADO",     "Integração com API de geolocalização implementada com sucesso."],
    [1, 2, "DESENVOLVENDO", "Superou os desafios do JavaScript assíncrono. Continue!"],
    [1, 3, "DESENVOLVENDO", "Bom progresso no módulo de notificações. Falta os testes."],
    [1, 4, "INICIO",        null],
    [1, 5, "AVANCADO",     "Mentora técnica informal do time. Auxilia as colegas com maestria."],

    // ─── CyberGirls (team 2) — todos no início/início do desenvolvimento ─────
    [2, 0, "INICIO",        null],
    [2, 1, "INICIO",        null],
    [2, 2, "INICIO",        "Boa pesquisa de público-alvo! Próximo passo: mapa de empatia."],
    [2, 3, "INICIO",        null],
    [2, 4, "INICIO",        null],
    [2, 5, "DESENVOLVENDO", "Mapeou os principais fluxos do app. Pronta para o protótipo."],

    // ─── AlgorithmAngels (team 3) — projeto concluído ────────────────────────
    [3, 0, "CONCLUIDO", "Apresentação final nota 10! App publicado com sucesso na loja."],
    [3, 1, "CONCLUIDO", "Backend robusto e bem documentado. Referência para o time."],
    [3, 2, "CONCLUIDO", "Responsável pelo design e experiência do usuário. Trabalho excepcional!"],
    [3, 3, "CONCLUIDO", null],
    [3, 4, "CONCLUIDO", null],
    [3, 5, "CONCLUIDO", null],

    // ─── LogicLadies (team 4) ─────────────────────────────────────────────────
    [4, 0, "AVANCADO",     "Sistema de gamificação testado com 20 alunos. Feedback excelente!"],
    [4, 1, "DESENVOLVENDO", "Implementou o sistema de pontos. Próximo passo: rankings globais."],
    [4, 2, "DESENVOLVENDO", null],
    [4, 3, "INICIO",        null],
    [4, 4, "AVANCADO",     "Banco de desafios com mais de 100 questões cadastradas."],
    [4, 5, "DESENVOLVENDO", "Integrou o backend com Firebase. Dados sincronizando em tempo real."],
  ];

  let progressCount = 0;
  for (const [teamIdx, alunaIdx, stage, notes] of progressData) {
    const team  = teams[teamIdx];
    const aluna = alunas[teamData[teamIdx].alunaRange[0] + alunaIdx];
    if (!team || !aluna) continue;

    await prisma.studentProgress.upsert({
      where:  { teamId_studentId: { teamId: team.id, studentId: aluna.id } },
      update: { stage, notes },
      create: { teamId: team.id, studentId: aluna.id, stage, notes },
    });
    progressCount++;
  }

  console.log(`✅ ${progressCount} registros de progresso garantidos.`);

  // ── 6. Materiais (upsert por título) ─────────────────────────────────────────
  // Categorias válidas: Programação, Design, Empreendedorismo, Desafios
  // Tipos válidos: Tutorial, Guia, Desafio, Template
  const materialList = [
    { title: "Introdução ao Python para Iniciantes",       category: "Programação",      type: "Tutorial",  description: "Aprenda Python do zero com exemplos práticos e exercícios guiados." },
    { title: "Guia de HTML e CSS",                         category: "Design",            type: "Guia",      description: "Construa suas primeiras páginas web com HTML5 e CSS3." },
    { title: "Algoritmos e Estruturas de Dados",           category: "Programação",      type: "Guia",      description: "Fundamentos essenciais para resolver problemas computacionais." },
    { title: "Desafio: App para sua Comunidade",           category: "Desafios",          type: "Desafio",   description: "Proponha e prototipe uma solução digital para um problema local." },
    { title: "Design de Interfaces com Figma",             category: "Design",            type: "Tutorial",  description: "Crie protótipos e telas profissionais do zero ao avançado." },
    { title: "Empreendedorismo para Jovens",               category: "Empreendedorismo",  type: "Guia",      description: "Como transformar uma ideia em um projeto sustentável." },
    { title: "Template: Pitch Technovation Girls",         category: "Empreendedorismo",  type: "Template",  description: "Modelo de apresentação para o pitch final do Technovation Girls." },
  ];

  for (const m of materialList) {
    const existing = await prisma.material.findFirst({ where: { title: m.title } });
    if (!existing) await prisma.material.create({ data: m });
  }
  console.log("✅ Materiais garantidos.");

  // ── 7. Agenda (upsert por título) ─────────────────────────────────────────────
  const realizadas = [
    { title: "Sessão de Tutoria #1",            type: "SESSAO_DE_TUTORIA",  local: "Laboratório 01",             daysAgo: 30 },
    { title: "Meninas no Lab — Python Básico",  type: "MENINAS_NO_LAB",     local: "Laboratório de Informática", daysAgo: 24 },
    { title: "Sessão de Tutoria #2",            type: "SESSAO_DE_TUTORIA",  local: "Online / Google Meet",       daysAgo: 21 },
    { title: "Roda de Conversa: Carreira Tech", type: "RODA_DE_CONVERSA",  local: "Sala de Reuniões",           daysAgo: 18 },
    { title: "Sessão de Tutoria #3",            type: "SESSAO_DE_TUTORIA",  local: "Laboratório 01",             daysAgo: 15 },
    { title: "Meninas no Lab — HTML e CSS",     type: "MENINAS_NO_LAB",     local: "Laboratório de Informática", daysAgo: 12 },
    { title: "Roda de Conversa: Diversidade",   type: "RODA_DE_CONVERSA",  local: "Auditório Central",          daysAgo: 9  },
    { title: "Sessão de Tutoria #4",            type: "SESSAO_DE_TUTORIA",  local: "Online / Google Meet",       daysAgo: 6  },
    { title: "Technovation — Kick-off 2024",    type: "TECHNOVATION_EVENT", local: "Auditório Central",          daysAgo: 4  },
    { title: "Sessão de Tutoria #5",            type: "SESSAO_DE_TUTORIA",  local: "Laboratório 01",             daysAgo: 2  },
  ];

  const pendentes = [
    { title: "Meninas no Lab — React Native",    type: "MENINAS_NO_LAB",     local: "Laboratório de Informática", daysAhead: 3,  description: "Introdução ao desenvolvimento mobile com React Native e Expo." },
    { title: "Sessão de Tutoria #6",             type: "SESSAO_DE_TUTORIA",  local: "Laboratório 01",             daysAhead: 7,  description: "Revisão de progresso e planejamento das próximas entregas." },
    { title: "Roda de Conversa: Mulheres STEM",  type: "RODA_DE_CONVERSA",  local: "Auditório Central",          daysAhead: 10, description: "Painel com profissionais de tecnologia sobre suas trajetórias." },
    { title: "Technovation — Pré-Pitch",         type: "TECHNOVATION_EVENT", local: "Sala de Reuniões",           daysAhead: 14, description: "Simulado de apresentação do pitch final. Prepare sua equipe!" },
    { title: "Sessão de Tutoria #7",             type: "SESSAO_DE_TUTORIA",  local: "Online / Google Meet",       daysAhead: 18, description: "Acompanhamento final dos projetos antes da entrega." },
  ];

  for (const s of realizadas) {
    const existing = await prisma.schedule.findFirst({ where: { title: s.title } });
    if (!existing) {
      const date = new Date();
      date.setDate(date.getDate() - s.daysAgo);
      await prisma.schedule.create({
        data: {
          title: s.title, type: s.type, local: s.local,
          date, status: "REALIZADA",
          presencas: Math.floor(Math.random() * 15) + 8,
          description: "Encontro realizado. Conteúdo aplicado e dúvidas dos times sanadas.",
        },
      });
    }
  }

  for (const s of pendentes) {
    const existing = await prisma.schedule.findFirst({ where: { title: s.title } });
    if (!existing) {
      const date = new Date();
      date.setDate(date.getDate() + s.daysAhead);
      await prisma.schedule.create({
        data: { title: s.title, type: s.type, local: s.local, date, status: "PENDENTE", description: s.description },
      });
    }
  }
  console.log("✅ Agenda garantida.");

  // ── 8. Configurações de Páginas (SystemOptions) ──────────────────────────────
  const systemOptions = [
    // Categorias de Materiais
    { group: "MATERIAL_CATEGORY", value: "PROGRAMACAO",      label: "Programação",      color: "#7c3aed" },
    { group: "MATERIAL_CATEGORY", value: "DESIGN",           label: "Design",            color: "#f59e0b" },
    { group: "MATERIAL_CATEGORY", value: "EMPREENDEDORISMO", label: "Empreendedorismo",  color: "#0ea5e9" },
    { group: "MATERIAL_CATEGORY", value: "DESAFIOS",         label: "Desafios",          color: "#ec4899" },

    // Tipos de Materiais
    { group: "MATERIAL_TYPE", value: "TUTORIAL",  label: "Tutorial",  color: "#7c3aed" },
    { group: "MATERIAL_TYPE", value: "GUIA",      label: "Guia",      color: "#0ea5e9" },
    { group: "MATERIAL_TYPE", value: "DESAFIO",   label: "Desafio",   color: "#ec4899" },
    { group: "MATERIAL_TYPE", value: "TEMPLATE",  label: "Template",  color: "#f59e0b" },

    // Tipos de Agenda
    { group: "SCHEDULE_TYPE", value: "MENINAS_NO_LAB",     label: "Meninas no Lab",     color: "#7c3aed" },
    { group: "SCHEDULE_TYPE", value: "RODA_DE_CONVERSA",   label: "Roda de Conversa",   color: "#ec4899" },
    { group: "SCHEDULE_TYPE", value: "SESSAO_DE_TUTORIA",  label: "Sessão de Tutoria",  color: "#0ea5e9" },
    { group: "SCHEDULE_TYPE", value: "TECHNOVATION_EVENT", label: "Technovation Event", color: "#f59e0b" },

    // Status de Equipes
    { group: "TEAM_STATUS", value: "IDEACAO",           label: "Ideação",           color: "#f59e0b" },
    { group: "TEAM_STATUS", value: "PROTOTIPAGEM",      label: "Prototipagem",      color: "#7c3aed" },
    { group: "TEAM_STATUS", value: "EM_DESENVOLVIMENTO", label: "Em Desenvolvimento", color: "#0ea5e9" },
    { group: "TEAM_STATUS", value: "CONCLUIDO",         label: "Concluído",         color: "#10b981" },
  ];

  for (const opt of systemOptions) {
    await prisma.systemOption.upsert({
      where:  { group_value: { group: opt.group, value: opt.value } },
      update: { label: opt.label, color: opt.color },
      create: opt,
    });
  }
  console.log(`✅ ${systemOptions.length} opções de configuração de páginas garantidas.`);

  // ── 9. System Settings ────────────────────────────────────────────────────────
  const contextPath  = path.resolve(__dirname, "../src/docs/rose-context.md");
  let defaultPrompt  = "Você é a Rose, assistente IA do Tutoria Tech. Responda com clareza, empatia e foco educacional.";
  try { defaultPrompt = await fs.readFile(contextPath, "utf-8"); } catch {}

  await prisma.systemSetting.upsert({
    where:  { key: "ROSE_SYSTEM_PROMPT" },
    update: {},
    create: { key: "ROSE_SYSTEM_PROMPT", value: defaultPrompt },
  });
  await prisma.systemSetting.upsert({
    where:  { key: "GEMINI_API_KEY" },
    update: {},
    create: { key: "GEMINI_API_KEY", value: "" },
  });
  console.log("✅ Configurações garantidas.");

  // ── 10. Base de conhecimento padrão (arquivos/ e links.txt) ──────────────────
  const ARQUIVOS_PATH = "/app/arquivos";
  const KNOWLEDGE_EXTS = new Set([".pdf", ".docx", ".txt", ".md", ".xlsx", ".csv"]);

  try {
    await ensureBucketSeed();

    // PDFs e documentos da pasta arquivos/
    const dirFiles = await fs.readdir(ARQUIVOS_PATH).catch(() => []);
    let knowledgeCount = 0;

    for (const filename of dirFiles) {
      const ext = path.extname(filename).toLowerCase();
      if (!KNOWLEDGE_EXTS.has(ext)) continue;

      const existing = await prisma.knowledgeDocument.findFirst({ where: { filename: { contains: filename } } });
      if (existing) { console.log(`  ↩ ${filename} já na base.`); continue; }

      const filePath = path.join(ARQUIVOS_PATH, filename);
      const buffer   = await fs.readFile(filePath);
      const key      = `knowledge-default-${filename}`;

      await s3Seed.send(new PutObjectCommand({
        Bucket: BUCKET, Key: key, Body: buffer, ContentType: "application/octet-stream",
      }));
      await prisma.knowledgeDocument.create({ data: { filename: key } });
      console.log(`  ✔ ${filename} → MinIO (${key})`);
      knowledgeCount++;
    }

    // URLs do links.txt
    const linksPath    = path.join(ARQUIVOS_PATH, "links.txt");
    const linksContent = await fs.readFile(linksPath, "utf-8").catch(() => "");
    const urls         = linksContent.split("\n").map(l => l.trim()).filter(l => l.startsWith("http"));

    for (const url of urls) {
      const existing = await prisma.knowledgeDocument.findFirst({ where: { filename: url } });
      if (existing) { console.log(`  ↩ URL já na base: ${url}`); continue; }
      await prisma.knowledgeDocument.create({ data: { filename: url } });
      console.log(`  ✔ URL adicionada: ${url}`);
      knowledgeCount++;
    }

    if (knowledgeCount > 0) {
      console.log(`✅ ${knowledgeCount} item(s) de conhecimento adicionados (vetorizar na tela de Configurações da IA).`);
    } else {
      console.log("✅ Base de conhecimento: sem novos itens para adicionar.");
    }
  } catch (err) {
    console.warn("⚠️  Seed de knowledge ignorado (MinIO indisponível ou pasta ausente):", err.message);
  }

  // ── Resumo final ──────────────────────────────────────────────────────────────
  console.log("\n🎉 Seed concluído!");
  console.log("══════════════════════════════════════════════");
  console.log("  ACESSOS RÁPIDOS");
  console.log("  Admin:   admin@projeto.com        / admin");
  console.log("  Mentora: mentora1@tutoria.com     / password123");
  console.log("           → Mentora do time DevStars");
  console.log("           → 6 alunas com progresso variado");
  console.log("  Aluna:   aluna1@tutoria.com       / password123");
  console.log("           → Membro do DevStars");
  console.log("           → Progresso: AVANÇADO com feedback da mentora");
  console.log("══════════════════════════════════════════════");
  console.log("  CÓDIGOS DE ACESSO DOS TIMES");
  teamData.forEach((t) => console.log(`  ${t.name.padEnd(18)} → ${t.accessCode}`));
  console.log("══════════════════════════════════════════════");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
