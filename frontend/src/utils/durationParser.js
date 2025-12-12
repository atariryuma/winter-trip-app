/**
 * Parse duration strings into minutes.
 * Handles Japanese formats (e.g. "1時間45分", "45分")
 * and English formats (e.g. "1 hour 45 mins", "45 mins").
 *
 * @param {string} durationStr - The duration string to parse.
 * @returns {number|null} - The duration in minutes, or null if parsing failed/invalid.
 */
export const parseDurationToMinutes = (durationStr) => {
    if (!durationStr || typeof durationStr !== 'string') return null;

    let minutes = 0;
    let matched = false;

    // Japanese format: "1時間45分", "1時間 30分", "1 時間"
    const hourMatchJP = durationStr.match(/(\d+)\s*時間/);
    const minMatchJP = durationStr.match(/(\d+)\s*分/);

    if (hourMatchJP) {
        minutes += parseInt(hourMatchJP[1], 10) * 60;
        matched = true;
    }
    if (minMatchJP) {
        minutes += parseInt(minMatchJP[1], 10);
        matched = true;
    }

    // English/Generic format: "1 hour 30 mins", "90 mins"
    if (!matched) {
        // Look for "hour" or "hr" - use word boundary/end to avoid matching partial words
        const hourMatchEN = durationStr.match(/(\d+)\s*(?:hours?|hrs?|h)(?:\s|$|[^a-zA-Z])/i);
        // Look for "min" or "m" - use negative lookahead to avoid matching "am", "pm", "meters", etc.
        // Also ensure "m" is at word boundary (followed by space, digit, end, or non-letter)
        const minMatchEN = durationStr.match(/(\d+)\s*(?:minutes?|mins?|m(?![a-zA-Z]))(?:\s|$|[^a-zA-Z])?/i);

        if (hourMatchEN) {
            minutes += parseInt(hourMatchEN[1], 10) * 60;
            matched = true;
        }
        if (minMatchEN) {
            minutes += parseInt(minMatchEN[1], 10);
            matched = true;
        }
    }

    // Fallback: If only a number is present (heuristic, might be risky, but kept for compatibility with original code's intent)
    // The original code had: const numMatch = routeData.duration.match(/(\d+)/);
    if (!matched) {
        const numMatch = durationStr.match(/^(\d+)\s*$/); // strict "number only" to avoid matching partials in bad strings
        if (numMatch) {
            minutes = parseInt(numMatch[1], 10);
            matched = true;
        }
    }

    return matched ? minutes : null;
};
