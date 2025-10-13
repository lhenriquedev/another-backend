# Etapa de build
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3333

# Executa diretamente com TSX
CMD ["npx", "tsx", "src/server.ts"]
