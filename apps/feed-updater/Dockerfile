FROM oven/bun:1.3-alpine AS base

FROM base AS dependencies
RUN apk add --no-cache python3 make g++ postgresql-dev
RUN ln -sf python3 /usr/bin/python

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json bun.lock ./

# Copy workspace dependencies
COPY /apps/content-proxy/package.json ./apps/content-proxy/
COPY /apps/feed-updater/package.json ./apps/feed-updater/
COPY /apps/web/package.json ./apps/web/
COPY /packages/database/package.json ./packages/database/
COPY /packages/feed-utils/package.json ./packages/feed-utils/
COPY /packages/external-script/package.json ./packages/external-script/

RUN bun install --frozen-lockfile --filter "./packages/*" --filter "@reafrac/feed-updater"

FROM dependencies AS builder
WORKDIR /app

# Copy source code
COPY /apps/feed-updater/src/ ./apps/feed-updater/src/
COPY /packages/database/ ./packages/database/
COPY /packages/feed-utils/ ./packages/feed-utils/
COPY /packages/external-script/ ./packages/external-script/

# Build the TypeScript
RUN bun run build

FROM base AS runner
RUN apk add --no-cache libpq libstdc++ libcrypto3 libssl3

WORKDIR /app
ENV NODE_ENV=production

# Copy package.json and built files
COPY package.json bun.lock ./
COPY /packages/database/package.json ./packages/database/
COPY /packages/feed-utils/package.json ./packages/feed-utils/
COPY /packages/external-script/package.json ./packages/external-script/

# Copy built output and dependencies
COPY --from=builder /app/apps/feed-updater/dist ./apps/feed-updater/dist
COPY --from=dependencies /app/node_modules ./node_modules

USER bun

CMD ["bun", "run", "apps/feed-updater/dist/index.js"]
