# 🏗️ Arquitetura do Sistema — Tutoria Tech

Visão técnica completa da arquitetura da plataforma **Tutoria Tech**, uma aplicação web de mentoria para o programa **Technovation Girls**.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura em Camadas](#arquitetura-em-camadas)
- [Fluxo de Autenticação](#fluxo-de-autenticação)
- [Fluxo da IA Rose (RAG)](#fluxo-da-ia-rose-rag)
- [Armazenamento de Arquivos](#armazenamento-de-arquivos)
- [Modelo de Dados](#modelo-de-dados)
- [Documentação Detalhada do Banco de Dados](DATABASE.md)
- [Controle de Acesso (RBAC)](#controle-de-acesso-rbac)
- [Estrutura de Diretórios](#estrutura-de-diretórios)

---

## Visão Geral

O Tutoria Tech é uma aplicação **full-stack containerizada**, dividida em microserviços independentes que se comunicam por uma rede Docker interna (`tutoria-network`). A separação em múltiplos compose files permite que cada camada seja atualizada e reconstruída sem impactar as demais.

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
| **Túnel (opcional)** | ngrok | Exposição pública para testes |

---

## Arquitetura em Camadas

O projeto é organizado em **3 camadas independentes**, cada uma com seu próprio compose file:

```
┌──────────────────────────────────────────────────────────────┐
│               tutoria-network (bridge Docker)                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  docker-compose.infra.yml  — INFRAESTRUTURA          │    │
│  │                                                      │    │
│  │  ┌──────────────────┐   ┌──────────────────┐        │    │
│  │  │   PostgreSQL 16  │   │      MinIO        │        │    │
│  │  │   + pgvector     │   │   (S3-like)       │        │    │
│  │  │   porta: 5432 ★  │   │   porta: 9000/    │        │    │
│  │  │                  │   │          9001     │        │    │
│  │  └──────────────────┘   └──────────────────┘        │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  docker-compose.ia.yml  — SERVIÇO DE IA              │    │
│  │                                                      │    │
│  │  ┌──────────────────────────────────┐               │    │
│  │  │   Python IA (FastAPI + Uvicorn)  │               │    │
│  │  │   porta interna: 8000            │               │    │
│  │  └──────────────────────────────────┘               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  docker-compose.app.yml  — APLICAÇÃO                   │    │
│  │                                                      │    │
│  │  ┌───────────────┐   ┌───────────────┐              │    │
│  │  │   Backend     │   │   Frontend    │              │    │
│  │  │   (Fastify)   │   │   (Vite)      │              │    │
│  │  │   porta: 3001★│   │   porta: 5173★│              │    │
│  │  │   porta: 5555★│   │               │              │    │
│  │  └───────────────┘   └───────────────┘              │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  docker-compose.app.yml  — APLICAÇÃO                   │    │
│  │                                                      │    │
│  │  ┌───────────────┐   ┌───────────────┐              │    │
│  │  │   Backend     │   │   Frontend    │              │    │
│  │  │   (Fastify)   │   │   (Vite)      │              │    │
│  │  │   porta: 3001 │   │   porta: 5173★│              │    │
│  │  └───────────────┘   └───────────────┘              │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ★ = Porta exposta ao host (localhost)                       │
└──────────────────────────────────────────────────────────────┘
```

### Por que separar em compose files?

| Compose | Serviços | Quando usar |
| :--- | :--- | :--- |
| `docker-compose.infra.yml` | PostgreSQL, MinIO | **Obrigatório** — primeiro a subir |
| `docker-compose.app.yml` | Backend, Frontend | **Obrigatório** — segundo a subir |
| `docker-compose.ia.yml` | Python IA (FastAPI) | Opcional — habilita o chat com a Rose |

---

## Comunicação entre Serviços

Todos os containers se comunicam pela rede interna `tutoria-network`. As chamadas usam o **nome do serviço** como hostname (resolução DNS interna do Docker).

```
Frontend (React)
    │
    │  REST (http://backend:3001)   ← dentro da rede Docker
    ▼
Backend (Fastify)
    ├─── Prisma ORM ──────────────► PostgreSQL (db:5432)
    ├─── MinIO SDK ───────────────► MinIO (minio:9000)
    └─── fetch/axios ─────────────► Python IA (python-ia:8000)

Python IA (FastAPI)
    ├─── psycopg2 ────────────────► PostgreSQL (db:5432) — pgvector
    └─── MinIO SDK ───────────────► MinIO (minio:9000)
```

**Portas expostas ao host (localhost):**

| Container | Porta Host | Protocolo | Uso |
| :--- | :--- | :--- | :--- |
| `tutoria_frontend` | 5173 | HTTP | Acesso pelo navegador |
| `tutoria_backend` | 3001 | HTTP | API REST (Opcional p/ Debug) |
| `tutoria_db` | 5432 | TCP | Clientes SQL (Opcional p/ Debug) |

---

## Fluxo de Autenticação

```
1. Usuário faz POST /api/auth/login  →  Backend
2. Backend valida credenciais no PostgreSQL via Prisma
3. Backend gera JWT assinado com JWT_SECRET
4. Frontend armazena o token (localStorage/context)
5. Todas as requisições subsequentes enviam Bearer <token>
6. Backend valida o token e extrai o perfil (role: ADMIN | MENTORA | ALUNA)
7. Middleware de RBAC verifica permissões por rota
```

O JWT carrega:
- `id` do usuário
- `role` (ADMIN, MENTORA, ALUNA)
- `tutoraId` (para mentoras, associação com equipe)

---

## Fluxo da IA Rose (RAG)

A Rose é uma assistente de IA implementada com **RAG (Retrieval-Augmented Generation)**:

```
INGESTÃO DE DOCUMENTOS (feita pelo Admin):
1. Admin faz upload de PDF via Frontend
2. Backend envia arquivo para MinIO (bucket: materiais)
3. Backend notifica Python IA do novo documento
4. Python IA:
   a. Baixa o PDF do MinIO
   b. Extrai texto por chunks
   c. Gera embeddings via Google Gemini
   d. Armazena embeddings no PostgreSQL (pgvector)

CONSULTA (feita pelo usuário):
1. Usuário envia mensagem para a Rose
2. Frontend → POST /api/ia/chat  →  Backend
3. Backend encaminha para Python IA (python-ia:8000)
4. Python IA:
   a. Gera embedding da pergunta
   b. Busca chunks relevantes no pgvector (similaridade coseno)
   c. Monta o contexto com os chunks encontrados
   d. Envia prompt + contexto para Google Gemini
   e. Retorna a resposta gerada
5. Backend devolve a resposta ao Frontend
```

**Componentes Python:**

| Arquivo | Responsabilidade |
| :--- | :--- |
| `main.py` | Entrypoint FastAPI, define as rotas |
| `ia_rose.py` | Lógica de RAG: busca vetorial + chamada ao Gemini |
| `process_files.py` | Extração de texto e geração de embeddings de PDFs |

---

## Armazenamento de Arquivos

O MinIO é um sistema de object storage compatível com a API do Amazon S3.

```
Frontend
    │ multipart/form-data
    ▼
Backend (Fastify)
    │ MinIO SDK (Node.js)
    ▼
MinIO (minio:9000)
    └── bucket: materiais/
        ├── pdf/
        ├── video/
        ├── imagem/
        └── ...
```

- **Upload:** feito via Backend (o Frontend não acessa o MinIO diretamente)
- **Download/Visualização:** URLs públicas geradas pelo MinIO com política de acesso público no bucket
- **Persistência:** volume Docker `minio_data` garante que os arquivos sobrevivem a reinicializações

---

## Modelo de Dados

O modelo de dados é gerenciado pelo **Prisma ORM** e implementado no **PostgreSQL**. Abaixo, um resumo simplificado das entidades principais.

> [!TIP]
> Para uma visão completa de todos os campos, tipos e diagramas ER técnicos, consulte a **[Documentação do Banco de Dados (DATABASE.md)](DATABASE.md)**.

```
User (users)
├── id, name, email, password (hash), role
└── Relacionamentos: mentor de Team, aluna de Team, presenças em Schedule

Team (teams)
├── id, nome, status, accessCode
├── mentorId (FK → User)
└── Relacionamentos: lista de alunas (Users), registros de StudentProgress

Material (materials)
├── id, titulo, descricao, categoria, tipo
└── Relacionamentos: lista de MaterialFile (arquivos no MinIO)

Schedule (schedules)
├── id, titulo, data, tipo, status, presencas (count)
└── Relacionamentos: lista de Attendance

Knowledge (knowledge_documents & chunks)
├── Document: filename
└── Chunk: content, embedding (vector 768) ← Busca Semântica

Configurações (system_settings & system_options)
├── system_settings: GEMINI_API_KEY, ROSE_PROMPT
└── system_options: Opções dinâmicas de categorias e status
```

---

## Controle de Acesso (RBAC)

O sistema implementa **Role-Based Access Control** no backend via middleware JWT:

| Recurso | Admin | Mentora | Aluna |
| :--- | :---: | :---: | :---: |
| Dashboard completo | ✅ | ✅ próprio | ✅ próprio |
| Gestão de Usuários | ✅ | ❌ | ❌ |
| Criar/Gerenciar Equipes | ✅ | ✅ | ❌ |
| Registrar Presença | ✅ | ✅ | ❌ |
| Publicar Materiais | ✅ | ✅ | ❌ |
| Configurações de IA | ✅ | ❌ | ❌ |
| Chat com a Rose | ✅ | ✅ | ✅ |

---

## Estrutura de Diretórios

```
Tutoria_tech/
├── .env                          # Token ngrok (não versionado)
├── .env.example                  # Exemplo do .env
├── docker-compose.app.yml        # App: Backend + Frontend
├── docker-compose.ngrok.yml      # Túnel público (opcional)
├── docker-compose.infra.yml      # Infra: PostgreSQL + MinIO
├── docker-compose.ia.yml         # IA: Python FastAPI
├── docs/
│   ├── INSTALACAO.md             # Este guia de instalação
│   └── ARQUITETURA.md            # Este documento
│
├── backend/                      # Node.js + Fastify
│   ├── .env.dev                  # Variáveis de ambiente (pré-configurado)
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma         # Modelo de dados (Prisma)
│   │   └── seed.js               # Seed: 41 usuários, equipes, eventos
│   └── src/
│       ├── server.js             # Entrypoint Fastify
│       ├── routes/               # Rotas da API (auth, users, equipes, IA...)
│       ├── middlewares/          # JWT, RBAC
│       └── docs/                 # Contexto/prompt da Rose
│
├── frontend/                     # React 18 + Vite
│   ├── Dockerfile
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx               # Roteamento React
│       ├── components/           # Sidebar, TopBar, BottomNav, ChatWidget...
│       ├── context/              # AuthContext, ChatContext
│       ├── pages/                # Dashboard, Login, Materiais, Agenda...
│       └── lib/
│           └── api.js            # Cliente HTTP centralizado (fetch + JWT)
│
└── python-ia/                    # Python 3.11 + FastAPI
    ├── Dockerfile
    ├── requirements.txt
    ├── main.py                   # Entrypoint FastAPI + rotas
    ├── ia_rose.py                # Lógica RAG: busca vetorial + Gemini
    └── process_files.py          # Processamento de PDFs e embeddings
```
