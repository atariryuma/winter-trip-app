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

export const parseDate = (dateStr) => {
    // Format: "12/28" or "1/1"
    const [month] = dateStr.split('/').map(Number);
    // Assume year based on month: 10-12 = current year end, 1-9 = next year start
    // Ideally this logic should be more robust or take a base year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    let year = now.getFullYear();

    // If current month is Oct-Dec and target is Jan-Sep, it's next year
    if (currentMonth >= 10 && month < 10) {
        year += 1;
    }
    // If current month is Jan-Mar and target is Oct-Dec, it was last year (unlikely for future trip but possible)
    else if (currentMonth < 4 && month >= 10) {
        year -= 1;
    }

    return year;
};
