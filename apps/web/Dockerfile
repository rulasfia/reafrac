FROM oven/bun:1.3-slim AS base

# Multistage Dockerfile for Bun + TanStack Start application
# Stage 1: Build stage
FROM base AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* bunfig.toml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/feed-updater/package.json ./apps/feed-updater/
COPY apps/content-proxy/package.json ./apps/content-proxy/
COPY packages/database/package.json ./packages/database/
COPY packages/feed-utils/package.json ./packages/feed-utils/
COPY packages/external-script/package.json ./packages/external-script/

# Install dependencies (including devDependencies for build)
RUN bun install --linker hoisted --frozen-lockfile

# Copy source code
COPY tsconfig.base.json tsconfig.json ./
COPY apps/web/ ./apps/web/
COPY apps/feed-updater/ ./apps/feed-updater/
COPY apps/content-proxy/ ./apps/content-proxy/
COPY packages/database/ ./packages/database/
COPY packages/feed-utils/ ./packages/feed-utils/
COPY packages/external-script/ ./packages/external-script/

# Build application with version injection
ARG BUILD_VERSION
ARG BUILD_DATE
ARG VITE_APP_VERSION
ENV NODE_ENV=production
ENV VITE_APP_VERSION=${VITE_APP_VERSION:-dev}
RUN bun run build --filter=@reafrac/web --filter=@reafrac/database --filter=@reafrac/feed-utils

FROM base AS dependencies

WORKDIR /app

COPY package.json bun.lock* bunfig.toml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/feed-updater/package.json ./apps/feed-updater/
COPY apps/content-proxy/package.json ./apps/content-proxy/
COPY packages/database/package.json ./packages/database/
COPY packages/feed-utils/package.json ./packages/feed-utils/
COPY packages/external-script/package.json ./packages/external-script/

RUN bun install --linker hoisted --frozen-lockfile --production

# Stage 2: Production stage
FROM base AS runner

# Set environment to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/server.ts ./
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/bun.lock  ./
COPY --from=builder /app/bunfig.toml  ./
COPY --from=builder /app/turbo.json  ./

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Switch to non-root user (bun user already exists in image)
USER bun

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --tries=1 -O /dev/null http://localhost:3000/ || exit 1

# Set default environment variables
ENV PORT=3000

# Run server
CMD ["bun", "run", "-r", "./dist/server/instrument.server.mjs", "server.ts"]
