# syntax=docker/dockerfile:1
# @libsql/client ships prebuilt linux-gnu binaries; use Debian (glibc). Avoid Alpine/musl.

FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN corepack enable \
  && corepack prepare pnpm@10.33.1 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY resources ./resources

RUN pnpm run build \
  && pnpm prune --prod --ignore-scripts

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates tini \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/resources ./resources

# Mount a volume here (see docker-compose) for DATABASE_PATH default /app/data/bot.sqlite
RUN mkdir -p /app/data

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/index.js"]
