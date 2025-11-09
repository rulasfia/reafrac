import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MenuIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function FloatingMenuButton() {
	const { toggleSidebar, isMobile } = useSidebar();
	const [showFloatingButton, setShowFloatingButton] = useState(false);

	// Handle scroll-based floating button visibility
	useEffect(() => {
		if (!isMobile) return;

		const handleScroll = () => {
			// Show floating button when scrolled past 60px (when top buttons are out of view)
			setShowFloatingButton(window.scrollY > 60);
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // Check initial scroll position

		return () => window.removeEventListener('scroll', handleScroll);
	}, [isMobile]);

	if (!isMobile) {
		return null;
	}

	return (
		<Button
			size="icon"
			variant="default"
			className={cn(
				`fixed right-4 bottom-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full shadow-md shadow-primary/50 transition-all duration-300 ease-in-out lg:hidden`,
				showFloatingButton
					? 'translate-y-0 scale-100 opacity-100'
					: 'pointer-events-none translate-y-4 scale-90 opacity-0'
			)}
			onClick={toggleSidebar}
		>
			<MenuIcon className="h-5 w-5 transition-transform duration-200 hover:scale-110" />
			<span className="sr-only">Open Menu</span>
		</Button>
	);
}
