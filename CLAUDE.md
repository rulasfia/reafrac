# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Reafrac** is a modern, open-source RSS reader client built with SvelteKit and Svelte 5, designed to work seamlessly with Miniflux servers via API. Future standalone mode support is planned.

## Technology Stack

- **Framework**: SvelteKit with Svelte 5 (runes syntax)
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS v4 with Shadcn/ui components
- **Deployment**: Cloudflare Workers (custom domain: reafrac.com)
- **Package Manager**: Bun 2.12+ (preferred), npm/yarn/pnpm support
- **State Management**: Svelte 5 runes + custom classes for complex state
- **Data Fetching**: TanStack Query (Svelte Query) + server-side load functions
- **Build Tool**: Vite 7.0.4

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build

# Type Checking
npm run check        # Check TypeScript types
npm run check:watch  # Watch for type changes

# Code Quality
npm run format       # Format code with Prettier
npm run lint         # Lint code with ESLint (includes Prettier check)

# Setup
npm run prepare      # Sync SvelteKit files
```

## Project Architecture

### Directory Structure

```
src/
├── lib/
│   ├── api/              # Miniflux API client (entry.ts, feed.ts, user.ts, types.ts)
│   ├── components/       # Svelte components
│   │   ├── ui/          # Shadcn/ui component library
│   │   ├── entry/       # Entry-related components
│   │   └── *.svelte     # Main app components
│   ├── hooks/           # Svelte hooks (is-mobile.svelte.ts)
│   ├── stores/          # Svelte stores (cookie-store.svelte.ts)
│   └── utils/           # Utility functions (image.ts, index.ts)
├── routes/
│   ├── (app)/          # Protected routes (require auth)
│   │   ├── home/       # Home page with feeds
│   │   ├── today/      # Today's entries
│   │   └── feed/[id]/  # Individual feed view
│   ├── api/            # API endpoints (mark-read, mark-all-read)
│   └── login/          # Login page
└── app.css             # Global styles with Tailwind + custom CSS variables
```

### Key Architecture Patterns

- **File-based routing**: Standard SvelteKit routing with layout hierarchies
- **Component composition**: Modular UI components with Shadcn/ui system
- **Server-side rendering**: Full SSR support with Cloudflare adapter
- **API integration**: Centralized Miniflux API client with TypeScript types
- **State management**: Svelte 5 runes for local state, classes for complex state machines

## Code Style Guidelines

### Svelte 5 Runes

Use Svelte 5 runes syntax exclusively:
- `$state`: Declare reactive state
- `$derived`: Compute derived values  
- `$effect`: Manage side effects and lifecycle
- `$props`: Declare component props
- `$bindable`: Create two-way bindable props

### Component Conventions

- File names: lowercase-with-hyphens.svelte
- Props: Use `$props()` with camelCase
- State management: Use classes for complex state machines
- Imports: Relative imports for local files, package imports for external

### Styling Conventions

- Use Tailwind CSS with `cn()` utility for class merging
- Shadcn/ui components imported from `$lib/components/ui`
- Color system: Use CSS variables with semantic naming
- Follow `background` and `foreground` convention for colors

### TypeScript

- Strict mode enabled
- Use interfaces over types
- Avoid enums; use const objects instead
- Enable strict mode in TypeScript for better type safety

## Configuration Files

- `svelte.config.js`: Cloudflare adapter, path aliases (`@/*`)
- `wrangler.jsonc`: Cloudflare Workers deployment, custom domain reafrac.com
- `components.json`: Shadcn/ui configuration with Tailwind CSS
- `tsconfig.json`: TypeScript strict mode, SvelteKit integration

## Important Dependencies

- **Svelte 5**: Latest runes syntax for reactive programming
- **Shadcn/ui**: Complete component library with Tailwind CSS
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS v4**: Latest version with utility-first styling
- **Lucide Svelte**: Icon library
- **Bits UI**: Additional UI components

## Development Notes

- Uses Bun 2.12+ as preferred package manager
- Requires Miniflux server for current version
- Cloudflare Workers deployment configured
- Comprehensive development documentation in AGENTS.md
- Follow established patterns from existing codebase

Refer to AGENTS.md for comprehensive development guidelines and Svelte 5 best practices.
