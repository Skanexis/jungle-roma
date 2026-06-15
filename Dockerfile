# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
ARG PNPM_VERSION=9.15.9
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN npm install -g pnpm@${PNPM_VERSION}

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm build

FROM base AS prod-deps
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app

RUN groupadd --system jungle \
  && useradd --system --gid jungle --home-dir /app jungle \
  && mkdir -p /app/server/data /app/public/uploads \
  && chown -R jungle:jungle /app

COPY --from=prod-deps --chown=jungle:jungle /app/node_modules ./node_modules
COPY --from=build --chown=jungle:jungle /app/dist ./dist
COPY --chown=jungle:jungle package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=jungle:jungle server ./server
COPY --chown=jungle:jungle public ./public

USER jungle
EXPOSE 3001

CMD ["node", "server/index.mjs", "--serve-dist"]
