# Agent Development Guide

## Build/Lint/Test Commands

- Dev server: `npm run dev`
- Build: `npm run build`
- Check types: `npm run check`
- Format code: `npm run format`
- Lint: `npm run lint`
- Run single test: Use `npm test -- -t "test name"`

## Code Style Guidelines

- Use TypeScript with strict mode enabled
- Follow Svelte 5 runes syntax (`$state`, `$derived`, `$effect`)
- Use Tailwind CSS for styling with `cn()` utility for class merging
- Component files: lowercase-with-hyphens.svelte
- Props: Use `$props()` with camelCase
- State management: Use classes for complex state machines
- Imports: Relative imports for local files, package imports for external
- Naming: camelCase for variables/functions, PascalCase for components
- Error handling: Try/catch for async operations, proper error boundaries

## SvelteKit Structure

- Routes: `src/routes/`
- Components: `src/lib/components/`
- Utilities: `src/lib/utils.ts`
- Styles: `app.css` for global styles

## Cursor Rules

Follow the SvelteKit rules in `.cursor/rules/sveltekit.mdc` for detailed conventions.
