import {
    Plane, TrainFront, Bus, Car, BedDouble, Utensils, Camera, ShoppingBag, Mountain, MapPin,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Categories & statuses
// ---------------------------------------------------------------------------

// Tailwind needs literal class names, so every tone is spelled out in full.
const TONES = {
    sky: { dot: 'bg-sky-500', soft: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', ring: 'ring-sky-500' },
    emerald: { dot: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', ring: 'ring-emerald-500' },
    teal: { dot: 'bg-teal-500', soft: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300', ring: 'ring-teal-500' },
    slate: { dot: 'bg-slate-500', soft: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300', ring: 'ring-slate-500' },
    violet: { dot: 'bg-violet-500', soft: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', ring: 'ring-violet-500' },
    orange: { dot: 'bg-orange-500', soft: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300', ring: 'ring-orange-500' },
    rose: { dot: 'bg-rose-500', soft: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', ring: 'ring-rose-500' },
    pink: { dot: 'bg-pink-500', soft: 'bg-pink-50 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300', ring: 'ring-pink-500' },
    lime: { dot: 'bg-lime-600', soft: 'bg-lime-50 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300', ring: 'ring-lime-600' },
};

export const CATEGORIES = {
    flight: { label: '飛行機', icon: Plane, type: 'transport', tone: 'sky' },
    train: { label: '電車', icon: TrainFront, type: 'transport', tone: 'emerald' },
    bus: { label: 'バス', icon: Bus, type: 'transport', tone: 'teal' },
    transfer: { label: '移動', icon: Car, type: 'activity', tone: 'slate' },
    hotel: { label: '宿泊', icon: BedDouble, type: 'stay', tone: 'violet' },
    meal: { label: '食事', icon: Utensils, type: 'activity', tone: 'orange' },
    sightseeing: { label: '観光', icon: Camera, type: 'activity', tone: 'rose' },
    shopping: { label: '買い物', icon: ShoppingBag, type: 'activity', tone: 'pink' },
    activity: { label: '体験', icon: Mountain, type: 'activity', tone: 'lime' },
};

const FALLBACK_CATEGORY = { label: '予定', icon: MapPin, type: 'activity', tone: 'slate' };

export const categoryMeta = (category) => {
    const meta = CATEGORIES[category] || FALLBACK_CATEGORY;
    return { ...meta, toneClasses: TONES[meta.tone] };
};

export const typeForCategory = (category) => (CATEGORIES[category] || FALLBACK_CATEGORY).type;

export const STATUSES = {
    confirmed: { label: '予約済', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
    planned: { label: '計画中', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    suggested: { label: '候補', cls: 'border border-dashed border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400' },
};

export const isConfirmed = (e) => e.status === 'confirmed' || e.status === 'booked';
export const isTransport = (e) => typeForCategory(e.category) === 'transport' || e.type === 'transport';
export const isStay = (e) => e.category === 'hotel' || e.type === 'stay';
export const isFlight = (e) => e.category === 'flight';
export const isBookable = (e) => isTransport(e) || isStay(e);
export const needsBooking = (e) => isBookable(e) && !isConfirmed(e);

// Where you need to be when the event starts / where you are when it ends.
export const startPlace = (e) => (isTransport(e) ? e.from : (e.to || e.name)) || '';
export const endPlace = (e) => (isTransport(e) ? e.to : (e.to || e.name)) || '';

// "白川郷" and "白川郷散策" are the same stop as far as travel time goes.
export const samePlace = (a, b) => {
    const x = (a || '').replace(/\s/g, '');
    const y = (b || '').replace(/\s/g, '');
    return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
};

export const eventTitle = (e) => {
    if (e.name) return e.name;
    if (isTransport(e) && (e.from || e.to)) return `${e.from || '?'} → ${e.to || '?'}`;
    return '名称未設定';
};

// ---------------------------------------------------------------------------
// Time helpers ("HH:MM" strings)
// ---------------------------------------------------------------------------

export const toMinutes = (time) => {
    if (!time || !/^\d{1,2}:\d{2}/.test(time)) return null;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

export const toTime = (minutes) => {
    const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export const formatMinutes = (minutes) => {
    if (minutes === null || minutes === undefined) return '';
    const abs = Math.abs(minutes);
    if (abs < 60) return `${abs}分`;
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return m ? `${h}時間${m}分` : `${h}時間`;
};

export const compareByTime = (a, b) =>
    (a.time || '99:99').padStart(5, '0').localeCompare((b.time || '99:99').padStart(5, '0'));

// Minutes between the end of `a` and the start of `b`, tolerating overnight hops.
export const gapMinutes = (a, b) => {
    const end = toMinutes(a.endTime || a.time);
    const start = toMinutes(b.time);
    if (end === null || start === null) return null;
    let diff = start - end;
    if (diff < 0 && end >= 20 * 60 && start < 6 * 60) diff += 1440;
    return diff;
};

export const parseDurationText = (text) => {
    if (!text || typeof text !== 'string') return null;
    let minutes = 0;
    let matched = false;
    const jpH = text.match(/(\d+)\s*時間/);
    const jpM = text.match(/(\d+)\s*分/);
    if (jpH) { minutes += Number(jpH[1]) * 60; matched = true; }
    if (jpM) { minutes += Number(jpM[1]); matched = true; }
    if (!matched) {
        const enH = text.match(/(\d+)\s*(?:hours?|hrs?)\b/i);
        const enM = text.match(/(\d+)\s*(?:minutes?|mins?)\b/i);
        if (enH) { minutes += Number(enH[1]) * 60; matched = true; }
        if (enM) { minutes += Number(enM[1]); matched = true; }
    }
    return matched ? minutes : null;
};

// ---------------------------------------------------------------------------
// Dates — keys are "2027/8/10", or "8/10" for rows saved before years were kept
// ---------------------------------------------------------------------------

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const parseDateKey = (key) => {
    const parts = String(key).split('/').map(Number);
    return parts.length === 3
        ? { year: parts[0], month: parts[1], day: parts[2] }
        : { year: null, month: parts[0], day: parts[1] };
};

export const hasYear = (key) => parseDateKey(key).year !== null;

/** Date key for the sheet. Without `withYear` (older backends) it is "M/D". */
export const toDateKey = (date, withYear = true) =>
    `${withYear ? `${date.getFullYear()}/` : ''}${date.getMonth() + 1}/${date.getDate()}`;

/** Date for a key that carries a year, else null. */
export const dateFromKey = (key) => {
    const { year, month, day } = parseDateKey(key);
    return year && month && day ? new Date(year, month - 1, day) : null;
};

export const isoDate = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const fromIsoDate = (iso) => {
    const [y, m, d] = String(iso).split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d) : null;
};

// Position in a leap reference year, so 2/29 has a slot.
const dayOfYear = (month, day) => Math.round((new Date(2000, month - 1, day) - new Date(2000, 0, 1)) / DAY_MS);

/**
 * Resolve the date keys of one trip to real dates.
 * Keys with a year are exact. Year-less legacy keys are treated as one
 * contiguous trip: it starts right after the largest gap in the calendar (so
 * 12/30→1/2 and 6/29→7/2 both come out in order), and it is anchored to the
 * year of the trip's dated keys, or else to the first occurrence that is not
 * more than ~4 months in the past.
 */
export const resolveDates = (keys, today = new Date()) => {
    const result = {};
    const legacy = [];
    new Set(keys).forEach((key) => {
        const { year, month, day } = parseDateKey(key);
        if (year) result[key] = new Date(year, month - 1, day);
        else if (month && day) legacy.push(key);
    });
    if (legacy.length === 0) return result;

    const pos = (key) => {
        const { month, day } = parseDateKey(key);
        return dayOfYear(month, day);
    };
    const sorted = legacy.sort((a, b) => pos(a) - pos(b));
    let startIndex = 0;
    let widest = -1;
    sorted.forEach((key, i) => {
        const prev = sorted[(i - 1 + sorted.length) % sorted.length];
        const gap = sorted.length === 1 ? 366 : (pos(key) - pos(prev) + 366) % 366;
        if (gap > widest) {
            widest = gap;
            startIndex = i;
        }
    });
    const ordered = [...sorted.slice(startIndex), ...sorted.slice(0, startIndex)];

    const first = parseDateKey(ordered[0]);
    const at = (y) => new Date(y, first.month - 1, first.day);
    const dated = Object.values(result).sort((a, b) => a - b);
    let year;
    if (dated.length > 0) {
        const ref = dated[0].getFullYear();
        year = [ref - 1, ref, ref + 1].reduce((best, y) =>
            (Math.abs(at(y) - dated[0]) < Math.abs(at(best) - dated[0]) ? y : best));
    } else {
        const floor = startOfDay(today).getTime() - 120 * DAY_MS;
        year = today.getFullYear() - 1;
        while (at(year).getTime() < floor) year += 1;
    }

    let prev = null;
    ordered.forEach((key) => {
        const { month, day } = parseDateKey(key);
        let date = new Date(year, month - 1, day);
        if (prev && date < prev) {
            year += 1;
            date = new Date(year, month - 1, day);
        }
        result[key] = date;
        prev = date;
    });
    return result;
};

export const weekdayOf = (date) => WEEKDAYS[date.getDay()];
export const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
export const isSameDay = (a, b) => daysBetween(a, b) === 0;
export const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

export const formatDateJa = (date, { withYear = false } = {}) =>
    `${withYear ? `${date.getFullYear()}年` : ''}${date.getMonth() + 1}月${date.getDate()}日(${weekdayOf(date)})`;

export const formatShortDate = (date) => `${date.getMonth() + 1}/${date.getDate()}(${weekdayOf(date)})`;

export const formatRange = (start, end, { withYear = true } = {}) => {
    if (!start) return '';
    const y = withYear ? `${start.getFullYear()}/` : '';
    if (!end || isSameDay(start, end)) return `${y}${formatShortDate(start)}`;
    return `${y}${formatShortDate(start)} – ${formatShortDate(end)}`;
};

// ---------------------------------------------------------------------------
// Trip shaping
// ---------------------------------------------------------------------------

/**
 * Turn one trip's events into days.
 * @param entries [{ key, event }] — `key` is the event's date key in the sheet
 * Days are keyed by calendar date; if a legacy "M/D" key and a "yyyy/M/d" key
 * land on the same date they become one day. `date` is the preferred key for
 * new events on that day (the one with a year), `keys` lists them all.
 */
export const buildDays = (entries, today = new Date()) => {
    const dates = resolveDates(entries.map((e) => e.key), today);
    const byIso = new Map();
    entries.forEach(({ key, event }) => {
        const fullDate = dates[key];
        if (!fullDate) return;
        const iso = isoDate(fullDate);
        if (!byIso.has(iso)) byIso.set(iso, { iso, fullDate, keys: [], events: [] });
        const day = byIso.get(iso);
        if (!day.keys.includes(key)) day.keys.push(key);
        day.events.push(event);
    });
    return [...byIso.values()]
        .sort((a, b) => a.fullDate - b.fullDate)
        .map((d, index) => ({
            id: `day-${d.iso}`,
            date: d.keys.find(hasYear) || d.keys[0],
            keys: d.keys,
            index,
            fullDate: d.fullDate,
            weekday: weekdayOf(d.fullDate),
            events: d.events.sort(compareByTime),
        }));
};

/**
 * Where we are relative to a trip: before / during / after.
 * Uses the days if there are any, else the trip's planned start date.
 */
export const tripPhase = (days, now = new Date(), plannedStart = null) => {
    const first = days[0]?.fullDate || plannedStart;
    if (!first) return { phase: 'empty' };
    const last = days[days.length - 1]?.fullDate || first;
    const untilStart = daysBetween(now, first);
    if (untilStart > 0) return { phase: 'before', daysUntil: untilStart };
    const sinceEnd = daysBetween(last, now);
    if (sinceEnd > 0) return { phase: 'after', daysSince: sinceEnd };
    const todayIndex = days.findIndex((d) => isSameDay(d.fullDate, now));
    return { phase: 'during', todayIndex, dayNumber: daysBetween(first, now) + 1 };
};

export const phaseLabel = (phase) => {
    switch (phase?.phase) {
        case 'before': return phase.daysUntil === 1 ? 'いよいよ明日出発' : `出発まであと${phase.daysUntil}日`;
        case 'during': return phase.dayNumber > 0 ? `旅行中・${phase.dayNumber}日目` : '旅行中';
        case 'after': return 'おかえりなさい';
        default: return '日程未定';
    }
};

/** The ordered stops of a day, for the "route" summary and the Maps link. */
export const dayRoute = (events, startFrom) => {
    const stops = [];
    if (startFrom) stops.push(startFrom);
    events.forEach((e) => {
        if (isFlight(e)) {
            if (e.to) stops.push(e.to);
            return;
        }
        if (isTransport(e)) {
            if (e.from) stops.push(e.from);
            if (e.to) stops.push(e.to);
        } else {
            const place = e.to || e.name;
            if (place) stops.push(place);
        }
    });
    return stops.filter((s, i) => i === 0 || s !== stops[i - 1]);
};

export const mapsSearchUrl = (query) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const mapsDirectionsUrl = (stops) => {
    if (stops.length === 0) return null;
    if (stops.length === 1) return mapsSearchUrl(stops[0]);
    const enc = encodeURIComponent;
    const waypoints = stops.slice(1, -1).slice(0, 9).map(enc).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${enc(stops[0])}&destination=${enc(stops[stops.length - 1])}${waypoints ? `&waypoints=${waypoints}` : ''}`;
};

export const formatYen = (n) => `¥${Math.round(n || 0).toLocaleString('ja-JP')}`;

/** Sheet row of an event, so the backend can tell same-named events apart. */
export const rowHint = (eventId) => {
    const current = /^ev-(\d+)$/.exec(eventId || '');
    if (current) return Number(current[1]);
    const legacy = /^e-\d+-\d+-(\d+)$/.exec(eventId || ''); // ids from API v1
    return legacy ? Number(legacy[1]) + 2 : undefined;
};
