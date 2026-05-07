# 🚀 Instalação Local — Tutoria Tech

---

## Pré-requisitos

- 🐳 **Docker Desktop** (com WSL 2): <a href="https://docs.docker.com/desktop/setup/install/windows-install/" target="_blank">docs.docker.com</a>
- 🔧 **Git**: <a href="https://git-scm.com/downloads/win" target="_blank">git-scm.com</a>

---

## 1. Clonar

```powershell
git clone https://github.com/GianSE/Tutoria_tech.git
cd Tutoria_tech
```

---

## 2. Variáveis de ambiente

O arquivo `backend/.env.dev` já vem pré-configurado — não precisa alterar nada para rodar localmente.

---

## 3. Subir a infraestrutura

```powershell
docker compose -f docker-compose.infra.yml up -d
```

Aguarde ambos ficarem `(healthy)` antes de continuar:

---

## 4. Subir a aplicação

```powershell
docker compose -f docker-compose.app.yml up -d --build
```

Na primeira execução o backend aplica as migrations e executa o seed automaticamente.

Para re-popular o banco manualmente (ex: após limpeza de dados):

```powershell
docker exec tutoria_backend npx prisma db seed
```

O seed cria **41 usuários** (1 admin, 10 mentoras, 30 alunas), 5 equipes, 7 materiais e 15 eventos.

---

## 5. Acessar

| URL | Descrição |
| :--- | :--- |
| <a href="http://localhost:5173" target="_blank">localhost:5173</a> | Frontend (interface principal) |
| <a href="http://localhost:9001" target="_blank">localhost:9001</a> | MinIO Console (usuário: `minioadmin` / senha: `minioadmin`) |
| `localhost:5432` | PostgreSQL (DBeaver, pgAdmin, etc.) |

> Backend e IA comunicam-se exclusivamente pela rede interna Docker.

### Credenciais de teste

| Perfil | Email | Senha |
| :--- | :--- | :--- |
| Admin | `admin@projeto.com` | `admin` |
| Mentora | `mentora1@tutoria.com` | `password123` |
| Aluna | `aluna1@tutoria.com` | `password123` |

---

## 6. Subir a IA Rose

### Chave Gemini

A `GEMINI_API_KEY` não fica em nenhum `.env` — é configurada pelo Admin dentro da aplicação:

1. Login como Admin → **Configurações**
2. Cole a chave obtida em <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com/apikey</a>

### Container

```powershell
docker compose -f docker-compose.ia.yml up -d --build
```

### Como funciona

A Rose usa RAG: Admin faz upload de PDFs em **Materiais**, o sistema vetoriza e armazena no PostgreSQL (pgvector). A cada pergunta, a Rose busca os trechos relevantes e gera a resposta via Gemini.

### System Prompt

Personalidade e regras da Rose ficam em `backend/src/docs/rose-context.md`. O Admin também pode editar o prompt pelo painel em **Configurações**.

---

## 7. Derrubar

```powershell
docker compose -f docker-compose.app.yml down
docker compose -f docker-compose.ia.yml down
docker compose -f docker-compose.infra.yml down
```

### Limpeza total (apaga todos os dados)

```powershell
docker compose -f docker-compose.app.yml down
docker compose -f docker-compose.ia.yml down
docker compose -f docker-compose.infra.yml down -v
```

> ⚠️ `-v` remove os volumes (banco + MinIO). O próximo `up` recria tudo via seed.
