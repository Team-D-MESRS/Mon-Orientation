# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build
WORKDIR /app
# OpenSSL est requis par les engines Prisma ; sans lui l'engine « openssl-1.1.x » est choisi et échoue.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# --ignore-scripts : le client Prisma est copié depuis l'étape de build, pas régénéré ici.
RUN npm ci --omit=dev --ignore-scripts
COPY prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/dist ./dist
EXPOSE 8080
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/main"]
