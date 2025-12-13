import { useState, useEffect, useCallback } from 'react';

const DARK_MODE_KEY = 'darkMode';

/**
 * Custom hook for dark mode management
 */
export function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem(DARK_MODE_KEY) === 'true';
    });

    // Sync with localStorage and DOM
    useEffect(() => {
        localStorage.setItem(DARK_MODE_KEY, isDarkMode);

        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    return {
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
    };
}

export default useDarkMode;
