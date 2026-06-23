#  Tutoria Tech — Gestão do Programa Meninas Digitais

---

###  Sistema Web para Gestão do Projeto Meninas Digitais — UTFPR-CP

#### Integrantes do Grupo 10

| Integrante | RA |
| :--- | :---: |
| **Gian Pedro Rodrigues** | 2503638 |
| **João Marcelo Alves Müller** | 2525461 |
| **João Victor da Cruz Silvestre** | 2144263 |
| **Luiz Arthur Chagas Oliveira** | 1905058 |

---

Plataforma web para apoiar o programa **Technovation Girls**, com acompanhamento de alunas, gestão de equipes, agenda de encontros, materiais de apoio e a **Rose** — assistente de IA com RAG integrada.

---

## 📑 Sumário

- [Funcionalidades](#funcionalidades) — o que a plataforma oferece
- [Stack](#stack) — tecnologias utilizadas
- [Documentação](#documentação) — guias técnicos detalhados
- [Pré-requisitos](#pré-requisitos) — Docker e Git
- [Início Rápido](#início-rápido) — instalação em 2 comandos
- [Logins de Teste](#logins-de-teste) — credenciais para avaliar o sistema
- [Licença](#licença)

---

##  Funcionalidades

| Funcionalidade | Descrição |
| :--- | :--- |
| **Dashboard por papel** | Visão personalizada para Admin, Mentora e Aluna |
| **Gestão de Equipes** | Criar times, adicionar alunas, código de acesso para auto-entrada |
| **Progresso das Alunas** | Acompanhamento por etapas (Início → Desenvolvendo → Avançado → Concluído) |
| **Materiais de Apoio** | Upload de arquivos com categorias e tipos configuráveis |
| **Agenda de Eventos** | 4 tipos de encontro com controle de presença |
| **Rose IA (RAG)** | Assistente com base de conhecimento em PDFs, documentos e URLs |
| **Rastreador de sites** | Descobre automaticamente todas as páginas internas de um site para vetorizar em lote |
| **Configurações Dinâmicas** | Categorias, tipos e status configuráveis pelo Admin |
| **Navegação adaptativa** | Sidebar hover no desktop (flutua sobre o conteúdo) + drawer + BottomNav no mobile |

---

##  Stack

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React 18 · Vite · Tailwind CSS · Lucide Icons |
| **Backend** | Node.js · Fastify · Prisma ORM · JWT |
| **IA** | Python 3.11 · FastAPI · Google Gemini · pgvector |
| **Banco de Dados** | PostgreSQL 16 + pgvector |
| **Armazenamento** | MinIO (S3-compatível) |
| **Infraestrutura** | Docker Compose |

---

##  Documentação

| Documento | Descrição |
| :--- | :--- |
| [📦 Guia de Instalação](docs/INSTALACAO.md) | Como rodar localmente, configurar a IA Rose e popular o banco |
| [🏗️ Arquitetura do Sistema](docs/ARQUITETURA.md) | Serviços, fluxos, modelo de dados e controle de acesso |
| [🗄️ Modelo de Dados](docs/DATABASE.md) | Tabelas, relacionamentos, enums e busca vetorial (pgvector) |

---

##  Pré-requisitos

| Ferramenta | Download |
| :--- | :--- |
| 🐳 **Docker Desktop** (com WSL 2) | https://docs.docker.com/desktop/setup/install/windows-install/ |
| 🔧 **Git** | https://git-scm.com/downloads/win |

---

##  Início Rápido

```powershell
# 1. Clonar o repositório
git clone https://github.com/GianSE/Tutoria_tech.git
cd Tutoria_tech

# 2. Subir toda a stack com um único comando
docker compose -f docker-compose.full.yml up -d --build
```

Acesse em: **http://localhost:5173**

### Logins de Teste

Na tela de login, clique nos **botões de acesso rápido** ou entre manualmente:

| Perfil | E-mail | Senha |
| :--- | :--- | :--- |
| Admin | `admin@projeto.com` | `admin` |
| Mentora | `mentora1@tutoria.com` | `password123` |
| Aluna | `aluna1@tutoria.com` | `password123` |

> Para mais detalhes, consulte o [Guia de Instalação](docs/INSTALACAO.md).

---

##  Licença

Projeto acadêmico desenvolvido para o programa **Meninas Digitais - UTFPR-CP**.
