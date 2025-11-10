import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MenuIcon, PanelLeftOpenIcon } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function FloatingMenuButton() {
	const { toggleSidebar, isMobile } = useSidebar();

	if (!isMobile) return null;

	return (
		<Button
			size="icon"
			variant="default"
			className={cn(
				`fixed right-4 bottom-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full shadow-md shadow-primary/50 transition-all duration-300 ease-in-out lg:hidden`,
				'translate-y-0 scale-100 opacity-100'
			)}
			onClick={toggleSidebar}
		>
			<PanelLeftOpenIcon className="size-6 transition-transform duration-200 hover:scale-110" />
			<span className="sr-only">Open Menu</span>
		</Button>
	);
}
