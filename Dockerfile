FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY nest-cli.json ./
COPY drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

# Устанавливаем зависимости для сборки нативных модулей (bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --omit=dev && \
    # Удаляем build-зависимости после установки для уменьшения размера образа
    apk del python3 make g++ && \
    # Оставляем только runtime зависимости
    apk add --no-cache libc6-compat

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/src/database/schema.ts ./src/database/schema.ts
COPY --from=builder /app/drizzle ./drizzle

EXPOSE 3000

CMD ["node", "dist/main"]

