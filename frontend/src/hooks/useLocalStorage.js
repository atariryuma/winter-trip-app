import { useCallback, useEffect, useState } from 'react';

const read = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch {
        return fallback;
    }
};

/** useState persisted to localStorage (JSON) and synced across tabs and hook instances. */
export function useLocalStorage(key, fallback) {
    const [value, setValue] = useState(() => read(key, fallback));

    useEffect(() => {
        const sync = (e) => {
            if (!e.key || e.key === key) setValue(read(key, fallback));
        };
        window.addEventListener('storage', sync);
        window.addEventListener('local-storage', sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener('local-storage', sync);
        };
        // fallback is a default for first read only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const update = useCallback((next) => {
        setValue((prev) => {
            const resolved = typeof next === 'function' ? next(prev) : next;
            try {
                localStorage.setItem(key, JSON.stringify(resolved));
            } catch {
                /* ignore quota errors */
            }
            queueMicrotask(() => window.dispatchEvent(new StorageEvent('local-storage', { key })));
            return resolved;
        });
    }, [key]);

    return [value, update];
}
