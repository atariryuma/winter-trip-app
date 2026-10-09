import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

const legacy = () => {
    const old = localStorage.getItem('darkMode');
    return old === 'true' ? 'dark' : 'system';
};

/** theme: 'system' | 'light' | 'dark' */
export function useTheme() {
    const [theme, setTheme] = useLocalStorage('theme', legacy());

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const apply = () => {
            const dark = theme === 'dark' || (theme === 'system' && media.matches);
            document.documentElement.classList.toggle('dark', dark);
            document.querySelector('meta[name="theme-color"]:not([media])')
                ?.setAttribute('content', dark ? '#020617' : '#f1f5f9');
        };
        apply();
        media.addEventListener('change', apply);
        return () => media.removeEventListener('change', apply);
    }, [theme]);

    return [theme, setTheme];
}
