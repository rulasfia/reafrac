import { IconMoon, IconSun } from '@intentui/icons';
import { Button } from './primitive/button';
import { useTheme } from './theme-provider';

interface Props {
	appearance?: 'plain' | 'outline';
}

export function ThemeSwitcher({ appearance = 'plain' }: Props) {
	const { theme, setTheme } = useTheme();
	return (
		<Button
			intent={appearance}
			size="sq-sm"
			aria-label="Switch theme"
			onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
		>
			<IconSun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
			<IconMoon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
		</Button>
	);
}
