import { Flower2, Leaf, Snowflake, Sun } from 'lucide-react';

// Each season maps to an accent palette in index.css ([data-season=...]).
export const SEASONS = {
    spring: { label: '春', icon: Flower2 },
    summer: { label: '夏', icon: Sun },
    autumn: { label: '秋', icon: Leaf },
    winter: { label: '冬', icon: Snowflake },
};

export const THEME_OPTIONS = ['auto', 'spring', 'summer', 'autumn', 'winter'];

export const seasonOf = (date) => {
    const m = date.getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
};

/** theme is 'auto' or a season; auto follows the trip's start month. */
export const resolveSeason = (theme, start, today = new Date()) =>
    (SEASONS[theme] ? theme : seasonOf(start || today));
