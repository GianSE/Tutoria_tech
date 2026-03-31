# Tutoria Meninas STEM — Acompanhamento 🚀

Sistema web para o programa de monitoria e tutoria focada em incentivar meninas nas áreas de STEM (Ciência, Tecnologia, Engenharia e Matemática), especialmente desenhado para apoiar as equipes do **Technovation Girls**.

## 💻 Stack Tecnológica

O sistema foi arquitetado com separação clara de responsabilidades, utilizando uma stack web moderna:

### Backend (API REST)
- **[Node.js](https://nodejs.org/) & [Fastify](https://fastify.dev/)**: Framework web extremamente rápido para o servidor.
- **[Prisma ORM](https://www.prisma.io/)**: Mapeamento objeto-relacional tipado e migrações do banco de dados.
- **[MariaDB](https://mariadb.org/)**: Banco de dados relacional (suportado pela infraestrutura via Docker).
- **[@fastify/jwt](https://github.com/fastify/fastify-jwt) & bcryptjs**: Autenticação baseada em tokens (JWT) e hashing seguro de senhas.

### Frontend (SPA - Single Page Application)
- **[React.js](https://react.dev/) & [Vite](https://vitejs.dev/)**: Biblioteca para construção de interfaces e ferramenta de build/hot-reload ágil.
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework utilitário de CSS para estilizar os componentes rapidamente.
- **[React Router DOM](https://reactrouter.com/)**: Gerenciamento das rotas navegáveis da aplicação.
- **[Lucide React](https://lucide.dev/)**: Biblioteca de ícones consistente e leve.

### Infraestrutura
- **[Docker](https://www.docker.com/) & Docker Compose**: Totalmente conteinerizado, garantindo padronização desde o desenvolvimento até possível deploy. Nada precisa ser instalado na máquina além do próprio Docker.

## ⚙️ Técnicas e Design Patterns Utilizados

1. **RBAC (Role-Based Access Control)**: Controle rígido de acesso baseado nos perfis `ADMIN`, `MENTORA` e `ALUNA`. A interface se adapta e o backend bloqueia rotas para garantir segurança de ponta a ponta.
2. **Context API**: Uso focado para a persistência e consumo da camada de Autenticação (`AuthContext.jsx`) reduzindo o repasse maçante de props manuais.
3. **Hot-Reload em Contêineres**: O desenvolvimento utiliza volumes do Docker espelhando a máquina física para os contêineres e preservando ferramentas de recompilação do Vite automaticamente.
4. **Agregação Paralela (Promise.all)**: O endpoint analítico do Dashboard carrega múltiplas KPIs em diferentes tabelas de forma assíncrona otimizando ao máximo o tempo de resposta.

---

## 🏃 Como rodar o projeto localmente

O projeto foi inteiramente arquitetado para que **toda a instalação dependa 100% dependente de containers**. A **ÚNICA** coisa que você precisa ter instalada na sua máquina é o Docker (além de manter as portas 3001, 5173 e 3307 liberadas na máquina, que é o padrão). Nada de Node.js instável, MariaDB ou outras dependências locais que quebram o projeto.

### 0. Instalar o Docker (Único Pré-requisito)
Caso ainda não tenha o Docker instalado, acesse o link abaixo, baixe e instale a versão compatível com seu sistema operacional:

[![Baixar Docker](https://img.shields.io/badge/📥_Baixar_Docker_Desktop-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/products/docker-desktop/)

Após a instalação, certifique-se de que o aplicativo do Docker esteja aberto/rodando em segundo plano.

### 1. Configurar o arquivo `.env`
Renomeie, ou faça uma cópia, do arquivo `backend/.env.example` para `backend/.env`. (As configurações padrão inseridas já funcionam perfeitamente na sua máquina).

### 2. Iniciar o sistema
No diretório raiz do projeto (onde está o arquivo `docker-compose.yml`), abra o seu terminal e execute o comando abaixo:

```bash
docker compose up -d --build
```

*(Pronto! O Docker fará o download das imagens, instalará as dependências, criará o banco de dados e rodará as migrações automaticamente no fundo).*

### 3. Acessar e Logar
O sistema já estará rodando em: **[http://localhost:5173](http://localhost:5173)**

Para o seu **primeiro acesso**, utilize as credenciais padrão geradas na inicialização do banco:
- **E-mail**: `admin@projeto.com`
- **Senha**: `admin`

*(Por segurança, mude a senha na aba "Meu Perfil" assim que entrar).*

---

## 🛠️ Comandos Úteis (Manutenção)

**Derrubar tudo preservando os dados:**
```bash
docker compose down
```

**Derrubar tudo e LIMPAR O BANCO DE DADOS totalmente:**
```bash
docker compose down -v
```

**Aplicar uma nova mudança no banco de schema Prisma feita localmente:**
```bash
docker exec -it tutoria_backend npx prisma migrate dev --name <nome_da_mudanca>
```
