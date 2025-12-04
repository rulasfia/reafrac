import { BookmarkIcon, InboxIcon, ListIcon } from 'lucide-react';

export const MENU_ITEMS = [
	{ label: 'All Posts', icon: <ListIcon />, href: '/reader', page: 'all-posts' },
	{ label: 'Unread', icon: <InboxIcon />, href: '/reader', page: 'unread' },
	{ label: 'Saved', icon: <BookmarkIcon />, href: '/reader', page: 'saved' }
] as const;
