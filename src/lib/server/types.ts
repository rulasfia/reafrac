import { FeedData } from '@extractus/feed-extractor';
import type { Schema } from '../db-schema';

// Miniflux API client
export interface MinifluxConfig {
	url: string;
	token: string;
}

export interface MinifluxUser {
	id: number;
	username: string;
	email: string;
	is_admin: boolean;
	theme: string;
	language: string;
	timezone: string;
	entry_direction: string;
	entries_per_page: number;
	displayed_infos: string;
	nb_unread_entries: number;
	nb_starred_entries: number;
}

export interface FeedEntry {
	id: number;
	user_id: number;
	feed_id: number;
	title: string;
	url: string;
	enclosures: Record<string, any>[] | null;
	comments_url: string | null;
	published_at: string;
	author: string;
	share_code: string;
	content: string;
	reading_time: number;
	created_at: string;
	changed_at: string;
	status: string;
	starred: boolean;
	feed: Feed;
}

export type Feed = {
	id: number;
	user_id: number;
	feed_url: string;
	site_url: string;
	title: string;
	feed_error: string;
	parsing_error_count: number;
	scraper_rules: string;
	rewrite_rules: string;
	blocklist_rules: string;
	keeplist_rules: string;
	urlrewrite_rules: string;
	crawler: boolean;
	user_agent: string;
	cookie: string;
	username: string;
	password: string;
	ignore_http_cache: boolean;
	fetch_via_proxy: boolean;
	allow_self_signed_certificates: boolean;
	no_media_player: boolean;
	skip_http_cache: boolean;
	category: {
		id: number;
		title: string;
		user_id: number;
		hide_globally: boolean;
	};
	icon: {
		icon_id: number;
		feed_id: number;
		external_icon_id: string;
	} | null;
};

export type ReafracFeedType = Omit<FeedData, 'entries'> & {
	icon: string;
	entries: Array<NonNullable<FeedData['entries']>[0] & { author: string }>;
};

export type ReafracEntryType = Schema['Entry'];

export interface Icon {
	id: number;
	mime_type: string;
	data: string;
}

export interface EntryMeta {
	totalItems: number;
	currentPage: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}
