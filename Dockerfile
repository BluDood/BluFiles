FROM node:24-bookworm-slim AS builder

RUN apt update -y && apt install -y openssl

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS web-builder

WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ .

RUN npm run build

FROM node:24-bookworm-slim AS runner

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

COPY --from=web-builder /app/web/build ./web/build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

COPY ./package.json ./
COPY ./docker-entrypoint.sh ./
COPY ./prisma.config.ts ./
COPY ./prisma ./prisma

RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]