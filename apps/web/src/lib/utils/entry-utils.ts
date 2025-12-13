import sanitizeHtml from 'sanitize-html';

export function htmlSanitizer(html: string): string {
	return sanitizeHtml(html.replace(/:{3,}/g, '').replace(/\\(?!\w)/g, '') ?? '', {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'video']),
		allowProtocolRelative: false,
		allowedAttributes: {
			...sanitizeHtml.defaults.allowedAttributes,
			iframe: ['src', 'allow', 'frameborder']
		},
		allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']
	});
}
