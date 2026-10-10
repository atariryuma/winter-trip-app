import { useEffect } from 'react';

/** Apply a season's accent palette to the page (see index.css) and remember it for the next load. */
export function useSeason(season) {
    useEffect(() => {
        document.documentElement.dataset.season = season;
        try {
            localStorage.setItem('season', season);
        } catch {
            /* ignore */
        }
    }, [season]);
}
