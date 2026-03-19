import { useQuery } from '@tanstack/react-query';
import { adminStatsQueryOptions } from '@/lib/queries/admin-query';
import { Skeleton } from '../ui/skeleton';

function StatCard({
	label,
	value,
	description
}: {
	label: string;
	value: number;
	description?: string;
}) {
	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<div className="text-sm font-medium text-muted-foreground">{label}</div>
			<div className="mt-1 text-2xl font-bold">{value.toLocaleString()}</div>
			{description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
		</div>
	);
}

function StatSkeleton() {
	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<Skeleton className="h-4 w-24" />
			<Skeleton className="mt-2 h-8 w-16" />
		</div>
	);
}

export function AdminSetting() {
	const { data: stats, isLoading, error } = useQuery(adminStatsQueryOptions());

	return (
		<div>
			<h3 className="text-lg font-medium">Admin Settings</h3>
			<p className="mb-6 text-sm text-foreground/70">
				Overview of application usage and statistics.
			</p>

			{error && (
				<div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-500">
					Failed to load statistics. Please try again later.
				</div>
			)}

			<div className="mb-6">
				<h4 className="mb-3 text-sm font-semibold text-foreground/80">User Statistics</h4>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					{isLoading ? (
						<>
							<StatSkeleton />
							<StatSkeleton />
						</>
					) : (
						<>
							<StatCard
								label="Total Users"
								value={stats?.totalUsers ?? 0}
								description="All registered users"
							/>
							<StatCard
								label="New Users (7d)"
								value={stats?.recentUsers ?? 0}
								description="Users joined in last 7 days"
							/>
						</>
					)}
				</div>
			</div>

			<div className="mb-6">
				<h4 className="mb-3 text-sm font-semibold text-foreground/80">Feed Statistics</h4>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					{isLoading ? (
						<>
							<StatSkeleton />
							<StatSkeleton />
							<StatSkeleton />
						</>
					) : (
						<>
							<StatCard
								label="Total Feeds"
								value={stats?.totalFeeds ?? 0}
								description="All feeds in database"
							/>
							<StatCard
								label="Active Feeds"
								value={stats?.activeFeeds ?? 0}
								description="Fetched in last 7 days"
							/>
							<StatCard
								label="Subscriptions"
								value={stats?.totalSubscriptions ?? 0}
								description="Total feed subscriptions"
							/>
						</>
					)}
				</div>
			</div>

			<div>
				<h4 className="mb-3 text-sm font-semibold text-foreground/80">Content Statistics</h4>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					{isLoading ? (
						<>
							<StatSkeleton />
							<StatSkeleton />
						</>
					) : (
						<>
							<StatCard
								label="Total Entries"
								value={stats?.totalEntries ?? 0}
								description="All feed entries"
							/>
							<StatCard
								label="New Entries (7d)"
								value={stats?.recentEntries ?? 0}
								description="Entries added in last 7 days"
							/>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
