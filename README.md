# ✨ Tutoria Tech — Plataforma de Mentoria e Aprendizagem

> **🎓 Sistema Web para Gestão do Projeto Meninas Digitais – UTFPR-CP**
>
> | Integrante | RA |
> | :--- | :---: |
> | **Gian Pedro Rodrigues** | `2503638` |
> | **João Marcelo Alves Müller** | `2525461` |
> | **João Victor da Cruz Silvestre** | `2144263` |
> | **Luiz Arthur Chagas Oliveira** | `1905058` |

Plataforma web para apoiar o programa **Technovation Girls**, com acompanhamento de alunas, gestão de equipes, agenda de encontros, materiais de apoio e a **Rose** — assistente de IA integrada.

---

## 🛠 Stack

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | React 18 · Vite · Tailwind CSS · Lucide Icons |
| **Backend** | Node.js · Fastify · Prisma ORM · JWT |
| **IA** | Python 3.11 · FastAPI · Google Gemini · pgvector |
| **Banco de Dados** | PostgreSQL 16 + pgvector |
| **Armazenamento** | MinIO (S3-compatível) |
| **Infraestrutura** | Docker Compose |

---

## 📚 Documentação

| Documento | Descrição |
| :--- | :--- |
| [📦 Guia de Instalação](docs/INSTALACAO.md) | Como rodar localmente, configurar a IA Rose e popular o banco |
| [🏗️ Arquitetura do Sistema](docs/ARQUITETURA.md) | Serviços, fluxos, modelo de dados e controle de acesso |

---

## ⚡ Início Rápido

```powershell
# 1º — infraestrutura (banco + storage)
docker compose -f docker-compose.infra.yml up -d

# 2º — aplicação (backend + frontend)
docker compose -f docker-compose.app.yml up -d --build

# 3º — IA Rose (FastAPI + Gemini)
docker compose -f docker-compose.ia.yml up -d --build
```

Acesse em: **http://localhost:5173**

Login de teste: `admin@projeto.com` / `admin`

> Para mais detalhes, consulte o [Guia de Instalação](docs/INSTALACAO.md).

---

## 📄 Licença

Projeto acadêmico desenvolvido para o programa **Technovation Girls**.
