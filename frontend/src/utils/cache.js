/**
 * Cache utility with TTL (Time To Live) support
 * Prevents unbounded localStorage growth
 */

// Default TTL: 7 days in milliseconds
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000;

// Maximum cache entries to prevent localStorage overflow
const MAX_CACHE_ENTRIES = 500;

/**
 * Get item from cache with TTL validation
 * @param {string} key - Cache key
 * @returns {any|null} - Cached value or null if expired/missing
 */
export const getCachedItem = (key) => {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;

        const parsed = JSON.parse(item);

        // Check if it's a TTL-wrapped item
        if (parsed && typeof parsed === 'object' && parsed._ttl && parsed._timestamp) {
            const now = Date.now();
            if (now - parsed._timestamp > parsed._ttl) {
                // Expired - remove and return null
                localStorage.removeItem(key);
                return null;
            }
            return parsed._data;
        }

        // Legacy format (no TTL) - return as-is for backward compatibility
        return parsed;
    } catch {
        return null;
    }
};

/**
 * Set item in cache with TTL
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds (default: 7 days)
 */
export const setCachedItem = (key, value, ttl = DEFAULT_TTL) => {
    try {
        const item = {
            _data: value,
            _timestamp: Date.now(),
            _ttl: ttl,
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
        // localStorage might be full - try to clean up
        if (e.name === 'QuotaExceededError') {
            cleanupExpiredCache();
            try {
                const item = {
                    _data: value,
                    _timestamp: Date.now(),
                    _ttl: ttl,
                };
                localStorage.setItem(key, JSON.stringify(item));
            } catch {
                // Still failed - ignore
                console.warn('Cache storage full, unable to save:', key);
            }
        }
    }
};

/**
 * Remove expired cache entries
 */
export const cleanupExpiredCache = () => {
    const prefixes = ['place_', 'staticmap_', 'routemap_', 'autocomplete_'];
    const keysToRemove = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !prefixes.some(p => key.startsWith(p))) continue;

        try {
            const item = localStorage.getItem(key);
            if (!item) continue;

            const parsed = JSON.parse(item);

            // Check TTL-wrapped items
            if (parsed && parsed._ttl && parsed._timestamp) {
                if (now - parsed._timestamp > parsed._ttl) {
                    keysToRemove.push(key);
                }
            }
        } catch {
            // Invalid JSON - remove it
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
        console.log(`Cache cleanup: ${keysToRemove.length} expired items removed`);
    }

    return keysToRemove.length;
};

/**
 * Enforce cache size limit using LRU-like strategy
 * Removes oldest entries when limit exceeded
 */
export const enforceCacheLimit = () => {
    const prefixes = ['place_', 'staticmap_', 'routemap_', 'autocomplete_'];
    const cacheEntries = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !prefixes.some(p => key.startsWith(p))) continue;

        try {
            const item = localStorage.getItem(key);
            if (!item) continue;

            const parsed = JSON.parse(item);
            const timestamp = parsed._timestamp || 0;
            cacheEntries.push({ key, timestamp });
        } catch {
            // Invalid - mark for removal with timestamp 0
            cacheEntries.push({ key, timestamp: 0 });
        }
    }

    // If under limit, nothing to do
    if (cacheEntries.length <= MAX_CACHE_ENTRIES) return 0;

    // Sort by timestamp (oldest first)
    cacheEntries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries to get under limit
    const toRemove = cacheEntries.length - MAX_CACHE_ENTRIES;
    const keysToRemove = cacheEntries.slice(0, toRemove).map(e => e.key);

    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log(`Cache limit enforced: ${keysToRemove.length} oldest items removed`);
    return keysToRemove.length;
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
    const prefixes = ['place_', 'staticmap_', 'routemap_', 'autocomplete_'];
    let totalEntries = 0;
    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !prefixes.some(p => key.startsWith(p))) continue;

        const item = localStorage.getItem(key);
        if (!item) continue;

        totalEntries++;
        totalSize += item.length * 2; // Approximate size in bytes (UTF-16)

        try {
            const parsed = JSON.parse(item);
            if (parsed._ttl && parsed._timestamp) {
                if (now - parsed._timestamp > parsed._ttl) {
                    expiredCount++;
                }
            }
        } catch {
            expiredCount++;
        }
    }

    return {
        totalEntries,
        totalSizeKB: Math.round(totalSize / 1024),
        expiredCount,
        maxEntries: MAX_CACHE_ENTRIES,
    };
};

export default {
    get: getCachedItem,
    set: setCachedItem,
    cleanup: cleanupExpiredCache,
    enforceLimit: enforceCacheLimit,
    stats: getCacheStats,
};
