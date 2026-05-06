# ✨ Tutoria Tech — Plataforma de Mentoria e Aprendizagem

Plataforma web para apoiar o programa **Technovation Girls**, com acompanhamento de alunas, gestão de equipes, agenda de encontros, materiais de apoio e a **Rose** — assistente de IA integrada.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Técnica](#-stack-técnica)
- [Arquitetura Docker](#-arquitetura-docker)
- [Pré-requisitos](#-pré-requisitos)
- [Guia de Instalação](#-guia-de-instalação)
- [Acessando a Aplicação](#-acessando-a-aplicação)
- [Credenciais de Teste](#-credenciais-de-teste)
- [Controle de Acesso (RBAC)](#-controle-de-acesso-rbac)
- [Funcionalidades](#-funcionalidades)
- [Comandos Úteis](#-comandos-úteis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)

---

## 🚀 Visão Geral

O sistema oferece um ambiente centralizado para três perfis distintos:

- **Administradores** — Gestão total de usuários, configurações de IA e base de conhecimento.
- **Mentoras** — Gestão de equipes (tutorias), registro de presenças e publicação de materiais.
- **Alunas** — Acesso a materiais, acompanhamento do progresso da equipe e chat com a Rose.

---

## 🛠 Stack Técnica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React 18 · Vite · Tailwind CSS · Lucide Icons · Recharts |
| **Backend** | Node.js · Fastify · Prisma ORM · JWT |
| **IA** | Python 3.11 · FastAPI · Uvicorn |
| **Banco de Dados** | PostgreSQL 16 + pgvector (busca semântica) |
| **Armazenamento** | MinIO (S3-compatível) |
| **Infraestrutura** | Docker Compose · ngrok (túnel público) |
| **IA Generativa** | Google Gemini (via SDK) |

---

## 🐳 Arquitetura Docker

O projeto é dividido em **3 compose files** independentes, conectados por uma rede Docker compartilhada (`tutoria-network`). Isso permite rebuildar cada camada sem afetar as demais.

```
┌─────────────────────────────────────────────────────────────────┐
│                    tutoria-network (bridge)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  docker-compose.infra.yml                                │   │
│  │  ┌─────────────┐  ┌─────────────┐                       │   │
│  │  │  PostgreSQL  │  │    MinIO    │                       │   │
│  │  │  + pgvector  │  │  (S3-like)  │                       │   │
│  │  │  :5432 ★     │  │  :9000/9001 │                       │   │
│  │  └─────────────┘  └─────────────┘                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  docker-compose.ia.yml                                   │   │
│  │  ┌─────────────┐                                        │   │
│  │  │  Python IA   │                                        │   │
│  │  │  (FastAPI)   │                                        │   │
│  │  │  :8000       │                                        │   │
│  │  └─────────────┘                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  docker-compose.yml                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   Backend    │  │  Frontend   │  │    ngrok     │     │   │
│  │  │  (Fastify)   │  │  (Vite)     │  │  (túnel)    │     │   │
│  │  │  :3001       │  │  :5173      │──│  :4040 ★    │     │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ★ = Porta exposta ao host                                      │
└─────────────────────────────────────────────────────────────────┘
```

| Compose File | Serviços | Quando rebuildar |
| :--- | :--- | :--- |
| `docker-compose.infra.yml` | PostgreSQL, MinIO | Quase nunca (imagens prontas) |
| `docker-compose.ia.yml` | Python IA (FastAPI) | Quando alterar código da IA |
| `docker-compose.yml` | Backend, Frontend, ngrok | Desenvolvimento ativo |

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [**Docker Desktop**](https://www.docker.com/products/docker-desktop/) (inclui Docker Compose v2)
- [**Git**](https://git-scm.com/downloads)
- Uma conta gratuita no [**ngrok**](https://dashboard.ngrok.com/signup) (para acesso público)

---

## 📦 Guia de Instalação

### 1. Clonar o repositório

```bash
git clone https://github.com/GianSE/Tutoria_tech.git
cd Tutoria_tech
```

### 2. Configurar variáveis de ambiente

#### Arquivo raiz `.env` (para o ngrok)

```bash
cp .env.example .env
```

Abra o `.env` e preencha com seu token do ngrok:

```env
NGROK_AUTHTOKEN=seu_token_aqui
```

> 📌 Obtenha o token em: https://dashboard.ngrok.com/get-started/your-authtoken

#### Arquivo `backend/.env` (já vem pré-configurado)

O arquivo `backend/.env` já vem com as configurações padrão para desenvolvimento local. Só precisa alterar se quiser customizar:

```env
DATABASE_URL="postgresql://tutoriatech_user:tutoriatech_pass@db:5432/tutoriatech?schema=public"
PORT=3001
JWT_SECRET=mude_esse_segredo_em_producao
```

### 3. Subir a infraestrutura (banco + armazenamento)

```bash
docker compose -f docker-compose.infra.yml up -d
```

Aguarde os healthchecks ficarem saudáveis (~15 segundos):

```bash
docker compose -f docker-compose.infra.yml ps
```

Você deve ver `(healthy)` nos dois serviços antes de continuar.

### 4. Subir o serviço de IA

```bash
docker compose -f docker-compose.ia.yml up -d --build
```

### 5. Subir a aplicação (backend + frontend + ngrok)

```bash
docker compose up -d --build
```

### 6. Verificar se tudo está rodando

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Saída esperada:

```
NAMES               STATUS                    PORTS
tutoria_ngrok       Up X seconds              0.0.0.0:4040->4040/tcp
tutoria_frontend    Up X seconds              5173/tcp
tutoria_backend     Up X seconds              3001/tcp, 5555/tcp
tutoria_python_ia   Up X seconds              8000/tcp
tutoria_db          Up X minutes (healthy)    0.0.0.0:5432->5432/tcp
tutoria_minio       Up X minutes (healthy)    9000-9001/tcp
```

> ⚠️ O warning `Found orphan containers` é normal — cada compose file gerencia apenas seus próprios serviços.

---

## 🌐 Acessando a Aplicação

### Via ngrok (acesso público / compartilhável)

A URL pública gerada pelo ngrok pode ser consultada de duas formas:

**Opção A — Dashboard do ngrok:**
Acesse http://localhost:4040 no navegador.

**Opção B — Via terminal (PowerShell):**

```powershell
(Invoke-RestMethod http://localhost:4040/api/tunnels).tunnels[0].public_url
```

**Via terminal (Linux/Mac):**

```bash
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"'
```

A URL será algo como: `https://abc123-random.ngrok-free.app`

### Via banco de dados (acesso direto)

O PostgreSQL está exposto na porta `5432` do host:

```
Host: localhost
Porta: 5432
Usuário: tutoriatech_user
Senha: tutoriatech_pass
Banco: tutoriatech
```

Use qualquer cliente SQL (DBeaver, pgAdmin, DataGrip, etc.).

---

## 🔐 Credenciais de Teste

O seed cria automaticamente **41 usuários** na primeira execução:

| Perfil | Email | Senha | Quantidade |
| :--- | :--- | :--- | :---: |
| **Admin** | `admin@projeto.com` | `admin` | 1 |
| **Mentora** | `mentora1@tutoria.com` até `mentora10@tutoria.com` | `password123` | 10 |
| **Aluna** | `aluna1@tutoria.com` até `aluna30@tutoria.com` | `password123` | 30 |

Além dos usuários, o seed cria:
- **5 equipes** (DevStars, CodeQueens, CyberGirls, AlgorithmAngels, LogicLadies)
- **7 materiais de apoio** (PDFs, vídeos, guias)
- **15 eventos na agenda** (10 realizados + 5 pendentes)
- **Configurações iniciais** do sistema e prompt da Rose

---

## 👮 Controle de Acesso (RBAC)

| Recurso | Admin | Mentora | Aluna |
| :--- | :---: | :---: | :---: |
| Dashboard | ✅ Total | ✅ Próprio | ✅ Próprio |
| Gestão de Usuários | ✅ | ❌ | ❌ |
| Criar/Gerenciar Equipes | ✅ | ✅ | ❌ |
| Gerenciar Presença | ✅ | ✅ | ❌ |
| Publicar Materiais | ✅ | ✅ | ❌ |
| Configurações de IA | ✅ | ❌ | ❌ |
| Chat com a Rose | ✅ | ✅ | ✅ |

---

## ✨ Funcionalidades

### 📊 Dashboard
- Visão geral com métricas de equipes, alunas e eventos.
- Notificações em tempo real com sino interativo.

### 📂 Materiais de Apoio
- Upload múltiplo de arquivos para o MinIO (S3).
- Ícones inteligentes por tipo (PDF, Vídeo, Imagem, Código, Zip).
- Acesso público via política de bucket.

### 📅 Agenda e Presença
- Filtros por tipo de evento e status (Agendado, Realizado, Cancelado).
- Ordenação inteligente (próximos eventos no topo).
- Checklist de presença por aluna.

### 🤖 IA Rose
- Assistente treinada via RAG (Retrieval-Augmented Generation).
- Base de conhecimento alimentada por PDFs com pgvector.
- Chat widget flutuante em todas as páginas + página dedicada.

### 👥 Gestão de Tutorias
- Criação de equipes com mentora e alunas.
- Status de progresso (Ideação → Prototipagem → Desenvolvimento → Concluído).
- Links de WhatsApp/Telegram integrados.

---

## 🔧 Comandos Úteis

### Gerenciamento dos Containers

```bash
# Subir tudo (ordem correta)
docker compose -f docker-compose.infra.yml up -d
docker compose -f docker-compose.ia.yml up -d --build
docker compose up -d --build

# Derrubar tudo (ordem inversa)
docker compose down
docker compose -f docker-compose.ia.yml down
docker compose -f docker-compose.infra.yml down

# Rebuildar apenas o app (sem tocar na infra/IA)
docker compose up -d --build

# Rebuildar apenas a IA
docker compose -f docker-compose.ia.yml up -d --build

# Reiniciar um serviço específico
docker restart tutoria_backend
docker restart tutoria_frontend
```

### Logs e Depuração

```bash
# Logs do backend (em tempo real)
docker logs -f tutoria_backend

# Logs do serviço de IA
docker logs -f tutoria_python_ia

# Logs do ngrok
docker logs tutoria_ngrok

# Ver URL pública do ngrok (PowerShell)
(Invoke-RestMethod http://localhost:4040/api/tunnels).tunnels[0].public_url
```

### Banco de Dados

```bash
# Atualizar schema do banco
docker exec tutoria_backend npx prisma db push

# Re-executar seed
docker exec tutoria_backend npx prisma db seed

# Abrir Prisma Studio (interface visual do banco)
# Já roda automaticamente dentro do container na porta 5555
```

### Limpeza Total

```bash
# Remove tudo (containers, volumes, dados)
docker compose down -v
docker compose -f docker-compose.ia.yml down
docker compose -f docker-compose.infra.yml down -v
```

> ⚠️ O flag `-v` remove os volumes (dados do banco e MinIO). Use com cuidado.

---

## 📁 Estrutura do Projeto

```
Tutoria_tech/
├── .env                          # Token do ngrok (não versionado)
├── .env.example                  # Exemplo do .env
├── docker-compose.yml            # App: Backend + Frontend + ngrok
├── docker-compose.infra.yml      # Infra: PostgreSQL + MinIO
├── docker-compose.ia.yml         # IA: Python FastAPI
│
├── backend/
│   ├── .env                      # Variáveis do backend
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma         # Modelo de dados
│   │   └── seed.js               # Dados iniciais (41 usuários, equipes, etc.)
│   └── src/
│       ├── server.js             # Entrypoint Fastify
│       ├── routes/               # Rotas da API
│       ├── docs/                 # Contexto da Rose
│       └── ...
│
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── public/
│   │   └── favicon.svg           # Ícone da aba do navegador
│   └── src/
│       ├── App.jsx               # Rotas React
│       ├── components/           # Sidebar, Layout, Header, ChatWidget...
│       ├── context/              # AuthContext, ChatContext
│       ├── pages/                # Dashboard, Login, Materiais, Agenda...
│       └── lib/                  # Utilitários (api.js)
│
└── python-ia/
    ├── Dockerfile
    ├── requirements.txt
    ├── main.py                   # Entrypoint FastAPI
    ├── ia_rose.py                # Lógica da Rose (RAG)
    └── process_files.py          # Processamento de documentos
```

---

## 🔑 Variáveis de Ambiente

### `.env` (raiz do projeto)

| Variável | Descrição | Obrigatória |
| :--- | :--- | :---: |
| `NGROK_AUTHTOKEN` | Token de autenticação do ngrok | ✅ |

### `backend/.env`

| Variável | Descrição | Valor padrão |
| :--- | :--- | :--- |
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://tutoriatech_user:tutoriatech_pass@db:5432/tutoriatech?schema=public` |
| `PORT` | Porta do Fastify | `3001` |
| `JWT_SECRET` | Segredo para assinatura JWT | `mude_esse_segredo_em_producao` |

> As variáveis de MinIO e Python IA são injetadas automaticamente pelo `docker-compose.yml`.

---

## 📄 Licença

Projeto acadêmico desenvolvido para o programa **Technovation Girls**.
