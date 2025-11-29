import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/version')({
	component: Version
});

function Version() {
	const version = import.meta.env.VITE_APP_VERSION || 'dev';
	const buildDate = import.meta.env.VITE_BUILD_DATE || new Date().toISOString();

	return (
		<div className="p-4 font-mono text-sm">
			<h1 className="mb-4 text-lg font-bold">Version Information</h1>
			<div className="space-y-2">
				<div>
					<strong>Version:</strong> {version}
				</div>
				<div>
					<strong>Build Date:</strong> {buildDate}
				</div>
				<div>
					<strong>Environment:</strong> {import.meta.env.MODE}
				</div>
			</div>
		</div>
	);
}
