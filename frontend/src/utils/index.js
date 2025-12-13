export const generateId = () => Math.random().toString(36).substring(2, 11);

export const toMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

export const toTimeStr = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const getMidTime = (t1, t2) => {
    const m1 = toMinutes(t1);
    const m2 = toMinutes(t2);
    // Handle overnight (e.g. 23:00 to 01:00)
    let diff = m2 - m1;
    if (diff < 0) diff += 24 * 60;
    const mid = (m1 + diff / 2) % (24 * 60);
    return toTimeStr(Math.floor(mid));
};

export { parseDurationToMinutes } from './durationParser';

// Re-export cache utilities
export { getCachedItem, setCachedItem, cleanupExpiredCache, enforceCacheLimit, getCacheStats } from './cache';

export const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return null;
    if (minutes < 0) return null; // Overlap
    if (minutes === 0) return 'Next';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const getDurationMinutes = (currentEvent, nextEvent) => {
    const currentEnd = currentEvent.endTime || currentEvent.time;
    const nextStart = nextEvent?.time;
    if (!currentEnd || !nextStart) return null;

    const endMinutes = toMinutes(currentEnd);
    const startMinutes = toMinutes(nextStart);
    let diff = startMinutes - endMinutes;

    // Handle overnight edge case (e.g., 23:30 -> 00:30 = +60 min, not -1380 min)
    // Heuristic: Use time-of-day context to determine if crossing midnight.
    // If current event ends late (after 20:00) and next starts early (before 06:00),
    // it's likely an overnight transition, not a huge overlap.
    const isLateEnd = endMinutes >= 20 * 60;      // 20:00 or later
    const isEarlyStart = startMinutes < 6 * 60;   // before 06:00

    if (diff < 0 && isLateEnd && isEarlyStart) {
        diff += 24 * 60; // Add 24 hours for overnight
    }

    return diff;
};

// Date/Year Utilities
/**
 * Calculates the correct year for a given date string (MM/DD) based on the current date context.
 * Assumes "Winter Trip" context: 
 * - If current month is Oct-Dec, dates in Jan-Mar are Next Year.
 * - If current month is Jan-Mar, dates in Oct-Dec are Previous Year.
 * - Otherwise (Standard), Month >= Current Month is Current Year, else Next Year (naive future).
 */
export const getTripDate = (dateStr) => {
    const [month, day] = dateStr.split('/').map(Number);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let targetYear = currentYear;

    // Winter Trip Heuristics (Oct-Mar Season)
    // Case 1: Currently Late Year (Oct-Dec), looking at Early Year date (Jan-Mar)
    if (currentMonth >= 10 && month <= 3) {
        targetYear = currentYear + 1;
    }
    // Case 2: Currently Early Year (Jan-Mar), looking at Late Year date (Oct-Dec)
    else if (currentMonth <= 3 && month >= 10) {
        targetYear = currentYear - 1;
    }

    // Create UTC date to avoid timezone shifts affecting the day
    return new Date(targetYear, month - 1, day);
};

export const getTripYear = (dateStr) => {
    return getTripDate(dateStr).getFullYear();
};
