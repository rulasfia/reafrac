import { useLocation, useNavigate, useLoaderData } from '@tanstack/react-router';
import { FeedSetting } from './feeds-setting';
import { MinifluxIntegrationSetting } from './miniflux-integration';
import { AccountSetting } from './acccount-setting';
import { AdminSetting } from './admin-setting';
import { useEffect } from 'react';

export function Settings() {
	const { search } = useLocation();
	const navigate = useNavigate();
	const { user } = useLoaderData({ from: '/reader' });

	useEffect(() => {
		if (search.category === 'admin' && !user.isAdmin) {
			navigate({ to: '/reader', search: { ...search, category: 'feeds' }, replace: true });
		}
	}, [search.category, user.isAdmin, navigate, search]);

	if (search.category === 'feeds') {
		return <FeedSetting />;
	} else if (search.category === 'integrations') {
		return <MinifluxIntegrationSetting />;
	} else if (search.category === 'account') {
		return <AccountSetting />;
	} else if (search.category === 'admin' && user.isAdmin) {
		return <AdminSetting />;
	} else {
		return null;
	}
}
