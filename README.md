# Reafrac

Reafrac is a clean, fast reading companion that keeps your feeds organized and easy on the eyes. Navigate instantly, stay focused, and keep up with the stories that matter.

## Why Reafrac?

- **Comfort-first reading** – elegant typography, dark/light themes, and focus modes that feel great on every screen.
- **Lightning-fast navigation** – keyboard shortcuts, responsive panes, and instant search help you find what matters.
- **Offline-ready** – recently synced feeds stay available even when you hop on a flight or lose signal.
- **Smart extraction** – full article content is pulled in automatically, keeping you out of noisy web pages.
- **Flexible sources** – connect Miniflux or any compatible RSS feeds and keep entries, categories, and read state in sync.
- **Organized workflow** – tagging, filtering, and saved views make it easy to sort, prioritize, and revisit stories.

## Development

This project is a Turborepo monorepo with the following structure:

- **apps/web** - Main web application
- **packages/database** - Shared database schema and connection
- **packages/feed-utils** - RSS feed parsing utilities
- **packages/external-script** - Cron jobs and migration scripts

### Commands

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build all packages
bun build

# Run linting across all packages
bun run lint

# Run type checking
bun run tsc

# Run tests
bun test

# Database operations
bun run db:generate    # Generate migrations
bun run db:migrate     # Apply migrations
bun run db:push        # Push schema changes (dev only)
bun run db:browse      # Open Drizzle Studio

# Scripts
bun run refetch-feeds     # Fetch RSS feeds
bun run migrate-to-shared # Run migration script
```

### Technology Stack

- **Framework**: TanStack Start (React SSR)
- **Runtime**: Bun
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Styling**: Tailwind CSS v4
- **Monorepo**: Turborepo
