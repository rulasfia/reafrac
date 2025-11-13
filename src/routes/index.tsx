import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRightIcon, ExternalLinkIcon, GithubIcon } from 'lucide-react';

export const Route = createFileRoute('/')({
	component: LandingPage
});

function LandingPage() {
	return (
		<div className="min-h-screen">
			{/* Header */}
			<header className="border-b border-border">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<Link to="/">
							<h1 className="font-sans text-2xl font-bold text-primary">Reafrac</h1>
						</Link>
						<nav className="space-x-6">
							<a href="#about" className="hover:underline">
								About
							</a>
							<a href="#features" className="hover:underline">
								Features
							</a>
							<a href="#download" className="hover:underline">
								Guide
							</a>
							<a
								href="https://github.com/rulasfia/reafrac"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-x-1.5 hover:underline"
							>
								GitHub
								<ExternalLinkIcon size={12} />
							</a>

							<a
								href="/login"
								className="inline-flex items-center gap-x-1.5 border-2 border-foreground bg-foreground px-4 py-1 text-background hover:opacity-90"
							>
								Login
								<ArrowRightIcon size={13} />
							</a>
						</nav>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main>
				{/* Hero Section */}
				<section className="py-16">
					<div className="container mx-auto px-4 text-center">
						<h1 className="mb-4 font-serif text-5xl text-primary">Reafrac</h1>
						<p className="mx-auto mb-8 max-w-2xl text-xl text-stone-700 dark:text-stone-200">
							A self-hostable RSS reader for the modern web
						</p>
						<div className="space-x-4">
							<a
								href="/login"
								className="inline-block border-2 border-foreground bg-foreground px-6 py-2 text-background hover:opacity-90"
							>
								Try It Now
							</a>
							<a
								href="/docs"
								className="inline-block border-2 border-foreground bg-transparent px-6 py-2 text-foreground hover:bg-foreground hover:text-background"
							>
								Documentation
							</a>
						</div>
					</div>
				</section>

				{/* About Section */}
				<section id="about" className="bg-stone-50 py-16 dark:bg-stone-900">
					<div className="container mx-auto px-4">
						<h2 className="mb-8 text-center font-serif text-3xl text-primary">About</h2>
						<div className="mx-auto max-w-3xl">
							<p className="mb-4 text-lg leading-relaxed">
								Reafrac is a web-based RSS reader that provides a clean interface for reading and
								managing RSS feeds with full content extraction.
							</p>
							<p className="mb-4 text-lg leading-relaxed">
								The application is self-hostable, open source, and focuses on privacy and
								simplicity. No tracking, no ads, no analytics - just RSS reading functionality.
							</p>
							<p className="text-lg leading-relaxed">
								Built with React, PostgreSQL, and modern web technologies. Deployable via Docker for
								easy setup and maintenance.
							</p>
						</div>
					</div>
				</section>

				{/* Features Section */}
				<section id="features" className="py-16">
					<div className="container mx-auto px-4">
						<h2 className="mb-8 text-center font-serif text-3xl text-primary">Features</h2>
						<div className="mx-auto max-w-3xl">
							<ul className="list list-inside list-disc space-y-3 text-lg">
								<li>Full article content extraction</li>
								<li>Feed categorization</li>
								<li>Read/unread status tracking</li>
								<li>Bookmarking support</li>
								<li>Dark and light theme support</li>
								<li>Mobile responsive design</li>
								<li>Miniflux server integration</li>
								<li>Self-hostable</li>
								<li>Open source</li>
							</ul>
						</div>
					</div>
				</section>

				{/* Download/Install Section */}
				<section id="download" className="bg-stone-50 py-16 dark:bg-stone-900">
					<div className="container mx-auto px-4 text-center">
						<h2 className="mb-8 font-serif text-3xl text-primary">Installation</h2>
						<div className="mx-auto max-w-3xl">
							<p className="mb-8 text-lg">
								Reafrac can be deployed using Docker. The application requires a PostgreSQL database
								and supports various RSS feed sources including Miniflux servers.
							</p>
							<div className="flex items-center justify-center gap-x-4">
								<a
									href="https://github.com/rulasfia/reafrac#installation"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center border-2 border-foreground bg-transparent px-6 py-2 text-foreground hover:bg-foreground hover:text-background"
								>
									Installation Guide
								</a>
								<a
									href="https://github.com/rulasfia/reafrac"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center border-2 border-foreground bg-transparent px-6 py-2 text-foreground hover:bg-foreground hover:text-background"
								>
									<GithubIcon className="mr-2 h-4 w-4" />
									View Source
								</a>
							</div>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="py-8">
				<div className="container mx-auto px-4 text-center">
					<p className="mb-2 text-sm text-stone-600 dark:text-stone-500">
						© 2024 Reafrac - Open source RSS reader
					</p>
					<p className="text-sm text-stone-600 dark:text-stone-500">
						<a
							href="https://github.com/rulasfia/reafrac"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:underline"
						>
							GitHub
						</a>
					</p>
				</div>
			</footer>
		</div>
	);
}
