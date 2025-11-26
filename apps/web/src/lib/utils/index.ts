import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

dayjs.extend(utc);
dayjs.extend(relativeTime);

export function formatRelativeDate(date: Date | string) {
	// Ensure the date is treated as UTC and then converted to user's local timezone
	// This handles both Date objects and ISO string inputs from PostgreSQL
	const utcDate = dayjs.utc(date);
	return utcDate.fromNow();
}
