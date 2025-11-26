import { createFileRoute, Link } from '@tanstack/react-router';
import {
	ArrowRight,
	ExternalLink,
	FileText,
	Folder,
	CheckCircle,
	Bookmark,
	Moon,
	Smartphone,
	Database,
	Server,
	Code,
	Rss
} from 'lucide-react';

export const Route = createFileRoute('/')({
	component: LandingPage
});

function LandingPage() {
	return (
		<div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
			{/* Header */}
			<header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					<Link to="/" className="group flex items-center gap-2">
						<div className="transition-transform group-hover:rotate-3">
							<img src="/reafrac-logo.png" width={28} height={28} />
						</div>
						<h1 className="font-serif text-xl font-bold tracking-tight">Reafrac</h1>
					</Link>
					<nav className="hidden items-center gap-8 text-sm font-medium md:flex">
						<a href="#features" className="transition-colors hover:text-primary">
							Features
						</a>
						<a href="#about" className="transition-colors hover:text-primary">
							About
						</a>
						<a href="#download" className="transition-colors hover:text-primary">
							Install
						</a>
						<a
							href="https://github.com/rulasfia/reafrac"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1 transition-colors hover:text-primary"
						>
							GitHub
							<ExternalLink size={12} />
						</a>
					</nav>
					<div className="flex items-center gap-4">
						<a
							href="/login"
							className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
						>
							Login
							<ArrowRight size={14} />
						</a>
					</div>
				</div>
			</header>

			<main>
				{/* Hero Section */}
				<section className="relative overflow-hidden py-20 md:py-32">
					<div className="relative z-10 container mx-auto px-4 text-center">
						{/* version label*/}
						{/*<div className="mb-8 inline-flex animate-in items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground duration-500 fade-in slide-in-from-bottom-4">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
								<span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
							</span>
							v1.0 is now available
						</div>*/}
						<h1 className="mx-auto mb-6 max-w-4xl font-serif text-5xl leading-[1.1] font-bold tracking-tight text-foreground md:text-7xl">
							Read the web, <br />
							<span className="text-primary">distraction free.</span>
						</h1>
						<p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
							An open-source, self-hostable RSS reader designed for the modern web. No algorithms,
							no tracking, just your content.
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<a
								href="/login"
								className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 sm:w-auto"
							>
								Get Started
								<ArrowRight size={16} />
							</a>
							<a
								href="https://github.com/rulasfia/reafrac"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-8 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto"
							>
								<GithubIcon size={16} />
								Star on GitHub
							</a>
						</div>
					</div>

					{/* Abstract Background Decoration */}
					<div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
				</section>

				{/* App Preview Placeholder */}
				<section className="px-4 pb-20">
					<div className="container mx-auto max-w-5xl">
						<div className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
							<div className="absolute inset-0 flex items-center justify-center bg-muted/20">
								<div className="p-8 text-center">
									<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110">
										<Rss size={32} />
									</div>
									<p className="font-medium text-muted-foreground">Interface Preview</p>
								</div>
							</div>
							{/* Decorative UI elements to simulate an app interface */}
							<div className="absolute top-0 right-0 left-0 flex h-12 items-center gap-2 border-b border-border bg-muted/30 px-4">
								<div className="h-3 w-3 rounded-full bg-destructive/50"></div>
								<div className="h-3 w-3 rounded-full bg-warning/50"></div>
								<div className="h-3 w-3 rounded-full bg-success/50"></div>
							</div>
							<div className="absolute top-12 bottom-0 left-0 hidden w-64 space-y-3 border-r border-border bg-card p-4 md:block">
								<div className="h-8 w-full animate-pulse rounded-md bg-muted/50"></div>
								<div className="h-4 w-3/4 animate-pulse rounded-md bg-muted/30"></div>
								<div className="h-4 w-1/2 animate-pulse rounded-md bg-muted/30"></div>
								<div className="h-4 w-5/6 animate-pulse rounded-md bg-muted/30"></div>
							</div>
							<div className="absolute top-12 right-0 bottom-0 left-0 space-y-6 p-6 md:left-64">
								<div className="h-8 w-1/2 animate-pulse rounded-md bg-muted/50"></div>
								<div className="space-y-2">
									<div className="h-4 w-full animate-pulse rounded-md bg-muted/30"></div>
									<div className="h-4 w-full animate-pulse rounded-md bg-muted/30"></div>
									<div className="h-4 w-2/3 animate-pulse rounded-md bg-muted/30"></div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Features Grid */}
				<section id="features" className="bg-muted/30 py-24">
					<div className="container mx-auto px-4">
						<div className="mb-16 text-center">
							<h2 className="mb-4 font-serif text-3xl font-bold md:text-4xl">
								Everything you need
							</h2>
							<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
								Powerful features packed into a clean, minimalist interface.
							</p>
						</div>

						<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
							<FeatureCard
								icon={<Code />}
								title="Open Source"
								description="Transparent development. Contribute, audit, or modify the code as you see fit."
							/>
							<FeatureCard
								icon={<CheckCircle />}
								title="Read Tracking"
								description="Keep track of what you've read. Syncs across devices automatically."
							/>
							<FeatureCard
								icon={<Bookmark />}
								title="Bookmarks"
								description="Save interesting articles for later with a single click."
							/>
							<FeatureCard
								icon={<Moon />}
								title="Dark Mode"
								description="Easy on the eyes with built-in dark and light themes."
							/>
							<FeatureCard
								icon={<Smartphone />}
								title="Responsive"
								description="Works perfectly on desktop, tablet, and mobile devices."
							/>
							<FeatureCard
								icon={<Server />}
								title="Self-Hostable"
								description="You own your data. Deploy easily with Docker on your own infrastructure."
							/>
							<FeatureCard
								icon={<Database />}
								title="Miniflux Integration"
								description="Seamlessly connects with Miniflux servers for backend management."
							/>
							<FeatureCard
								icon={<Folder />}
								title="Smart Organization"
								description="Organize your feeds into categories to keep your reading list manageable."
								badge="Coming Soon"
							/>
							<FeatureCard
								icon={<FileText />}
								title="Full Content"
								description="Automatically extracts full article content so you never have to leave the app."
								badge="Coming Soon"
							/>
						</div>
					</div>
				</section>

				{/* About Section */}
				<section id="about" className="py-24">
					<div className="container mx-auto px-4">
						<div className="mx-auto flex max-w-5xl flex-col items-center gap-12 md:flex-row">
							<div className="flex-1 space-y-6">
								<h2 className="font-serif text-3xl font-bold md:text-4xl">Why Reafrac?</h2>
								<p className="text-lg leading-relaxed text-muted-foreground">
									In an age of algorithmic feeds and ad-heavy content, Reafrac brings you back to
									the roots of the web. It's a tool designed for reading, not for engagement
									metrics.
								</p>
								<p className="text-lg leading-relaxed text-muted-foreground">
									We believe in software that respects your attention. No notifications, no "for
									you" pages, just the content you subscribed to, presented in a clean, readable
									format.
								</p>
								<div className="pt-4">
									<a
										href="https://github.com/rulasfia/reafrac"
										className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
									>
										Read more about our philosophy <ArrowRight size={14} />
									</a>
								</div>
							</div>
							<div className="flex-1 rounded-2xl border border-border bg-muted/50 p-8">
								<h3 className="mb-4 text-xl font-bold">Tech Stack</h3>
								<ul className="space-y-3">
									<li className="flex items-center gap-3">
										<div className="h-2 w-2 rounded-full bg-primary"></div>
										<span>React & TanStack Router</span>
									</li>
									<li className="flex items-center gap-3">
										<div className="h-2 w-2 rounded-full bg-primary"></div>
										<span>PostgreSQL Database</span>
									</li>
									<li className="flex items-center gap-3">
										<div className="h-2 w-2 rounded-full bg-primary"></div>
										<span>Tailwind CSS v4</span>
									</li>
									<li className="flex items-center gap-3">
										<div className="h-2 w-2 rounded-full bg-primary"></div>
										<span>Simple Docker Deployment</span>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</section>

				{/* CTA Section */}
				<section id="download" className="bg-primary py-24 text-primary-foreground">
					<div className="container mx-auto px-4 text-center">
						<h2 className="mb-6 font-serif text-3xl font-bold md:text-4xl">
							Ready to take back your feed?
						</h2>
						<p className="mx-auto mb-10 max-w-2xl text-lg text-primary-foreground/80">
							Get started with Reafrac today. Open source, free, and yours to control.
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<a
								href="https://github.com/rulasfia/reafrac#installation"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-background px-8 py-3 text-base font-medium text-foreground transition-colors hover:bg-background/90 sm:w-auto"
							>
								Installation Guide
							</a>
							<a
								href="https://github.com/rulasfia/reafrac"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex w-full items-center justify-center gap-2 rounded-md border-2 border-primary-foreground bg-transparent px-8 py-3 text-base font-medium transition-colors hover:bg-primary-foreground hover:text-primary sm:w-auto"
							>
								<GithubIcon size={16} />
								View Source
							</a>
						</div>
					</div>
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t border-border bg-muted/30 py-12">
				<div className="container mx-auto px-4">
					<div className="flex flex-col items-center justify-between gap-6 md:flex-row">
						<div className="flex items-center gap-2">
							<img src="/reafrac-logo.png" width={28} height={28} />
							<span className="font-serif text-lg font-bold">Reafrac</span>
						</div>
						<div className="text-sm text-muted-foreground">
							© {new Date().getFullYear()} Reafrac. Open source software.
						</div>
						<div className="flex items-center gap-6">
							<a
								href="https://github.com/rulasfia/reafrac"
								target="_blank"
								rel="noopener noreferrer"
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								<GithubIcon size={20} />
								<span className="sr-only">GitHub</span>
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}

function FeatureCard({
	icon,
	title,
	description,
	badge
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	badge?: string;
}) {
	return (
		<div className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:shadow-sm">
			{badge && (
				<span className="absolute top-4 right-4 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
					{badge}
				</span>
			)}
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
				{icon}
			</div>
			<h3 className="mb-2 text-xl font-bold">{title}</h3>
			<p className="leading-relaxed text-muted-foreground">{description}</p>
		</div>
	);
}

function GithubIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
		>
			<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
			<path d="M9 18c-4.51 2-5-2-7-2" />
		</svg>
	);
}
