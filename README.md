# 🌸 Tutoria Tech — Gestão do Programa Meninas Digitais

---

### Sistema Web para Gestão do Projeto Meninas Digitais — UTFPR-CP

#### 👥 Equipe — Grupo 10 (integrantes que participaram do desenvolvimento)

| Integrante | RA |
| :--- | :---: |
| **Gian Pedro Rodrigues** | 2503638 |
| **João Marcelo Alves Müller** | 2525461 |
| **João Victor da Cruz Silvestre** | 2144263 |
| **Luiz Arthur Chagas Oliveira** | 1905058 |

---

## 📑 Sumário

1. [Objetivo do Sistema](#-objetivo-do-sistema)
2. [Funcionalidades Desenvolvidas](#-funcionalidades-desenvolvidas)
3. [Vídeo de Instalação e Execução](#-vídeo-de-instalação-e-execução)
4. [Pré-requisitos](#-pré-requisitos)
5. [Stack e Ferramentas Utilizadas](#-stack-e-ferramentas-utilizadas)
6. [Roteiro de Instalação e Execução](#-roteiro-de-instalação-e-execução)
7. [Roteiro de Testes do Sistema](#-roteiro-de-testes-do-sistema)
8. [Contas de Acesso Padrão](#-contas-de-acesso-padrão)
9. [Documentação Complementar](#-documentação-complementar)
10. [Licença](#-licença)

---

## 🎯 Objetivo do Sistema

O **Tutoria Tech** é uma plataforma web para **gestão do programa Meninas Digitais** da UTFPR-CP, no contexto da iniciativa **Technovation Girls**. Centraliza:

- Administração de equipes de mentoria
- Acompanhamento individual de progresso das alunas
- Organização de agenda de encontros
- Publicação de materiais de apoio
- Assistente de IA (**Rose**) com RAG que responde dúvidas usando documentos e URLs cadastrados

---

## ✨ Funcionalidades Desenvolvidas

| Funcionalidade | Descrição |
| :--- | :--- |
| **Autenticação JWT** | 3 papéis (Admin, Mentora, Aluna) com controle RBAC por rota |
| **Dashboard por papel** | Visão personalizada para cada tipo de usuário |
| **Gestão de Equipes** | CRUD completo + código de acesso para auto-entrada das alunas + cadeado visual |
| **Acompanhamento de Progresso** | 4 estágios (Início → Desenvolvendo → Avançado → Concluído) com feedback da mentora |
| **Materiais de Apoio** | Upload de arquivos com categorias e tipos configuráveis |
| **Agenda de Encontros** | 4 tipos de evento com controle de presença |
| **Rose IA (RAG)** | Assistente com base de conhecimento em PDFs, documentos e URLs (Google Gemini + pgvector) |
| **Rastreador de Sites** | Descobre automaticamente todas as páginas internas de um site para vetorizar em lote |
| **Configurações Dinâmicas** | Categorias, tipos e status configuráveis pelo Admin |
| **Gerenciamento de Usuários** | CRUD com filtros por papel, ordenação A-Z e contagem |
| **Impersonação** | Admin pode entrar como qualquer usuário para testar visões |
| **Sistema de Notificações** | Sininho com atividades recentes |
| **Navegação Adaptativa** | Sidebar hover no desktop + drawer + BottomNav no mobile |
| **Login Rápido** | 3 botões na tela de login (Admin, Mentora, Aluna) com login automático |

---

## 🎥 Vídeo de Instalação e Execução

📺 [Assista ao vídeo tutorial completo aqui](https://drive.google.com/file/d/13GhYx9QM04GGuFyDMIHUFRBnP0raxSxA/view?usp=sharing)

---

## 🛠️ Pré-requisitos

Apenas **dois softwares** precisam estar instalados — todo o resto (banco, Python, Node.js, etc.) roda em containers Docker.

| Ferramenta | Versão | Link |
| :--- | :--- | :--- |
| 🐳 **Docker Desktop** (com WSL 2) | 4.27+ | https://docs.docker.com/desktop/setup/install/windows-install/ |
| 🔧 **Git** | 2.40+ | https://git-scm.com/downloads/win |

---

## 📦 Stack e Ferramentas Utilizadas

### Frontend

| Tecnologia | Versão | Link |
| :--- | :--- | :--- |
| React | 18.x | https://react.dev/ |
| Vite | 5.x | https://vitejs.dev/ |
| Tailwind CSS | 3.x | https://tailwindcss.com/ |
| React Router | 6.x | https://reactrouter.com/ |
| Lucide Icons | latest | https://lucide.dev/ |

### Backend

| Tecnologia | Versão | Link |
| :--- | :--- | :--- |
| Node.js | 20.x | https://nodejs.org/ |
| Fastify | 4.x | https://fastify.dev/ |
| Prisma ORM | 5.x | https://www.prisma.io/ |
| JWT (`@fastify/jwt`) | latest | https://github.com/fastify/fastify-jwt |
| bcryptjs | latest | https://www.npmjs.com/package/bcryptjs |
| AWS SDK S3 (MinIO) | 3.x | https://docs.aws.amazon.com/sdk-for-javascript/ |

### IA (Python)

| Tecnologia | Versão | Link |
| :--- | :--- | :--- |
| Python | 3.11 | https://www.python.org/downloads/ |
| FastAPI | latest | https://fastapi.tiangolo.com/ |
| Google Generative AI | latest | https://ai.google.dev/ |
| BeautifulSoup4 | latest | https://pypi.org/project/beautifulsoup4/ |
| pypdf | latest | https://pypi.org/project/pypdf/ |
| psycopg2-binary | latest | https://www.psycopg.org/ |

### Banco de Dados e Armazenamento

| Tecnologia | Versão | Link |
| :--- | :--- | :--- |
| PostgreSQL | 16 | https://www.postgresql.org/ |
| pgvector (extensão) | 0.7+ | https://github.com/pgvector/pgvector |
| MinIO (S3 compatível) | latest | https://min.io/ |

### Infraestrutura

| Tecnologia | Versão | Link |
| :--- | :--- | :--- |
| Docker Compose | v2 | https://docs.docker.com/compose/ |

---

## 🚀 Roteiro de Instalação e Execução

### Passo 1 — Clonar o repositório

```powershell
git clone https://github.com/GianSE/Tutoria_tech.git
cd Tutoria_tech
```

### Passo 2 — Subir toda a stack com **um único comando**

```powershell
docker compose -f docker-compose.full.yml up -d --build
```

> Este comando automaticamente:
> 1. Sobe o **PostgreSQL 16 + pgvector**
> 2. Sobe o **MinIO** (armazenamento)
> 3. Sobe o **serviço Python IA** (FastAPI)
> 4. Sobe o **backend Fastify** que aplica o schema do banco e roda o **seed** (cria 46 usuários, 5 equipes, 15 eventos, materiais, configurações e base de conhecimento padrão automaticamente)
> 5. Sobe o **frontend React** na porta `5173`

### Passo 3 — Acessar

Abra o navegador em **http://localhost:5173**

### Para derrubar

```powershell
docker compose -f docker-compose.full.yml down
```

Apagar tudo (zerar banco):

```powershell
docker compose -f docker-compose.full.yml down -v
```

---

## 🧪 Roteiro de Testes do Sistema

O sistema já vem **populado com dados de demonstração** após o primeiro `up`. Recomenda-se testar os três papéis na seguinte ordem:

### 1️⃣ Login como ADMIN

Na tela de login, clique no botão **"Admin"** (acesso rápido).

**O que testar:**
- Dashboard com KPIs globais (cards clicáveis com modais)
- **Gerenciar Usuários** — criar/editar/excluir + filtro por papel + ordenação A-Z
- **Configurações da IA** — botão "Obter chave gratuita" explica o passo a passo do Google AI Studio
- Após colar a chave, clique em **"Testar API Key"** — valida e salva automaticamente
- **Base de Conhecimento** — vetorize os documentos padrão (PDFs já presentes), adicione URLs ou use o **Rastreador de Sites**
- Teste o **chat com a Rose** após configurar a IA
- **Configurações de Páginas** — gerencie categorias e status dinâmicos

### 2️⃣ Login como MENTORA

Volte ao login e clique em **"Mentora"**.

**O que testar:**
- Dashboard com seus times e próximos eventos
- **Equipes** → filtro "Minhas Equipes" + criação de novas
- **Progresso das Alunas** → atualizar estágio e feedback individual
- Upload de materiais e criação de eventos

### 3️⃣ Login como ALUNA

Volte ao login e clique em **"Aluna"**.

**O que testar:**
- Dashboard com seu progresso (stepper visual)
- **Meu Progresso** → visualizar etapas e feedback da mentora
- **Equipes** → visualizar times que participa
- Entrar em nova equipe via **código de acesso** (badge 🔒 SENHA indica times protegidos)

### 🔑 Códigos de Acesso dos Times (para testes)

| Time | Código |
| :--- | :--- |
| DevStars | `devstars2024` |
| CodeQueens | `codequeens01` |
| CyberGirls | `cybergirls99` |
| AlgorithmAngels | `angels2024` |
| LogicLadies | `logicladies` |

---

## 🔐 Contas de Acesso Padrão

A tela de login tem **3 botões de acesso rápido** que fazem login automático. Alternativamente, use as credenciais manualmente:

| Perfil | E-mail | Senha | Destaque |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@projeto.com` | `admin` | Acesso total e configurações |
| 👩‍🏫 **Mentora** | `mentora1@tutoria.com` | `password123` | Mentora do DevStars |
| 👩‍🎓 **Aluna** | `aluna1@tutoria.com` | `password123` | Membro do DevStars |

**Outros usuários populados pelo seed:**

- **10 mentoras** no total: `mentora1@tutoria.com` a `mentora10@tutoria.com` (senha `password123`)
- **30 alunas**: `aluna1@tutoria.com` a `aluna30@tutoria.com` (senha `password123`)
- **Usuários nomeados:** Thalia Oliveira, Gisele Rodrigues, Dina Rodrigues (mentoras); Giovana Caetano, Maria Rodrigues (alunas)

---

## 📚 Documentação Complementar

| Documento | Descrição |
| :--- | :--- |
| [📦 Guia de Instalação Detalhado](docs/INSTALACAO.md) | Variantes de instalação, configuração da IA, troubleshooting |
| [🏗️ Arquitetura do Sistema](docs/ARQUITETURA.md) | Serviços, fluxos, navegação, RBAC, estrutura de pastas |
| [🗄️ Modelo de Dados](docs/DATABASE.md) | Tabelas, relacionamentos, enums e busca vetorial (pgvector) |
| [🎥 Tutorial em Vídeo](Tutorial_Video.md) | Passo a passo visual da instalação |
| [📄 Documento de Entrega Final](docs/entrega/DOCUMENTO_ENTREGA.pdf) | Documento oficial de entrega (PDF) |

---

## 📜 Licença

Projeto acadêmico desenvolvido para o programa **Meninas Digitais — UTFPR-CP**.
