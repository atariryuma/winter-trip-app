import { useEffect, useState } from 'react';
import api from '../lib/api';
import { parseDurationText, samePlace } from '../lib/trip';

/** Driving/transit time between two places via the GAS route API (cached on device). */
export function useTravelTime(from, to) {
    const key = from && to && !samePlace(from, to) ? `${from}|${to}` : null;
    const [result, setResult] = useState({ key: null, minutes: null });

    useEffect(() => {
        if (!key) return undefined;
        let cancelled = false;
        api.getRoute(from, to).then((route) => {
            if (cancelled) return;
            const minutes = parseDurationText(route?.duration);
            setResult({ key, minutes: minutes > 0 ? minutes : null });
        });
        return () => {
            cancelled = true;
        };
    }, [key, from, to]);

    if (!key) return { minutes: null, loading: false };
    return { minutes: result.key === key ? result.minutes : null, loading: result.key !== key };
}
