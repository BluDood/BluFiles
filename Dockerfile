FROM node:24-bookworm-slim AS builder

RUN apt update -y && apt install -y openssl

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci

WORKDIR /app
COPY . .

RUN npx prisma generate
RUN npm run build

WORKDIR /app/web
RUN npm run build

WORKDIR /app
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runner

RUN apt update -y && apt install -y openssl

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/web/build ./web/build
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

CMD npx prisma migrate deploy && node .