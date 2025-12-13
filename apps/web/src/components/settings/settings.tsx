import { useLocation } from '@tanstack/react-router';
import { FeedSetting } from './feeds-setting';
import { MinifluxIntegrationSetting } from './miniflux-integration';
import { AccountSetting } from './acccount-setting';

export function Settings() {
	const { search } = useLocation();

	if (search.category === 'feeds') {
		return <FeedSetting />;
	} else if (search.category === 'integrations') {
		return <MinifluxIntegrationSetting />;
	} else if (search.category === 'account') {
		return <AccountSetting />;
	} else {
		return null;
	}
}
