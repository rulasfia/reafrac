FROM oven/bun:1.3-alpine AS base

# Multistage Dockerfile for Bun + TanStack Start application
# Stage 1: Build stage
FROM base AS builder

# 1. Install Python 3 and the tools node-gyp needs
RUN apk add --no-cache python3 make g++ postgresql-dev curl

# 2. (Optional but recommended) create the canonical “python” symlink
RUN ln -sf python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
RUN bun run build

# Stage 2: Production stage
FROM base AS runner

RUN apk add --no-cache libpq libstdc++

# Set environment to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./

# Install only production dependencies
RUN bun install --frozen-lockfile --production

# Switch to non-root user (bun user already exists in the image)
USER bun

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --tries=1 -O /dev/null http://localhost:3000/ || exit 1

# Set default environment variables
ENV PORT=3000

# Run the server
CMD ["bun", "run", "start"]
