# 🚀 Instalação Local — Tutoria Tech

## Vídeo tutorial
https://drive.google.com/file/d/1iu-f_WCb6BklwU2wRFgTo_Sw_iyqxVmK/view?usp=sharing

---

## Pré-requisitos

- 🐳 **Docker Desktop** (com WSL 2): https://docs.docker.com/desktop/setup/install/windows-install/
- 🔧 **Git**: https://git-scm.com/downloads/win

---

## 1. Clonar

```powershell
git clone https://github.com/GianSE/Tutoria_tech.git
cd Tutoria_tech
```

---

## 2. Variáveis de ambiente

O arquivo `backend/.env.dev` já vem pré-configurado — não é necessário alterar nada para rodar localmente.

---

## 3. Subir a Stack Completa (Recomendado)

Um único comando sobe todos os 5 serviços na ordem correta:

```powershell
docker compose -f docker-compose.full.yml up -d --build
```

Serviços iniciados:

| Container | Função | Porta |
| :--- | :--- | :--- |
| `tutoria_db` | PostgreSQL 16 + pgvector | 5432 |
| `tutoria_minio` | Object storage (MinIO) | 9000 / 9001 |
| `tutoria_python_ia` | IA Rose (FastAPI + Gemini) | interno |
| `tutoria_backend` | API REST (Fastify + Prisma) | interno |
| `tutoria_frontend` | Interface React (Vite) | **5173** |

Na primeira execução o backend aplica o schema, executa o seed e sobe automaticamente.

---

## 4. Acessar

| URL | Descrição |
| :--- | :--- |
| **http://localhost:5173** | Interface principal |
| http://localhost:9001 | Painel MinIO (`minioadmin` / `minioadmin`) |
| `localhost:5432` | PostgreSQL (DBeaver, pgAdmin, etc.) |

> Backend e IA comunicam-se exclusivamente pela rede interna Docker — não ficam expostos ao host.

### Logins de Teste

Na tela de login, use os **botões de acesso rápido** (Admin, Mentora, Aluna) ou entre manualmente:

| Perfil | E-mail | Senha | Destaques |
| :--- | :--- | :--- | :--- |
| Admin | `admin@projeto.com` | `admin` | Acesso total, configurações de IA |
| Mentora | `mentora1@tutoria.com` | `password123` | Mentora do time DevStars, 6 alunas |
| Aluna | `aluna1@tutoria.com` | `password123` | Membro do DevStars, progresso Avançado |

### Códigos de acesso dos times

| Time | Código |
| :--- | :--- |
| DevStars | `devstars2024` |
| CodeQueens | `codequeens01` |
| CyberGirls | `cybergirls99` |
| AlgorithmAngels | `angels2024` |
| LogicLadies | `logicladies` |

---

## 5. O que o Seed cria automaticamente

Na primeira execução (ou ao rodar `docker exec tutoria_backend npx prisma db seed`):

- **41 usuários**: 1 admin, 10 mentoras, 30 alunas
- **5 equipes** com alunas conectadas, código de acesso e descrição
- **30 registros de progresso** com estágios e feedbacks variados
- **7 materiais** com categorias e tipos corretos
- **15 eventos** na agenda (10 realizados + 5 pendentes com todos os 4 tipos)
- **16 opções** de Configurações de Páginas (categorias, tipos, status)
- **Base de conhecimento padrão**: PDFs da pasta `arquivos/` enviados ao MinIO + URLs do `links.txt` prontos para vetorização

---

## 6. Configurar a IA Rose

A `GEMINI_API_KEY` não fica em nenhum `.env` — é configurada pelo Admin dentro da aplicação:

1. Login como Admin → menu lateral → **Configurações da IA**
2. Clique em **"Obter chave gratuita"** para ver o passo a passo
3. Cole a chave no campo **Gemini API Key**
4. Clique em **"Testar API Key"** — a chave é validada e **salva automaticamente** se válida

### Base de conhecimento

Na mesma tela, os documentos padrão (PDFs + URLs) já aparecem como **Pendente**. Basta clicar em **"Vetorizar"** em cada um para que a Rose passe a usá-los nas respostas.

Para adicionar novos documentos:
- **Arquivo**: clique em "Fazer Upload de Arquivo" (PDF, DOCX, TXT, MD, XLSX, CSV)
- **URL / Site**: cole a URL no campo "Adicionar URL / Site" e clique em "Adicionar URL"

Para atualizar o conteúdo de uma URL, clique em **"Atualizar"** — a Rose re-lê o site e recria os embeddings.

---

## 7. Alternativa: Subir em partes (desenvolvimento)

Se preferir controlar cada camada separadamente:

```powershell
# 1. Infraestrutura (banco + storage) — aguardar (healthy)
docker compose -f docker-compose.infra.yml up -d

# 2. Aplicação (backend + frontend)
docker compose -f docker-compose.app.yml up -d --build

# 3. Serviço de IA
docker compose -f docker-compose.ia.yml up -d --build
```

---

## 8. Re-popular o banco

```powershell
docker exec tutoria_backend npx prisma db seed
```

O seed usa `upsert` — seguro para rodar múltiplas vezes sem duplicar dados.

Para **zerar tudo** e recomeçar do zero:

```powershell
docker exec tutoria_backend npx prisma db push --force-reset --accept-data-loss
docker exec tutoria_backend npx prisma db seed
```

---

## 9. Derrubar

```powershell
docker compose -f docker-compose.full.yml down
```

### Limpeza total (apaga todos os dados)

```powershell
docker compose -f docker-compose.full.yml down -v
```

> ⚠️ `-v` remove os volumes (banco + MinIO). O próximo `up` recria tudo via seed.
