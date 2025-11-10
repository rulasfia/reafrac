import { PanelLeftIcon, XIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { useSidebar } from '../ui/sidebar';
import { useNavigate } from '@tanstack/react-router';

export function EntryHeader() {
	const { toggleSidebar, isMobile } = useSidebar();
	const navigate = useNavigate({ from: '/reader/' });

	const onCloseReader = () => {
		if (isMobile) toggleSidebar();
		navigate({ search: (prev) => ({ ...prev, entry: undefined }) });
	};

	return (
		<>
			<Button
				size="icon-sm"
				variant="outline"
				className="absolute top-2 left-2 flex cursor-pointer rounded-sm lg:top-1.5 lg:left-1.5 lg:hidden"
				onClick={toggleSidebar}
			>
				<PanelLeftIcon />
				<span className="sr-only">Toggle Sidebar</span>
			</Button>

			<Button
				size="icon-sm"
				variant="outline"
				className="absolute top-2 right-2 cursor-pointer rounded-sm"
				onClick={onCloseReader}
			>
				<XIcon />
				<span className="sr-only">Close Entry</span>
			</Button>
		</>
	);
}
