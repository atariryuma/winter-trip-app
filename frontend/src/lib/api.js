import cache from './cache';

const API_URL = 'https://script.google.com/macros/s/AKfycbxdqZBzJm-TscH3ed7HsG9jBqK1hBQzCKqgJ1qngz42TERjOqju2jQqu3m1KRw49avX5Q/exec';

const DAY = 24 * 60 * 60 * 1000;
const CACHE_TTL = {
    PLACE_INFO: 7 * DAY,
    STATIC_MAP: 14 * DAY,
    ROUTE: 3 * DAY,
    AUTOCOMPLETE: 1 * DAY,
};

const makeCacheKey = (prefix, query) => {
    try {
        return `${prefix}_${btoa(encodeURIComponent(query))}`;
    } catch {
        return `${prefix}_${encodeURIComponent(query).slice(0, 100)}`;
    }
};

const decodeCacheKey = (key, prefix) => {
    try {
        return decodeURIComponent(atob(key.replace(`${prefix}_`, '')));
    } catch {
        return null;
    }
};

const fetchWithRetry = async (url, options = {}, retries = 2, backoff = 800) => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
    } catch (err) {
        if (retries <= 0) throw err;
        await new Promise((r) => setTimeout(r, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
};

// GAS always answers 200 with { status, data | error }.
const unwrap = async (res, fallbackMessage) => {
    const json = await res.json();
    if (json.status !== 'success') throw new Error(json.error?.message || fallbackMessage);
    return json.data;
};

const get = async (params, fallbackMessage = 'リクエストに失敗しました') => {
    const query = new URLSearchParams(params).toString();
    return unwrap(await fetchWithRetry(`${API_URL}?${query}`), fallbackMessage);
};

// Mutations are not retried automatically: a timed-out request may still have
// been applied by GAS, and replaying it could duplicate rows.
const post = async (params, fallbackMessage = '保存に失敗しました') => {
    const body = new URLSearchParams(params);
    return unwrap(await fetchWithRetry(API_URL, { method: 'POST', body }, 0), fallbackMessage);
};

const mutateGet = async (params, fallbackMessage, options = {}) => {
    const query = new URLSearchParams(params).toString();
    return unwrap(await fetchWithRetry(`${API_URL}?${query}`, options, 0), fallbackMessage);
};

const cached = async (prefix, query, ttl, load) => {
    const key = makeCacheKey(prefix, query);
    const hit = cache.get(key);
    if (hit) return hit;
    const value = await load();
    if (value) cache.set(key, value, ttl);
    return value;
};

const api = {
    getData: () => get({ action: 'getData' }, 'データを取得できませんでした'),

    // Throws when the server can't be reached, so callers can tell that apart from a wrong code.
    validatePasscode: async (code) => {
        const data = await get({ action: 'validatePasscode', code }, 'サーバーに接続できませんでした');
        return data?.valid === true;
    },

    // --- Events ------------------------------------------------------------
    // Events are addressed by date + name; `row` is an optional hint that lets
    // an updated backend tell apart events that share a name on the same day.

    addEvent: (eventData) =>
        post({ action: 'addEvent', eventData: JSON.stringify(eventData) }, '予定を追加できませんでした'),

    updateEvent: ({ date, name, row, eventData }) =>
        post({
            action: 'batchUpdateEvents',
            updates: JSON.stringify([{ date, eventId: name, row, eventData }]),
        }, '予定を更新できませんでした'),

    moveEvent: ({ originalDate, name, row, newDate, newStartTime, newEndTime }) =>
        mutateGet({
            action: 'moveEvent',
            eventData: JSON.stringify({ originalDate, eventId: name, row, newDate, newStartTime, newEndTime }),
        }, '日付を変更できませんでした'),

    // `keepalive` lets a pending delete finish while the page is being closed.
    deleteEvent: ({ date, name, row }, { keepalive = false } = {}) =>
        mutateGet({ action: 'deleteEvent', date, eventId: name, ...(row ? { row } : {}) }, '削除できませんでした', { keepalive }),

    deleteEventsByDate: (date) =>
        mutateGet({ action: 'deleteEventsByDate', date }, 'この日を削除できませんでした'),

    uploadEvents: (csv) => post({ action: 'uploadEvents', data: csv }, 'CSVを取り込めませんでした'),

    // --- Packing list --------------------------------------------------------

    getPackingList: () => get({ action: 'getPackingList' }, '持ち物リストを取得できませんでした'),

    savePackingItem: (item) =>
        mutateGet({
            action: 'updatePackingItem',
            id: item.id || '',
            name: item.name,
            category: item.category,
            isShared: String(!!item.isShared),
            assignee: item.assignee || '',
            isChecked: String(!!item.isChecked),
        }, '持ち物を保存できませんでした'),

    savePackingItems: (items) =>
        post({
            action: 'batchUpdatePackingItems',
            items: JSON.stringify(items.map((i) => ({
                ...i, isShared: String(!!i.isShared), isChecked: String(!!i.isChecked),
            }))),
        }, '持ち物を保存できませんでした'),

    deletePackingItem: (id) => mutateGet({ action: 'deletePackingItem', id }, '持ち物を削除できませんでした'),

    // --- Places & routes (cached on device) ----------------------------------

    getPlaceInfo: (query) => {
        if (!query?.trim()) return Promise.resolve(null);
        return cached('place', query, CACHE_TTL.PLACE_INFO, () =>
            get({ action: 'getPlaceInfo', query }).catch(() => null));
    },

    getPlaceAutocomplete: async (input) => {
        if (!input?.trim() || input.trim().length < 2) return [];
        const data = await cached('autocomplete', input, CACHE_TTL.AUTOCOMPLETE, () =>
            get({ action: 'getPlaceAutocomplete', input }).catch(() => null));
        return data?.predictions || [];
    },

    getStaticMap: (location) => {
        if (!location?.trim()) return Promise.resolve(null);
        return cached('staticmap', location, CACHE_TTL.STATIC_MAP, () =>
            get({ action: 'getStaticMap', location }).then((d) => d?.image || null).catch(() => null));
    },

    getRoute: (origin, destination) => {
        if (!origin?.trim() || !destination?.trim()) return Promise.resolve(null);
        return cached('routemap', `${origin}|${destination}`, CACHE_TTL.ROUTE, () =>
            get({ action: 'getRouteMap', origin, destination }).catch(() => null));
    },

    invalidatePlace: (location) => {
        if (!location?.trim()) return;
        const prefixes = ['place', 'staticmap', 'routemap', 'autocomplete'];
        const stale = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const prefix = key && prefixes.find((p) => key.startsWith(`${p}_`));
            if (prefix && decodeCacheKey(key, prefix)?.includes(location)) stale.push(key);
        }
        stale.forEach((key) => localStorage.removeItem(key));
    },

    clearDeviceCache: () => cache.clearAll(),
    maintainCache: () => {
        cache.cleanup();
        cache.enforceLimit();
    },
};

export default api;
