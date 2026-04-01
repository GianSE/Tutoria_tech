# Tutoria Tech - Documentacao do Projeto

Plataforma web para acompanhamento de alunas, mentorias e materiais, com assistente de IA (Rose), base de conhecimento vetorial (RAG com pgvector) e painel de analytics.

## Visao Geral

O sistema foi desenhado para apoiar o programa Tutoria Meninas/Technovation com:
- Gestao de usuarios por perfil (ADMIN, MENTORA, ALUNA)
- Gestao de equipes, tutorias, agenda, presenca e progresso
- Chat com a assistente Rose usando Google Gemini
- Base de conhecimento com embeddings em PostgreSQL + pgvector
- Analytics de perguntas com filtros por periodo
- Frontend React com tema escuro/claro

## Stack Tecnica

### Backend
- Node.js + Fastify
- Prisma ORM
- PostgreSQL + pgvector
- JWT (autenticacao/autorizacao)
- Google Generative AI SDK

### Frontend
- React + Vite
- Tailwind CSS
- React Router
- Recharts (graficos no Analytics IA)
- Lucide React (icones)

### Infra
- Docker Compose
- Containers: db, backend, frontend

## Estrutura de Pastas

- backend: API, Prisma schema, seeds e rotas
- frontend: SPA React
- docker-compose.yml: orquestracao local completa

## Como Rodar (Fluxo Oficial)

Prerequisito unico:
- Docker Desktop instalado e em execucao

### 1. Configurar variaveis de ambiente

Crie/edite o arquivo backend/.env com:

```env
DATABASE_URL="postgresql://tutoriatech_user:tutoriatech_pass@db:5432/tutoriatech?schema=public"
PORT=3001
JWT_SECRET=mude_esse_segredo_em_producao
```

Observacao importante:
- A chave da IA (Gemini) e o prompt da Rose sao gerenciados via banco em Configuracao da IA, nao por variavel de ambiente.

### 2. Subir o sistema

Na raiz do projeto:

```bash
docker compose up -d --build
```

Servicos expostos:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Prisma Studio: http://localhost:5555
- PostgreSQL: localhost:5432

### 3. Primeiro acesso

Credencial seed padrao:
- Email: admin@projeto.com
- Senha: admin

## Funcionalidades Principais

### Gestao e acompanhamento
- Dashboard geral
- Usuarios (ADMIN)
- Tutorias (ADMIN/MENTORA)
- Materiais
- Agenda
- Perfil

### IA Rose
- Conversa dedicada com a Rose
- ChatWidget nas demais paginas
- Configuracao de IA (ADMIN): chave Gemini e prompt de sistema
- Base de conhecimento com upload e indexacao vetorial

### Analytics IA (ADMIN)
- Termos mais pesquisados
- Grafico de perguntas por periodo
- Filtros:
  - Data inicial
  - Data final
  - Agrupamento por dia, semana ou mes

## Rotas de API (Resumo)

Base URL: /api

- auth: /auth
- usuarios: /users
- equipes/progresso: /teams
- materiais: /materials
- agenda/presenca: /schedules
- dashboard: /dashboard
- configuracoes IA e base de conhecimento: /settings
- chat Rose: /chat
- analytics de perguntas: /analytics/top-terms

## Banco de Dados

Banco principal: PostgreSQL com extensao pgvector.

Modelos relevantes de IA:
- system_settings
- knowledge_documents
- knowledge_chunks
- chat_analytics

## Tema da Interface

- Tema escuro e tema claro disponiveis
- Alteracao no Meu Perfil, ao lado do nome
- Preferencia salva em localStorage

## Comandos Uteis

Subir/reconstruir:

```bash
docker compose up -d --build
```

Reiniciar servicos:

```bash
docker compose restart backend frontend
```

Parar mantendo dados:

```bash
docker compose down
```

Parar removendo volumes (apaga banco local):

```bash
docker compose down -v
```

Logs:

```bash
docker compose logs backend --tail 100
docker compose logs frontend --tail 100
```

## Troubleshooting Rapido

### Chat da Rose responde erro generico
- Verifique em Configuracao da IA se a chave Gemini foi salva
- Teste conexao pela propria tela de configuracao
- Verifique logs do backend

### Grafico do Analytics sem colunas
- Aplique filtro com intervalo valido
- Confirme se ha perguntas registradas
- Confira se backend/frontend foram reiniciados apos atualizacao

### Erros de import no frontend (dependencias)
- Se houver volume antigo de node_modules no container:
  - docker compose exec frontend npm install
  - docker compose restart frontend

## Observacoes de Desenvolvimento

- O fluxo recomendado do projeto e sempre via Docker Compose.
- Evite setups locais paralelos para nao gerar divergencia de ambiente.
- Quando alterar schema Prisma, valide sincronizacao do banco no container backend.

---

Se quiser, posso adicionar na documentacao um diagrama de arquitetura (frontend -> backend -> postgres/pgvector -> Gemini) e um passo a passo de deploy em VPS.
