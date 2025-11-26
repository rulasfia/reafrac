# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development (Turborepo)
```bash
# Install dependencies (root level)
bun install

# Start development server for all packages/apps
bun dev

# Build all packages and applications
bun build

# Start production servers
bun start

# Run tests across all packages
bun test

# Run linter across all packages
bun run lint

# Run type checking across all packages
bun run tsc
```

### Web App Specific (apps/web)
```bash
# Start web development server only
turbo run dev --filter=@reafrac/web

# Build web app only
turbo run build --filter=@reafrac/web

# Run web app tests
turbo run test --filter=@reafrac/web
```

### Database Operations
```bash
# Generate database migrations
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Push schema changes (development only)
bun run db:push

# Browse database with Drizzle Studio
bun run db:browse
```

### Scripts and External Services
```bash
# Fetch RSS feeds
bun run start --filter=@reafrac/feed-updater

# Start content proxy service
turbo run start --filter=@reafrac/content-proxy
```

### Docker Development
```bash
# Build Docker image
docker build -t reafrac .

# Start services with Docker Compose
docker-compose up -d

# Run migrations manually
docker-compose run --rm migrate
```

## Architecture Overview

### Monorepo Structure (Turborepo)
This is a Turborepo monorepo with the following packages and applications:

#### Packages
- **@reafrac/database** - Shared database schema, connection, and Drizzle configuration
- **@reafrac/feed-utils** - RSS feed parsing and extraction utilities using extractus
- **@reafrac/external-script** - Refetch Feed and migration scripts for feed fetching and data migration

#### Applications
- **@reafrac/web** - Main web application (TanStack Start with React SSR)
- **@reafrac/content-proxy** - Content proxy service for article extraction
- **@reafrac/feed-updater** - Feed updater service for background RSS fetching

### Technology Stack
- **Monorepo**: Turborepo for efficient builds and task orchestration
- **Framework**: TanStack Start (React SSR framework with file-based routing)
- **Runtime**: Bun (JavaScript runtime)
- **Database**: PostgreSQL 17 with Drizzle ORM
- **Authentication**: Better Auth (supports email/password + Google OAuth)
- **Styling**: Tailwind CSS v4 with Base UI
- **UI Components**: Custom components with class-variance-authority and tailwind-variants
- **Data Fetching**: TanStack Query (React Query) + ofetch for external HTTP requests
- **Testing**: Vitest with React Testing Library
- **Linting**: oxc (alternative to ESLint)
- **Error Tracking**: Sentry integration with custom spans
- **Deployment**: Docker with GitHub Actions

### Project Structure

#### Web Application (apps/web)
- `apps/web/src/routes/__root.tsx` - Root route with layout, providers, and global error handling
- `apps/web/src/client.tsx` - Client-side hydration entry point
- `apps/web/src/server.ts` - Server-side entry point with Sentry configuration
- `apps/web/server.ts` - Production server with intelligent asset preloading
- `apps/web/src/routes/` - File-based routing with TanStack Router
- `apps/web/src/components/` - Reusable React components
- `apps/web/src/lib/` - Utilities, middleware, and business logic

#### Database & Authentication (packages/database)
- `packages/database/src/schema.ts` - Primary database schema (using UUID primary keys)
- `packages/database/src/connection.ts` - Database connection and client setup
- `packages/database/drizzle.config.ts` - Drizzle ORM configuration
- `packages/database/migrations/` - Database migration files
- `auth-schema.ts` - Legacy auth schema (using text primary keys) - **DO NOT EDIT**

#### External Scripts & Services (packages/external-script)
- `packages/external-script/src/feed/refetch-feeds.ts` - Cron job function for fetching RSS feeds

#### Feed Utilities (packages/feed-utils)
- `packages/feed-utils/src/index.ts` - RSS feed parsing and extraction utilities using extractus

#### Additional Applications
- `apps/content-proxy/` - Content proxy service for article extraction
- `apps/feed-updater/` - Feed updater service for background RSS fetching

### Application Features
This is an RSS reader client designed to work with Miniflux servers, featuring:
- User authentication with Better Auth
- RSS feed management and reading with full content extraction using extractus
- Miniflux server connections via `fluxConnections` table
- Modern responsive UI with dark/light theme support
- Feed categorization and organization
- Article entry tracking with read/unread status and bookmarking
- Background feed fetching and updating via dedicated services
- Content proxy for efficient article extraction
- Shared feed structure with user subscriptions (multi-user support)

### Development Patterns

#### Routing
- Uses file-based routing via TanStack Router
- Route files in `src/routes/` automatically generate routes
- Use `createFileRoute` for route components
- Data loading via route loaders or React Query

#### Database Schema
- Primary schema located in `packages/database/src/schema.ts` uses UUID primary keys
- Categories and feeds use nanoid for URL-friendly IDs
- Entries use serial for primary key
- Snake_case naming convention in PostgreSQL
- Schema changes require migration generation and application via `packages/database/drizzle.config.ts`
- Better Auth integration for user management
- Shared feed structure with junction tables for user subscriptions and entry states
- Multi-user architecture with shared feeds/entries and user-specific relationships

#### Styling
- Tailwind CSS v4 with @tailwindcss/vite plugin
- Base UI for accessible UI primitives
- Component variants using class-variance-authority and tailwind-variants
- Theme provider for dark/light mode support
- Custom design tokens and responsive design
- @tailwindcss/typography for article content styling
- Custom fonts: Atkinson Hyperlegible (variable), IBM Plex Mono, Merriweather

#### Error Handling
- Sentry integration for error tracking across all applications
- Global error boundary in root route of web app
- Route-level error components
- Sentry instrument file (`instrument.server.mjs`) for comprehensive error tracking
- Custom spans for performance monitoring

These examples should be used as guidance when configuring Sentry functionality within a project.
#### Error / Exception Tracking
Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

#### Tracing Examples
Spans should be created for meaningful actions within applications like button clicks, API calls, and function calls
Ensure you are creating custom spans with meaningful names and operations
Use the `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

#### Custom Span instrumentation in component actions
```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";
        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);
        doSomething();
      },
    );
  };
  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

#### Custom span instrumentation in API calls
```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const data = await ofetch(`/api/users/${userId}`);
      return data;
    },
  );
}
```

### Environment Variables
Key environment variables (see `.env` for complete list):
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)
- `BETTER_AUTH_SECRET` - Authentication secret key
- `BETTER_AUTH_URL` - Authentication service URL
- `VITE_SENTRY_DSN` - Sentry error tracking
- `PORT` - Server port (default: 3000)

### Production Server
The custom production server (`server.ts`) includes:
- Intelligent static asset preloading with configurable memory limits
- ETag support for cache validation
- Gzip compression for eligible assets
- Configurable file filtering via glob patterns
- Performance logging and monitoring
- Memory-efficient response generation

### Server Functions
- Type-safe server functions with `createServerFn`
- Input validation with Zod schemas
- Built-in middleware support (auth, Sentry, logging)
- Sentry tracing integration for performance monitoring
