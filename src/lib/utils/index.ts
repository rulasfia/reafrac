import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function formatRelativeDate(dateString: string) {
	dayjs.extend(relativeTime);
	return dayjs(dateString).fromNow();
}

export const extractTextFromHtml = (html: string, limit?: number) => {
	if (!html) return '';

	const fn = (v: string) =>
		v
			.replace(/<[^>]*>/g, '') // Remove all HTML tags
			.replace(/&nbsp;/g, ' ') // Replace space entities
			.replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec)) // Handle numeric HTML entities
			.replace(/&([a-z]+);/g, (_match, entity) => {
				// Handle named HTML entities
				const entities = {
					amp: '&',
					lt: '<',
					gt: '>',
					quot: '"',
					apos: "'"
				};

				// @ts-expect-error something about any
				return entities[entity] || '';
			})
			.trim();

	return limit ? fn(html).slice(0, limit) : fn(html);
};
