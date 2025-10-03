type SessionData = {
	userId?: string;
	email?: string;
	role?: string;
};

export function useAppSession() {
	return useSession<SessionData>({
		// Session configuration
		name: 'app-session',
		password: process.env.SESSION_SECRET!, // At least 32 characters
		// Optional: customize cookie settings
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			httpOnly: true
		}
	});
}
