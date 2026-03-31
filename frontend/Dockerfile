# ─── Stage: build das dependências ────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copia manifesto de dependências e instala
COPY package.json package-lock.json* ./
RUN npm install

# Copia o restante do código-fonte
COPY . .

# Expõe porta padrão do Vite
EXPOSE 5173

# Sobe o servidor de desenvolvimento do Vite ouvindo em todas as interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
