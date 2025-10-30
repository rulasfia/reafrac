# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Install dependencies
bun install

# Start development server (port 3000)
bun dev

# Build for production
bun build

# Start production server
bun start

# Run tests
bun test

# Run linter
bun run lint
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

### Technology Stack
- **Framework**: TanStack Start (React SSR framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS with React Aria Components
- **Testing**: Vitest with React Testing Library
- **Deployment**: Docker with GitHub Actions

### Project Structure

#### Core Application Files
- `src/routes/__root.tsx` - Root route with layout, providers, and global error handling
- `src/client.tsx` - Client-side hydration entry point
- `src/server.ts` - Server-side entry point with Sentry configuration
- `server.ts` - Production server with intelligent asset preloading

#### Database & Authentication
- `src/lib/db-schema.ts` - Primary database schema (using UUID primary keys)
- `auth-schema.ts` - Legacy auth schema (using text primary keys) - **DO NOT EDIT**
- `src/lib/auth.ts` - Better Auth configuration
- `src/lib/auth-client.ts` - Client-side auth utilities
- `drizzle.config.ts` - Drizzle ORM configuration

#### Key Directories
- `src/routes/` - File-based routing with TanStack Router
- `src/components/` - Reusable React components
- `src/lib/` - Utilities, middleware, and business logic
- `migrations/` - Database migration files

### Application Features
This is an RSS reader client designed to work with Miniflux servers, featuring:
- User authentication with Better Auth
- RSS feed management and reading
- Miniflux server connections via `fluxConnections` table
- Modern responsive UI with dark/light theme support

### Development Patterns

#### Routing
- Uses file-based routing via TanStack Router
- Route files in `src/routes/` automatically generate routes
- Use `createFileRoute` for route components
- Data loading via route loaders or React Query

#### Database Schema
- Primary schema uses UUID primary keys
- Snake_case naming convention in PostgreSQL
- Schema changes require migration generation and application
- Better Auth integration for user management

#### Styling
- Tailwind CSS with custom components
- React Aria Components for accessible UI primitives
- Component variants using class-variance-authority and tailwind-variants
- Theme provider for dark/light mode support

#### Error Handling
- Sentry integration for error tracking
- Global error boundary in root route
- Route-level error components

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
- `VITE_SENTRY_DSN` - Sentry error tracking
- `PORT` - Server port (default: 3000)

### Production Server
The custom production server (`server.ts`) includes:
- Intelligent static asset preloading with configurable memory limits
- ETag support for cache validation
- Gzip compression for eligible assets
- Configurable file filtering via glob patterns
- Performance logging and monitoring
