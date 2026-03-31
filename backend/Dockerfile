# ─── Imagem base ───────────────────────────────────────────────────────────────
FROM node:20-alpine

# Instala openssl para o Prisma gerar o client corretamente
RUN apk add --no-cache openssl

WORKDIR /app

# Copia manifesto de dependências e instala (aproveitando cache do Docker)
COPY package.json package-lock.json* ./
RUN npm install

# Copia o restante do código-fonte
COPY . .

# Gera o Prisma Client
RUN npx prisma generate

# Expõe porta do Fastify
EXPOSE 3001

# Entrypoint: aplica migrações, roda seed e sobe o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node src/server.js"]
