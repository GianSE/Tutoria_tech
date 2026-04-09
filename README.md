# Tutoria Tech - Plataforma de Mentoria e Aprendizagem

O **Tutoria Tech** é uma plataforma web robusta desenvolvida para apoiar o programa de mentorias, focando no acompanhamento de alunas, gestão de equipes, agenda de encontros e distribuição de materiais de apoio. A plataforma conta com a **Rose**, uma assistente de IA integrada, e armazenamento S3-compatível para arquivos.

---

## 🚀 Visão Geral

O sistema oferece um ambiente centralizado para três perfis distintos:
- **Administradores**: Gestão total de usuários, configurações de IA e base de conhecimento.
- **Mentoras**: Gestão de equipes (tutorias), registro de presenças em eventos e publicação de materiais.
- **Alunas**: Acesso a materiais, acompanhamento do progresso da equipe e chat interativo com a Rose.

---

## 🛠 Stack Técnica

### Backend
- **Node.js** com framework **Fastify** (alta performance).
- **Prisma ORM** para modelagem de dados e migrações.
- **PostgreSQL** como banco de dados principal.
- **pgvector** para busca semântica e armazenamento de embeddings.
- **Google Generative AI SDK (Gemini)** para o motor da Rose.
- **AWS SDK (S3 Client)** para integração com armazenamento de objetos.

### Frontend
- **React** (Vite) + **Tailwind CSS** para uma interface moderna e responsiva.
- **Lucide React** para iconografia dinâmica e intuitiva.

### Infraestrutura & Armazenamento
- **Docker Compose** para orquestração de containers.
- **MinIO**: Servidor de armazenamento de objetos S3-compatível para PDFs, vídeos e imagens.

---

## 👮 Controle de Acesso (RBAC)

A plataforma utiliza um sistema rigoroso de permissões:

| Recurso | Administrador | Mentora | Aluna |
| :--- | :---: | :---: | :---: |
| Dashboard Geral | ✅ Total | ✅ Próprio | ✅ Próprio |
| Gestão de Usuários | ✅ Sim | ❌ Não | ❌ Não |
| Criar Equipes | ✅ Sim | ✅ Sim | ❌ Não |
| Gerenciar Presença | ✅ Sim | ✅ Sim | ❌ Não |
| Publicar Materiais | ✅ Sim | ✅ Sim | ❌ Não |
| Configurações de IA | ✅ Sim | ❌ Não | ❌ Não |
| Chat com a Rose | ✅ Sim | ✅ Sim | ✅ Sim |

---

## ✨ Funcionalidades Principais

### 📂 Gestão de Materiais de Apoio
- **Upload Múltiplo**: Envio de vários arquivos simultaneamente para o MinIO.
- **Ícones Inteligentes**: Identificação visual automática por tipo de arquivo (PDF, Vídeo, Imagem, Código, Zip).
- **Privacidade**: Materiais configurados com leitura pública via política de bucket S3.

### 📅 Agenda e Presença
- **Filtros Avançados**: Filtragem por tipo de evento e por status (Agendado, Realizado, Cancelado).
- **Ordenação Inteligente**: Eventos agendados aparecem automaticamente no topo da lista.
- **Checklist de Presença**: Registro rápido de presenças por checklist ou contagem manual.

### 🤖 IA Rose
- **Rose Chat**: Assistente treinada em documentos específicos via RAG (Retrieval-Augmented Generation).
- **Base de Conhecimento**: Upload de PDFs para alimentar a memória da Rose usando pgvector.

---

---

## ⚙️ Como Rodar o Projeto

### Opção A: Deploy Rápido na Nuvem (Recomendado)
Suba toda a infraestrutura automaticamente em um VPS (DigitalOcean) usando **Terraform**.

1.  Acesse a pasta: `cd terraform`
2.  Inicialize: `terraform init`
3.  Aplique as mudanças: `terraform apply`
    *   O Terraform solicitará: Token, Fingerprint SSH, `domain_name`, `admin_email` e `jwt_secret`.
    *   O IP público do servidor será exibido ao final.
4.  Configure o DNS do seu domínio apontando o registro **A** para o IP do droplet.
5.  Aguarde ~3 min e acesse **https://SEU_DOMINIO**.

> O proxy reverso (Caddy) já gera o HTTPS automaticamente e roteia `/api` para o backend.
> O MinIO fica disponível em `https://SEU_DOMINIO/minio`.

### Opção B: Rodar Localmente (Desenvolvimento)
Ideal para testar mudanças usando **Docker Desktop**.

1.  Crie um arquivo `.env` na pasta `backend/` seguindo o modelo abaixo.
2.  Na raiz do projeto, execute:
    ```bash
    docker compose up -d --build
    ```
3.  Acesse [http://localhost:5173](http://localhost:5173).

---

## 📄 Variáveis de Ambiente (.env)
Exemplo para rodar a aplicação localmente:
```env
DATABASE_URL="postgresql://tutoriatech_user:tutoriatech_pass@db:5432/tutoriatech?schema=public"
PORT=3001
JWT_SECRET=sua_chave_secreta_aqui

# Configurações MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=materiais
MINIO_PUBLIC_URL=http://localhost:9000
```

## 🚀 CI/CD (Deploy automático)
Você pode automatizar o deploy com GitHub Actions via SSH.

Secrets esperados no GitHub:
- `DEPLOY_HOST` (IP do droplet)
- `DEPLOY_USER` (ex: root)
- `DEPLOY_SSH_KEY` (chave privada com acesso ao servidor)

O pipeline executa:
```
cd /opt/Tutoria_tech
git pull
COMPOSE_PROFILES=prod docker compose up -d --build
```

### 3. Acesso e Dados Iniciais (Seed)
A plataforma já vem com **40+ usuários de teste** (nomes reais, mentoras e equipes).
- **Admin**: `admin@projeto.com` / Senha: `admin`
- **Testes**: `mentora1@tutoria.com` ou `aluna1@tutoria.com` / Senha: `password123`

---

## 🐳 Serviços no Docker Compose
- `tutoria_db`: PostgreSQL + pgvector na porta 5432.
- `tutoria_minio`: Armazenamento S3 nas portas 9000 (API) e 9001 (Console).
- `tutoria_backend`: API Fastify na porta 3001.
- `tutoria_frontend`: App React na porta 5173.

---

## 🛠️ Comandos de Manutenção

**Reiniciar serviços:**
```bash
docker compose restart backend frontend
```

**Verificar Logs:**
```bash
docker compose logs -f backend
```

**Atualizar Banco de Dados:**
```bash
docker compose exec backend npx prisma db push
```
