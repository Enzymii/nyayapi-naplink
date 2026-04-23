FROM node:22-alpine AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  && corepack prepare pnpm@10.33.1 --activate \
  && pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
COPY resources ./resources
RUN pnpm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  && corepack prepare pnpm@10.33.1 --activate \
  && pnpm install --frozen-lockfile --prod

COPY --from=build /app/dist ./dist
COPY --from=build /app/resources ./resources

# SQLite data directory mounted by Docker volume.
RUN mkdir -p /app/data

CMD ["node", "dist/index.js"]
