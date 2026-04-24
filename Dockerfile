FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  && corepack prepare pnpm@10.33.1 --activate \
  && pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY resources ./resources
RUN pnpm run build
RUN pnpm prune --prod --ignore-scripts

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/resources ./resources

# SQLite data directory mounted by Docker volume.
RUN mkdir -p /app/data

CMD ["node", "dist/index.js"]
