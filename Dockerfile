FROM node:22-alpine AS builder

WORKDIR /app

COPY . ./

RUN npm ci
EXPOSE 3333

CMD ["npx", "tsx", "src/server.ts"]