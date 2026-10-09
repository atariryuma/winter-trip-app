import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../lib/api';
import { buildTrip, compareByTime, eventTitle, rowHint, typeForCategory } from '../lib/trip';
import { useToast } from '../ui/contexts';
import { TripContext } from './context';

const CACHE_KEY = 'trip_cache_v2';
const UNDO_WINDOW_MS = 5000;

const readCache = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(CACHE_KEY));
        return Array.isArray(parsed?.days) ? parsed : null;
    } catch {
        return null;
    }
};

const writeCache = (days, syncedAt) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ days, syncedAt }));
    } catch {
        /* storage full: the app still works online */
    }
};

let tmpCounter = 0;
const tmpId = () => `tmp-${Date.now()}-${++tmpCounter}`;

// --- Pure helpers on the raw server shape: [{ id, date, events: [] }] -------

const withoutEvent = (days, eventId) =>
    days
        .map((d) => ({ ...d, events: d.events.filter((e) => e.id !== eventId) }))
        .filter((d) => d.events.length > 0);

const withEvent = (days, date, event) => {
    const exists = days.some((d) => d.date === date);
    const next = exists
        ? days.map((d) => (d.date === date ? { ...d, events: [...d.events, event].sort(compareByTime) } : d))
        : [...days, { id: `day-${date.replace('/', '-')}`, date, events: [event] }];
    return next;
};

const replaceEvent = (days, eventId, patch) =>
    days.map((d) => ({ ...d, events: d.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)) }));

