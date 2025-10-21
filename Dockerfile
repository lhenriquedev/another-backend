FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production
COPY . ./

EXPOSE 3333
CMD ["node", "--experimental-strip-types", "src/server.ts"]
