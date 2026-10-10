import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../lib/api';
import {
    addDays, buildDays, compareByTime, dateFromKey, daysBetween, eventTitle, hasYear, rowHint, toDateKey, tripPhase,
    typeForCategory,
} from '../lib/trip';
import { resolveSeason } from '../lib/season';
import {
    BUDGET_GOAL_KEY, CURRENT_TRIP_KEY, DEFAULT_TRIP_ID, DEFAULT_TRIP_TITLE, LEGACY_TRIP_KEY, TRIP_TITLE_KEY,
} from '../lib/keys';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToast } from '../ui/contexts';
import { TripContext } from './context';

const CACHE_KEY = 'trip_cache_v3';
const OLD_CACHE_KEY = 'trip_cache_v2';
const UNDO_WINDOW_MS = 5000;

const readCache = () => {
    for (const key of [CACHE_KEY, OLD_CACHE_KEY]) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(parsed?.days)) return { trips: [], apiVersion: 1, ...parsed };
        } catch {
            /* ignore broken cache */
        }
    }
    return null;
};

const writeCache = (snapshot) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
    } catch {
        /* storage full: the app still works online */
    }
};

const readJson = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        return null;
    }
};

let tmpCounter = 0;
const tmpId = () => `tmp-${Date.now()}-${++tmpCounter}`;
const newTripId = () => `trip-${Math.random().toString(36).slice(2, 10)}`;
const tripOf = (event) => event.tripId || DEFAULT_TRIP_ID;

// --- Pure helpers on the raw server shape: [{ id, date, events: [] }] -------

const withoutEvent = (days, eventId) =>
    days
        .map((d) => ({ ...d, events: d.events.filter((e) => e.id !== eventId) }))
        .filter((d) => d.events.length > 0);

const withEvent = (days, date, event) => (days.some((d) => d.date === date)
    ? days.map((d) => (d.date === date ? { ...d, events: [...d.events, event].sort(compareByTime) } : d))
    : [...days, { id: `day-${date.replace(/\//g, '-')}`, date, events: [event] }]);

const replaceEvent = (days, eventId, patch) =>
    days.map((d) => ({ ...d, events: d.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)) }));

const withoutTripEvents = (days, tripId, keys = null) =>
    days
        .map((d) => (keys && !keys.includes(d.date) ? d : { ...d, events: d.events.filter((e) => tripOf(e) !== tripId) }))
        .filter((d) => d.events.length > 0);

/** Move one trip's events from date key A to B, as renameDates does on the server. */
const renameTripDates = (days, tripId, map) => {
    const moved = [];
    let next = days
        .map((d) => {
            if (!map[d.date]) return d;
            const keep = [];
            d.events.forEach((e) => (tripOf(e) === tripId ? moved.push({ date: map[d.date], event: e }) : keep.push(e)));
            return { ...d, events: keep };
        })
        .filter((d) => d.events.length > 0);
    moved.forEach(({ date, event }) => {
        next = withEvent(next, date, event);
    });
    return next;
};

/** Ongoing trip, else the next one, else the most recent. */
const pickDefaultTrip = (trips) =>
    trips.find((t) => t.phase.phase === 'during')
    || [...trips].filter((t) => t.phase.phase === 'before').sort((a, b) => a.start - b.start)[0]
    || [...trips].filter((t) => t.phase.phase === 'after').sort((a, b) => b.start - a.start)[0]
    || trips[0];

