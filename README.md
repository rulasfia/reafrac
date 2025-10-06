Welcome to your new TanStack app!

# Getting Started

To run this application:

```bash
bun install
bun --bun run start
```

# Building For Production

To build this application for production:

```bash
bun --bun run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
bun --bun run test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router';
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { Link } from '@tanstack/react-router';

export const Route = createRootRoute({
	component: () => (
		<>
			<header>
				<nav>
					<Link to="/">Home</Link>
					<Link to="/about">About</Link>
				</nav>
			</header>
			<Outlet />
			<TanStackRouterDevtools />
		</>
	)
});
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/people',
	loader: async () => {
		const response = await fetch('https://swapi.dev/api/people');
		return response.json() as Promise<{
			results: {
				name: string;
			}[];
		}>;
	},
	component: () => {
		const data = peopleRoute.useLoaderData();
		return (
			<ul>
				{data.results.map((person) => (
					<li key={person.name}>{person.name}</li>
				))}
			</ul>
		);
	}
});
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
bun install @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ...

const queryClient = new QueryClient();

// ...

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);

	root.render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	);
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const rootRoute = createRootRoute({
	component: () => (
		<>
			<Outlet />
			<ReactQueryDevtools buttonPosition="top-right" />
			<TanStackRouterDevtools />
		</>
	)
});
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from '@tanstack/react-query';

import './App.css';

function App() {
	const { data } = useQuery({
		queryKey: ['people'],
		queryFn: () =>
			fetch('https://swapi.dev/api/people')
				.then((res) => res.json())
				.then((data) => data.results as { name: string }[]),
		initialData: []
	});

	return (
		<div>
			<ul>
				{data.map((person) => (
					<li key={person.name}>{person.name}</li>
				))}
			</ul>
		</div>
	);
}

export default App;
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
bun install @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from '@tanstack/react-store';
import { Store } from '@tanstack/store';
import './App.css';

const countStore = new Store(0);

function App() {
	const count = useStore(countStore);
	return (
		<div>
			<button onClick={() => countStore.setState((n) => n + 1)}>Increment - {count}</button>
		</div>
	);
}

export default App;
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from '@tanstack/react-store';
import { Store, Derived } from '@tanstack/store';
import './App.css';

const countStore = new Store(0);

const doubledStore = new Derived({
	fn: () => countStore.state * 2,
	deps: [countStore]
});
doubledStore.mount();

function App() {
	const count = useStore(countStore);
	const doubledCount = useStore(doubledStore);

	return (
		<div>
			<button onClick={() => countStore.setState((n) => n + 1)}>Increment - {count}</button>
			<div>Doubled - {doubledCount}</div>
		</div>
	);
}

export default App;
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

## Database

This project uses [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/) for database management.

### Local Development

```bash
# Generate migrations
bun run db:generate

# Apply migrations to database
bun run db:migrate

# Push schema changes (development only)
bun run db:push

# Browse database with Drizzle Studio
bun run db:browse
```

### Docker Deployment

The Docker setup includes automated migration management:

#### Migration Strategy

The setup uses two approaches for database migrations:

1. **Initial Setup**: PostgreSQL's `/docker-entrypoint-initdb.d` runs SQL files on first database creation
2. **Schema Updates**: Dedicated `migrate` service runs Drizzle migrations for schema updates

#### How to Use Migrations

**1. Initial Deployment:**

```bash
# Start database and run migrations
docker-compose up postgres migrate -d

# Then start the app
docker-compose up app -d
```

**2. For Schema Updates:**

```bash
# Run migrations manually
docker-compose run --rm migrate

# Or restart the migrate service
docker-compose up migrate
```

**3. One-Command Deployment:**

```bash
# Start everything (migrations run first, then app)
docker-compose up -d
```

#### Migration Workflow

1. **Development**: Create migrations with `bun run db:generate`
2. **Commit**: Migration files are committed to repo
3. **Deploy**: New image includes migration files
4. **Run**: `docker-compose run --rm migrate` applies new migrations
5. **Verify**: Check database schema is updated

#### Environment Setup

Copy the environment template:

```bash
cp .env.docker .env
```

Edit `.env` with your values:

- `GITHUB_USERNAME`: Your GitHub username for GHCR
- `POSTGRES_PASSWORD`: Secure database password
- `POSTGRES_DB`: Database name (default: reafrac)

## Docker Deployment

This project includes Docker support for production deployments.

### Build and Run Locally

```bash
# Build the image
docker build -t reafrac .

# Run with Docker Compose
docker-compose up -d
```

### Production Deployment

The application is configured to deploy via GitHub Actions and Portainer:

1. **GitHub Actions** automatically builds and pushes to GitHub Container Registry on main branch commits
2. **Portainer** pulls the image `ghcr.io/YOUR_USERNAME/reafrac:latest`
3. **Docker Compose** manages the application stack with PostgreSQL

### Services

- **app**: Main application (port 3000)
- **postgres**: PostgreSQL 17 database (port 5432)
- **migrate**: Migration service (runs once)
- **pgadmin**: Optional database admin (port 5050, use `--profile admin`)

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).
