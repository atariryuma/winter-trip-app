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
// Dates — the sheet stores "M/D" without a year
// ---------------------------------------------------------------------------

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const parseMonthDay = (dateStr) => {
    const [month, day] = String(dateStr).split('/').map(Number);
    return { month, day };
};

/**
 * Assign real dates to the "M/D" strings of a trip, in order.
 * The first day gets the earliest year that is not more than ~4 months in the
 * past, so an upcoming or ongoing trip resolves correctly across New Year.
 * Following days roll over to the next year when the month goes backwards.
 */
export const resolveTripDates = (dateStrings, today = new Date()) => {
    const result = {};
    if (dateStrings.length === 0) return result;
    const floor = startOfDay(today).getTime() - 120 * DAY_MS;
    const first = parseMonthDay(dateStrings[0]);
    let year = today.getFullYear() - 1;
    while (new Date(year, first.month - 1, first.day).getTime() < floor) year += 1;

    let prevMonth = first.month;
    dateStrings.forEach((str) => {
        const { month, day } = parseMonthDay(str);
        if (month < prevMonth) year += 1;
        prevMonth = month;
        result[str] = new Date(year, month - 1, day);
    });
    return result;
};

// Chronological order of "M/D" strings for a trip that may span New Year.
export const sortDateStrings = (dateStrings) => {
    const unique = [...new Set(dateStrings)];
    const late = unique.filter((d) => parseMonthDay(d).month >= 7);
    const early = unique.filter((d) => parseMonthDay(d).month < 7);
    const byMonthDay = (a, b) => {
        const pa = parseMonthDay(a);
        const pb = parseMonthDay(b);
        return pa.month - pb.month || pa.day - pb.day;
    };
    // Trips that cross New Year list the autumn/winter months first.
    if (late.length && early.length) return [...late.sort(byMonthDay), ...early.sort(byMonthDay)];
    return unique.sort(byMonthDay);
};

export const toDateString = (date) => `${date.getMonth() + 1}/${date.getDate()}`;
export const weekdayOf = (date) => WEEKDAYS[date.getDay()];
export const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
export const isSameDay = (a, b) => daysBetween(a, b) === 0;

export const formatDateJa = (date, { withYear = false } = {}) =>
    `${withYear ? `${date.getFullYear()}年` : ''}${date.getMonth() + 1}月${date.getDate()}日(${weekdayOf(date)})`;

// ---------------------------------------------------------------------------
// Trip shaping
// ---------------------------------------------------------------------------

/** Normalise raw server days into the shape the UI works with. */
export const buildTrip = (rawDays, today = new Date()) => {
    const order = sortDateStrings(rawDays.map((d) => d.date));
    const dates = resolveTripDates(order, today);
    const byDate = Object.fromEntries(rawDays.map((d) => [d.date, d]));
    return order.map((dateStr, index) => {
        const raw = byDate[dateStr];
        const date = dates[dateStr];
        return {
            id: raw.id || `day-${dateStr.replace('/', '-')}`,
            date: dateStr,
            index,
            fullDate: date,
            weekday: weekdayOf(date),
            events: [...(raw.events || [])].sort(compareByTime),
        };
    });
};

export const tripPhase = (days, now = new Date()) => {
    if (days.length === 0) return { phase: 'empty' };
    const first = days[0].fullDate;
    const last = days[days.length - 1].fullDate;
    const untilStart = daysBetween(now, first);
    if (untilStart > 0) return { phase: 'before', daysUntil: untilStart };
    const sinceEnd = daysBetween(last, now);
    if (sinceEnd > 0) return { phase: 'after', daysSince: sinceEnd };
    const todayIndex = days.findIndex((d) => isSameDay(d.fullDate, now));
    return { phase: 'during', todayIndex, dayNumber: todayIndex + 1 };
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

/** Row number hint for the backend; ids look like "e-12-28-5" (5 = data index). */
export const rowHint = (eventId) => {
    const m = /^e-\d+-\d+-(\d+)$/.exec(eventId || '');
    return m ? Number(m[1]) + 2 : undefined;
};
