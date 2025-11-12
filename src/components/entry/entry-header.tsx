import { XIcon } from 'lucide-react';
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
				className="absolute top-2 right-2 hidden cursor-pointer rounded-sm lg:inline-flex"
				onClick={onCloseReader}
			>
				<XIcon />
				<span className="sr-only">Close Entry</span>
			</Button>
		</>
	);
}
