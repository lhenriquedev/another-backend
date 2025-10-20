FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3333
CMD ["npx", "tsx", "--env-file", ".env", "src/server.ts"]