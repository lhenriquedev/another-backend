# --- Build stage ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
 
# --- Run stage ---
FROM node:22-alpine
WORKDIR /app

EXPOSE 3333
CMD ["node", "--experimental-strip-types", "src/server.ts"]


