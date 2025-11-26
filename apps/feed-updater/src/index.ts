import { refetchFeeds } from '@reafrac/external-script';

// Run the function
(function main() {
	refetchFeeds()
		.then(() => {
			console.log('Script completed successfully');
			process.exit(0);
		})
		.catch((error) => {
			console.error('Script failed:', error);
			process.exit(1);
		});
})();