export default function TripProvider({ children }) {
    const { showToast } = useToast();
    const [cached] = useState(readCache);
    const [rawDays, setRawDays] = useState(cached?.days || []);
    const [serverTrips, setServerTrips] = useState(cached?.trips || []);
    const [apiVersion, setApiVersion] = useState(cached?.apiVersion || 1);
    const [status, setStatus] = useState(cached ? 'ready' : 'loading');
    const [syncError, setSyncError] = useState(null);
    const [syncedAt, setSyncedAt] = useState(cached?.syncedAt || null);
    const [pending, setPending] = useState(0);
    const [today, setToday] = useState(() => new Date());
    const [selectedTripId, setSelectedTripId] = useLocalStorage(CURRENT_TRIP_KEY, null);
    const [legacyTrip, setLegacyTrip] = useLocalStorage(LEGACY_TRIP_KEY, null);

    const queueRef = useRef(Promise.resolve());
    const pendingRef = useRef(0);
    const refreshTimer = useRef(null);
    const pendingDeletes = useRef(new Map());
    const writeGeneration = useRef(0);

    // Older backends (API v1) have no trips sheet: everything is one trip, kept on this device.
    const supportsTrips = apiVersion >= 2;

    const trips = useMemo(() => {
        const entriesByTrip = new Map();
        rawDays.forEach((day) => day.events.forEach((event) => {
            const id = supportsTrips ? tripOf(event) : DEFAULT_TRIP_ID;
            if (!entriesByTrip.has(id)) entriesByTrip.set(id, []);
            entriesByTrip.get(id).push({ key: day.date, event });
        }));

        // The trip that existed before trips did; v1 kept its name and budget on the device.
        const firstTrip = () => ({
            id: DEFAULT_TRIP_ID,
            title: legacyTrip?.title || readJson(TRIP_TITLE_KEY) || DEFAULT_TRIP_TITLE,
            startDate: '',
            theme: legacyTrip?.theme || 'auto',
            budget: legacyTrip?.budget ?? Number(readJson(BUDGET_GOAL_KEY) ?? 100000),
        });

        const list = supportsTrips ? [...serverTrips] : [firstTrip()];
        if (supportsTrips) {
            entriesByTrip.forEach((_, id) => {
                if (list.some((t) => t.id === id)) return;
                list.push(id === DEFAULT_TRIP_ID ? firstTrip() : { id, title: '旅行', startDate: '', theme: 'auto', budget: 0 });
            });
        }

        return list.map((trip) => {
            const days = buildDays(entriesByTrip.get(trip.id) || [], today);
            const planned = trip.startDate ? dateFromKey(trip.startDate) : null;
            const start = days[0]?.fullDate || planned;
            return {
                ...trip,
                days,
                start,
                end: days[days.length - 1]?.fullDate || start,
                phase: tripPhase(days, today, planned),
                season: resolveSeason(trip.theme, start, today),
                hasUndatedDays: days.some((d) => d.keys.some((k) => !hasYear(k))),
            };
        });
    }, [rawDays, serverTrips, supportsTrips, legacyTrip, today]);

    const currentTrip = useMemo(
        () => trips.find((t) => t.id === selectedTripId) || pickDefaultTrip(trips) || null,
        [trips, selectedTripId],
    );

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
            const snapshot = {
                days: serverDays,
                trips: data?.trips || [],
                apiVersion: data?.apiVersion || 1,
                syncedAt: Date.now(),
            };
            const hidden = pendingDeletes.current;
            setRawDays(hidden.size
                ? serverDays.map((d) => ({ ...d, events: d.events.filter((e) => !hidden.has(e.id)) }))
                    .filter((d) => d.events.length > 0)
                : serverDays);
            setServerTrips(snapshot.trips);
            setApiVersion(snapshot.apiVersion);
            setSyncedAt(snapshot.syncedAt);
            setSyncError(null);
            setStatus('ready');
            writeCache(snapshot);
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

    // --- Events --------------------------------------------------------------

    /**
     * Create or update an event.
     * @param original existing event (null when creating)
     * @param date target date key (may differ to move the event)
     * @param fields editable fields of the event
     */
    const saveEvent = useCallback(({ original, date, fields }) => {
        const tripId = original ? tripOf(original) : (currentTrip?.id || DEFAULT_TRIP_ID);
        const data = { ...fields, type: typeForCategory(fields.category), ...(supportsTrips ? { tripId } : {}) };
        const originalDate = original ? findEvent(original.id)?.date : null;
        if (original && !originalDate) return Promise.resolve(false);
        const id = original?.id || tmpId();
        setRawDays((prev) => withEvent(original ? withoutEvent(prev, original.id) : prev, date, { ...original, ...data, tripId, id }));

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
    }, [currentTrip, enqueue, findEvent, supportsTrips]);

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

    /** Delete every event of a day (a day can span several date keys). */
    const deleteDay = useCallback((day) => {
        const tripId = currentTrip?.id || DEFAULT_TRIP_ID;
        setRawDays((prev) => withoutTripEvents(prev, tripId, day.keys));
        return enqueue(async () => {
            for (const key of day.keys) {
                await api.deleteEventsByDate(key, supportsTrips ? tripId : undefined);
            }
        }, 'この日を削除できませんでした');
    }, [currentTrip, enqueue, supportsTrips]);

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

    const importEvents = useCallback(
        (csv) => enqueue(() => api.uploadEvents(csv, supportsTrips ? currentTrip?.id : undefined), 'CSVを取り込めませんでした'),
        [currentTrip, enqueue, supportsTrips],
    );

    // --- Trips ---------------------------------------------------------------

    /**
     * Create or update a trip. Resolves to its id (null on failure).
     * @param trip { id?, title, theme, budget }
     * @param start planned first day (Date). For an existing trip with days, a
     *   new start shifts every day and stores the dates with their year.
     */
    const saveTrip = useCallback((trip, start = null) => {
        if (!supportsTrips) {
            setLegacyTrip({ title: trip.title, theme: trip.theme, budget: Number(trip.budget) || 0 });
            return Promise.resolve(DEFAULT_TRIP_ID);
        }
        const existing = trip.id ? trips.find((t) => t.id === trip.id) : null;
        const id = trip.id || newTripId();
        const record = {
            id,
            title: trip.title,
            startDate: start ? toDateKey(start) : existing?.startDate || '',
            theme: trip.theme || 'auto',
            budget: Number(trip.budget) || 0,
        };

        const changes = [];
        if (existing && start && existing.days.length > 0) {
            const offset = daysBetween(existing.days[0].fullDate, start);
            existing.days.forEach((day) => {
                const target = toDateKey(addDays(day.fullDate, offset));
                day.keys.forEach((key) => {
                    if (key !== target) changes.push({ from: key, to: target });
                });
            });
        }

        setServerTrips((prev) => (prev.some((t) => t.id === id) ? prev.map((t) => (t.id === id ? record : t)) : [...prev, record]));
        if (changes.length > 0) {
            setRawDays((prev) => renameTripDates(prev, id, Object.fromEntries(changes.map((c) => [c.from, c.to]))));
        }
        if (!existing) setSelectedTripId(id);

        return enqueue(async () => {
            await api.saveTrip(record);
            if (changes.length > 0) await api.renameDates(id, changes);
        }, '旅行を保存できませんでした').then((ok) => (ok ? id : null));
    }, [enqueue, setLegacyTrip, setSelectedTripId, supportsTrips, trips]);

    const deleteTrip = useCallback((id) => {
        if (!supportsTrips) return Promise.resolve(false);
        setRawDays((prev) => withoutTripEvents(prev, id));
        setServerTrips((prev) => prev.filter((t) => t.id !== id));
        if (selectedTripId === id) setSelectedTripId(null);
        return enqueue(() => api.deleteTrip(id), '旅行を削除できませんでした');
    }, [enqueue, selectedTripId, setSelectedTripId, supportsTrips]);

    const value = useMemo(() => ({
        trips,
        currentTrip,
        days: currentTrip?.days || [],
        supportsTrips,
        status,
        syncError,
        syncedAt,
        saving: pending > 0,
        today,
        refresh,
        selectTrip: setSelectedTripId,
        saveTrip,
        deleteTrip,
        saveEvent,
        deleteEvent,
        deleteDay,
        setPayment,
        importEvents,
    }), [
        trips, currentTrip, supportsTrips, status, syncError, syncedAt, pending, today, refresh, setSelectedTripId,
        saveTrip, deleteTrip, saveEvent, deleteEvent, deleteDay, setPayment, importEvents,
    ]);

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
