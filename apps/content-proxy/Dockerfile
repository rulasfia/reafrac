FROM oven/bun:1.3-slim AS base

# Multistage Dockerfile for Bun + Elysia content-proxy application
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
RUN bun install --linker isolated --frozen-lockfile --filter '!@reafrac/web'

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
ENV NODE_ENV=production
RUN bun run build --filter=@reafrac/content-proxy --filter=@reafrac/feed-utils --filter=@reafrac/external-script

# Stage 2: Production stage
FROM gcr.io/distroless/base

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built application from builder stage
COPY --from=builder /app/apps/content-proxy/server ./

# Expose port
EXPOSE 3001

# Run server
CMD ["./server"]
