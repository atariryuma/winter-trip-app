import { useEffect, useState } from 'react';

/** Current time, re-rendering at the start of every minute. */
export function useNow() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        let timer;
        const schedule = () => {
            timer = setTimeout(() => {
                setNow(new Date());
                schedule();
            }, 60000 - (Date.now() % 60000) + 50);
        };
        schedule();
        return () => clearTimeout(timer);
    }, []);
    return now;
}
