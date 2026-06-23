#  Arquitetura do Sistema — Tutoria Tech

Visão técnica completa da arquitetura da plataforma **Tutoria Tech**, uma aplicação web de mentoria para o programa **Technovation Girls**.

---

##  Índice

- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura em Camadas](#arquitetura-em-camadas)
- [Fluxo de Autenticação](#fluxo-de-autenticação)
- [Fluxo da IA Rose (RAG)](#fluxo-da-ia-rose-rag)
- [Armazenamento de Arquivos](#armazenamento-de-arquivos)
- [Modelo de Dados](#modelo-de-dados)
- [Controle de Acesso (RBAC)](#controle-de-acesso-rbac)
- [Estrutura de Diretórios](#estrutura-de-diretórios)

---

## Visão Geral

O Tutoria Tech é uma aplicação **full-stack containerizada**, dividida em microserviços independentes que se comunicam por uma rede Docker interna (`tutoria-network`).

```
┌─────────────────────────────────────────────────────────────────────┐
│                       USUÁRIO (navegador)                           │
└──────────────────────────┬──────────────────────────────────────────┘
           │ HTTP (Somente Frontend exposto)
           ▼
    (localhost:5173)
    Frontend React
           │
           │ REST API (Interno Docker)
           ▼
    Backend Fastify (Porta 3001)
    ┌──────────────────────────────────────────────┐
    │  Autenticação JWT                            │
    │  Rotas por perfil (Admin/Mentora/Aluna)      │
    │  Prisma ORM                                  │
    └──────┬───────────────┬──────────────┬────────┘
           │               │              │
           ▼               ▼              ▼
     PostgreSQL          MinIO       Python IA
     + pgvector       (S3-like)     (FastAPI)
     (Porta 5432)     (Porta 9000)   Rose / RAG
```

---

## Stack Tecnológica

| Camada | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Tailwind CSS | Interface da aplicação |
| **Backend** | Node.js + Fastify + Prisma ORM | API REST e regras de negócio |
| **IA** | Python 3.11 + FastAPI + Uvicorn | Assistente Rose com RAG |
| **Banco de Dados** | PostgreSQL 16 + pgvector | Dados relacionais + busca semântica |
| **Armazenamento** | MinIO (S3-compatível) | Upload e acesso a arquivos |
| **IA Generativa** | Google Gemini (via SDK Python) | LLM para geração de respostas |
| **Infraestrutura** | Docker Compose | Orquestração dos containers |

---

## Arquitetura em Camadas

O projeto oferece dois modos de execução:

### Modo Completo (Recomendado)

```powershell
docker compose -f docker-compose.full.yml up -d --build
```

Um único arquivo sobe todos os 5 serviços na ordem correta, com `depends_on` configurado:

```
db (healthy) ──┐
               ├──► python-ia ──► backend ──► frontend
minio (healthy)┘
```

### Modo por Camadas (Desenvolvimento)

| Compose | Serviços | Ordem |
| :--- | :--- | :---: |
| `docker-compose.infra.yml` | PostgreSQL, MinIO | 1º |
| `docker-compose.ia.yml` | Python IA (FastAPI) | 2º |
| `docker-compose.app.yml` | Backend, Frontend | 3º |

---

### Mecanismo de Proxy (Vite)

O navegador envia requisições de API para `http://localhost:5173/api`. O servidor Vite intercepta e redireciona internamente para `http://backend:3001`. Isso mantém o Backend protegido (sem porta exposta ao host) e evita problemas de CORS em desenvolvimento.

---

## Comunicação entre Serviços

Todos os containers se comunicam pela rede interna `tutoria-network`:

```
Frontend (React)
    │
    │  REST (http://backend:3001)
    ▼
Backend (Fastify)
    ├─── Prisma ORM ──────────────► PostgreSQL (db:5432)
    ├─── S3 SDK (@aws-sdk) ───────► MinIO (minio:9000)
    └─── fetch ───────────────────► Python IA (python-ia:8000)

Python IA (FastAPI)
    ├─── psycopg2 ────────────────► PostgreSQL (db:5432) — pgvector
    ├─── MinIO SDK (boto3) ───────► MinIO (minio:9000)
    └─── Google Gemini SDK ───────► API Gemini (internet)
```

**Portas expostas ao host:**

| Container | Porta | Uso |
| :--- | :--- | :--- |
| `tutoria_frontend` | 5173 | Acesso pelo navegador |
| `tutoria_db` | 5432 | Clientes SQL (debug) |
| `tutoria_minio` | 9000 / 9001 | API S3 / Console web |

---

## Fluxo de Autenticação

```
1. Usuário faz POST /api/auth/login  →  Backend
2. Backend valida credenciais no PostgreSQL via Prisma
3. Backend gera JWT assinado (8h de validade)
4. Frontend armazena token no localStorage (AuthContext)
5. Todas as requisições enviam: Authorization: Bearer <token>
6. Backend valida o token e extrai o perfil (role: ADMIN | MENTORA | ALUNA)
7. Middleware RBAC (requireRole) verifica permissões por rota
```

O JWT carrega: `id`, `email`, `role`.

**Admin pode impersonar** outros usuários para testar diferentes visões (token de 2h).

---

## Fluxo da IA Rose (RAG)

A Rose implementa **RAG (Retrieval-Augmented Generation)** com suporte a arquivos e URLs:

### Ingestão de Conhecimento

```
ARQUIVOS (PDF, DOCX, TXT, MD, XLSX, CSV):
1. Admin faz upload via Frontend → Backend
2. Backend envia arquivo ao MinIO (bucket: materiais)
3. Backend cria registro em KnowledgeDocument
4. Python IA busca o arquivo no MinIO, extrai texto, chunka e gera embeddings
5. Embeddings (768 dimensões) armazenados no PostgreSQL via pgvector

URLS / SITES:
1. Admin cola uma URL no painel de Configurações da IA
2. Backend cria registro em KnowledgeDocument com a URL como filename
3. Python IA faz requisição HTTP à URL, extrai texto via BeautifulSoup
4. Mesmo pipeline de chunking + embedding + pgvector
5. Botão "Atualizar" re-lê o site e recria os embeddings
```

### Consulta (Chat com a Rose)

```
1. Usuário envia mensagem
2. Frontend → POST /api/chat → Backend
3. Backend carrega GEMINI_API_KEY e ROSE_SYSTEM_PROMPT do banco
4. Backend encaminha para Python IA (python-ia:8000/chat)
5. Python IA:
   a. Gera embedding da pergunta via Gemini
   b. Busca top-5 chunks por similaridade cosseno (pgvector)
   c. Monta contexto: "--- BASE DE CONHECIMENTO ---\n{chunks}\n\nPergunta: {msg}"
   d. Envia prompt + contexto + histórico para Gemini (gemini-2.5-flash)
   e. Retorna resposta gerada
6. Backend devolve ao Frontend
```

**Componentes Python:**

| Arquivo | Responsabilidade |
| :--- | :--- |
| `main.py` | Entrypoint FastAPI |
| `ia_rose.py` | Chat RAG: busca vetorial + Gemini |
| `process_files.py` | Extração de texto de arquivos e URLs, embeddings |

---

## Armazenamento de Arquivos

```
Frontend
    │ multipart/form-data
    ▼
Backend (Fastify + @aws-sdk/client-s3)
    │
    ▼
MinIO (minio:9000) — bucket: materiais
    ├── knowledge-default-*.pdf   ← documentos padrão (seed)
    ├── knowledge-{ts}-*.pdf      ← uploads manuais de conhecimento
    └── {ts}-*.pdf / *.mp4 ...   ← materiais de apoio
```

- **Upload:** feito via Backend (Frontend não acessa MinIO diretamente)
- **Acesso público:** bucket com política de leitura aberta (URLs diretas no browser)
- **Persistência:** volume Docker `minio_data`

---

## Modelo de Dados

Gerenciado pelo **Prisma ORM** no **PostgreSQL 16**.

```
User (users)
├── id, name, email, password (bcrypt), role
└── Relacionamentos: mentor de Team, aluna de Team, presenças, progressos

Team (teams)
├── id, nome, status, accessCode, description
├── mentorId (FK → User)
└── Relacionamentos: alunas (Users), StudentProgress

StudentProgress (student_progress)
├── teamId (FK), studentId (FK)
├── stage (INICIO | DESENVOLVENDO | AVANCADO | CONCLUIDO)
└── notes (feedback da mentora)

Material (materials) + MaterialFile
├── título, categoria, tipo
└── arquivos no MinIO

Schedule (schedules) + Attendance
├── título, data, tipo, status, presencas
└── Relacionamentos: Attendance (aluna × evento)

KnowledgeDocument + KnowledgeChunk
├── Document: filename (caminho MinIO ou URL completa)
└── Chunk: content + embedding vector(768) ← busca semântica

SystemSetting
└── GEMINI_API_KEY, ROSE_SYSTEM_PROMPT

SystemOption
└── Opções dinâmicas: MATERIAL_CATEGORY, MATERIAL_TYPE, SCHEDULE_TYPE, TEAM_STATUS
    (pré-populadas pelo seed com 16 opções padrão)

ActivityLog
└── Trilha de auditoria das ações na plataforma
```

> Para diagramas ER e detalhes completos de cada tabela, veja [DATABASE.md](DATABASE.md).

---

## Controle de Acesso (RBAC)

| Recurso / Visão | Admin | Mentora | Aluna |
| :--- | :---: | :---: | :---: |
| Dashboard com KPIs globais | ✅ | ❌ | ❌ |
| Dashboard com meus times | ❌ | ✅ | ❌ |
| Dashboard com meu progresso | ❌ | ❌ | ✅ |
| Gestão de Usuários | ✅ | ❌ | ❌ |
| Criar/Gerenciar Equipes | ✅ | ✅ próprias | ❌ |
| Entrar em Equipe (código) | ❌ | ❌ | ✅ |
| Página de Progresso (editar) | ❌ | ✅ | ❌ |
| Página de Progresso (ver) | ❌ | ❌ | ✅ |
| Publicar Materiais | ✅ | ✅ | ❌ |
| Registrar Presença | ✅ | ✅ | ❌ |
| Configurações de IA e Knowledge | ✅ | ❌ | ❌ |
| Chat com a Rose | ✅ | ✅ | ✅ |
| Impersonar usuários | ✅ | ❌ | ❌ |

---

## Estrutura de Diretórios

```
Tutoria_tech/
├── docker-compose.full.yml       # Stack completa — único comando
├── docker-compose.infra.yml      # Infra: PostgreSQL + MinIO
├── docker-compose.ia.yml         # IA: Python FastAPI
├── docker-compose.app.yml        # App: Backend + Frontend
├── arquivos/                     # PDFs e links.txt importados como conhecimento padrão
│   ├── ApresentaçãoMeninasDigitais.pdf
│   ├── PosterWIT.pdf
│   └── links.txt
│
├── docs/
│   ├── INSTALACAO.md
│   ├── ARQUITETURA.md
│   └── DATABASE.md
│
├── backend/                      # Node.js + Fastify
│   ├── .env.dev                  # Variáveis de ambiente (pré-configurado)
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma         # Modelo de dados
│   │   └── seed.js               # 41 usuários, times, eventos, knowledge, SystemOptions
│   └── src/
│       ├── server.js             # Entrypoint Fastify
│       ├── routes/               # auth, users, teams, materials, schedule,
│       │                         # attendance, progress, dashboard, chat, settings
│       ├── lib/                  # prisma.js, requireRole.js, activity.js
│       └── docs/
│           └── rose-context.md   # Prompt padrão da Rose
│
├── frontend/                     # React 18 + Vite
│   └── src/
│       ├── App.jsx               # Roteamento
│       ├── context/              # AuthContext, ChatContext, ThemeContext, ToastContext
│       ├── components/           # Layout, Sidebar, BottomNav, ChatWidget,
│       │                         # Toast, EmptyState, Modal, NotificationBell
│       └── pages/                # LoginPage, DashboardPage, TutoriasPage,
│                                 # MateriaisPage, AgendaPage, ProgressoPage,
│                                 # PerfilPage, UsuariosPage, ConfiguracoesIAPage,
│                                 # ConfiguracoesPaginas
│
└── python-ia/                    # Python 3.11 + FastAPI
    ├── main.py                   # Entrypoint FastAPI
    ├── ia_rose.py                # Chat RAG: busca vetorial + Gemini
    └── process_files.py          # Processamento de arquivos e URLs + embeddings
```