export default function TripProvider({ children }) {
    const { showToast } = useToast();
    const [cached] = useState(readCache);
    const [rawDays, setRawDays] = useState(cached?.days || []);
    const [status, setStatus] = useState(cached ? 'ready' : 'loading');
    const [syncError, setSyncError] = useState(null);
    const [syncedAt, setSyncedAt] = useState(cached?.syncedAt || null);
    const [pending, setPending] = useState(0);
    const [today, setToday] = useState(() => new Date());

    const queueRef = useRef(Promise.resolve());
    const pendingRef = useRef(0);
    const refreshTimer = useRef(null);
    const pendingDeletes = useRef(new Map());
    const writeGeneration = useRef(0);

    const days = useMemo(() => buildTrip(rawDays, today), [rawDays, today]);

    // Re-evaluate "today" when the app comes back to the foreground or a minute ticks over midnight.
    useEffect(() => {
        const tick = () => setToday((prev) => {
            const now = new Date();
            return now.toDateString() === prev.toDateString() ? prev : now;
        });
        const timer = setInterval(tick, 60 * 1000);
        document.addEventListener('visibilitychange', tick);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', tick);
        };
    }, []);

    const refresh = useCallback(() => {
        const generation = writeGeneration.current;
        return api.getData().then((data) => {
            const serverDays = Array.isArray(data) ? data : data?.days || [];
            // Local edits made meanwhile win; the queue schedules another refresh when it drains.
            if (pendingRef.current > 0 || generation !== writeGeneration.current) return;
            const now = Date.now();
            const hidden = pendingDeletes.current;
            setRawDays(hidden.size
                ? serverDays.map((d) => ({ ...d, events: d.events.filter((e) => !hidden.has(e.id)) }))
                    .filter((d) => d.events.length > 0)
                : serverDays);
            setSyncedAt(now);
            setSyncError(null);
            setStatus('ready');
            writeCache(serverDays, now);
        }, (err) => {
            setSyncError(err.message || '通信エラー');
            setStatus((prev) => (prev === 'loading' ? 'error' : prev));
        });
    }, []);

    useEffect(() => {
        refresh();
        api.maintainCache();
    }, [refresh]);

    // Serialise every write: GAS rows shift on delete, so concurrent writes could hit the wrong row.
    const enqueue = useCallback((task, errorMessage) => {
        pendingRef.current += 1;
        writeGeneration.current += 1;
        setPending(pendingRef.current);
        clearTimeout(refreshTimer.current);
        const run = queueRef.current
            .then(task)
            .then(() => true, (err) => {
                console.error(err);
                showToast('error', `${errorMessage}（${err.message}）`);
                return false;
            })
            .finally(() => {
                pendingRef.current -= 1;
                setPending(pendingRef.current);
                if (pendingRef.current === 0) {
                    // Pull fresh ids/rows from the sheet once everything is written.
                    refreshTimer.current = setTimeout(refresh, 800);
                }
            });
        queueRef.current = run;
        return run;
    }, [refresh, showToast]);

    const findEvent = useCallback((eventId) => {
        for (const day of rawDays) {
            const event = day.events.find((e) => e.id === eventId);
            if (event) return { event, date: day.date };
        }
        return null;
    }, [rawDays]);

    /**
     * Create or update an event.
     * @param original existing event (null when creating)
     * @param originalDate its current "M/D"
     * @param date target "M/D" (may differ to move the event)
     * @param fields editable fields of the event
     */
    const saveEvent = useCallback(({ original, originalDate, date, fields }) => {
        const data = { ...fields, type: typeForCategory(fields.category) };
        const id = original?.id || tmpId();
        setRawDays((prev) => withEvent(original ? withoutEvent(prev, original.id) : prev, date, { ...original, ...data, id }));

        if (!original) {
            return enqueue(() => api.addEvent({ ...data, date }), '予定を追加できませんでした');
        }

        const row = rowHint(original.id);
        return enqueue(async () => {
            await api.updateEvent({ date: originalDate, name: original.name, row, eventData: data });
            if (date !== originalDate) {
                await api.moveEvent({
                    originalDate, name: data.name, row, newDate: date, newStartTime: data.time, newEndTime: data.endTime,
                });
            }
            ['name', 'from', 'to'].forEach((key) => {
                if (original[key] && original[key] !== data[key]) api.invalidatePlace(original[key]);
            });
        }, '予定を保存できませんでした');
    }, [enqueue]);

    const commitDelete = useCallback((eventId, { keepalive = false } = {}) => {
        const entry = pendingDeletes.current.get(eventId);
        if (!entry) return;
        clearTimeout(entry.timer);
        pendingDeletes.current.delete(eventId);
        const { event, date } = entry;
        const request = { date, name: event.name, row: rowHint(event.id) };
        if (keepalive) {
            api.deleteEvent(request, { keepalive: true }).catch(() => {});
            return;
        }
        enqueue(() => api.deleteEvent(request), '予定を削除できませんでした');
    }, [enqueue]);

    // Deletes wait a few seconds so they can be undone; flush them if the page goes away.
    useEffect(() => {
        const flushAll = () => {
            [...pendingDeletes.current.keys()].forEach((id) => commitDelete(id, { keepalive: true }));
        };
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') flushAll();
        };
        window.addEventListener('pagehide', flushAll);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('pagehide', flushAll);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [commitDelete]);

    const deleteEvent = useCallback((eventId) => {
        const found = findEvent(eventId);
        if (!found) return;
        writeGeneration.current += 1;
        setRawDays((prev) => withoutEvent(prev, eventId));
        const timer = setTimeout(() => commitDelete(eventId), UNDO_WINDOW_MS);
        pendingDeletes.current.set(eventId, { ...found, timer });
        showToast('info', `「${eventTitle(found.event)}」を削除しました`, {
            duration: UNDO_WINDOW_MS,
            action: {
                label: '元に戻す',
                onClick: () => {
                    const entry = pendingDeletes.current.get(eventId);
                    if (!entry) return;
                    clearTimeout(entry.timer);
                    pendingDeletes.current.delete(eventId);
                    setRawDays((prev) => withEvent(prev, entry.date, entry.event));
                },
            },
        });
    }, [commitDelete, findEvent, showToast]);

    const deleteDay = useCallback((date) => {
        setRawDays((prev) => prev.filter((d) => d.date !== date));
        return enqueue(() => api.deleteEventsByDate(date), 'この日を削除できませんでした');
    }, [enqueue]);

    const setPayment = useCallback((eventId, { amount, payer }) => {
        const found = findEvent(eventId);
        if (!found) return Promise.resolve(false);
        const patch = { budgetAmount: amount ? String(amount) : '', budgetPaidBy: amount ? payer || '' : '' };
        setRawDays((prev) => replaceEvent(prev, eventId, patch));
        return enqueue(
            () => api.updateEvent({ date: found.date, name: found.event.name, row: rowHint(eventId), eventData: patch }),
            '支払いを保存できませんでした',
        );
    }, [enqueue, findEvent]);

    const value = useMemo(() => ({
        days,
        status,
        syncError,
        syncedAt,
        saving: pending > 0,
        today,
        refresh,
        saveEvent,
        deleteEvent,
        deleteDay,
        setPayment,
    }), [days, status, syncError, syncedAt, pending, today, refresh, saveEvent, deleteEvent, deleteDay, setPayment]);

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
