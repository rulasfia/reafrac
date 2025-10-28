import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

dayjs.extend(relativeTime);
export function formatRelativeDate(date: Date) {
	return dayjs(date).fromNow();
}
