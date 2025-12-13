import cache from '../utils/cache';

const API_URL = 'https://script.google.com/macros/s/AKfycbxdqZBzJm-TscH3ed7HsG9jBqK1hBQzCKqgJ1qngz42TERjOqju2jQqu3m1KRw49avX5Q/exec';

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
    PLACE_INFO: 7 * 24 * 60 * 60 * 1000,      // 7 days
    STATIC_MAP: 14 * 24 * 60 * 60 * 1000,     // 14 days
    ROUTE_MAP: 3 * 24 * 60 * 60 * 1000,       // 3 days (routes change more often)
    AUTOCOMPLETE: 1 * 24 * 60 * 60 * 1000,    // 1 day
};

// Helper: Generate safe cache key from query string
const makeCacheKey = (prefix, query) => {
    // Use base64 encoding for safe key generation
    try {
        return `${prefix}_${btoa(encodeURIComponent(query))}`;
    } catch {
        // Fallback for non-ASCII characters
        return `${prefix}_${encodeURIComponent(query).slice(0, 100)}`;
    }
};

// Helper: Decode cache key back to original query
const decodeCacheKey = (key, prefix) => {
    try {
        const encoded = key.replace(`${prefix}_`, '');
        return decodeURIComponent(atob(encoded));
    } catch {
        return null;
    }
};

const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 1000) => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res;
    } catch (err) {
        if (retries > 0) {
            console.warn(`Fetch failed, retrying (${retries} left)...`, err);
            await new Promise(r => setTimeout(r, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw err;
    }
};

const server = {
    // Get itinerary data
    getData: () => new Promise((resolve, reject) => {
        fetchWithRetry(`${API_URL}?action=getData`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'error') throw new Error(json.error?.message || 'Server Error');
                resolve(json.data);
            })
            .catch(e => reject(new Error('Fetch Error: ' + e.message)));
    }),

    // Save itinerary data
    saveData: (data) => new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('data', JSON.stringify(data));
        fetchWithRetry(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: params
        })
            .then(() => resolve({ status: 'success' }))
            .catch(reject);
    }),

    // Update single event field
    updateEventField: (date, name, field, value) => new Promise((resolve, reject) => {
        const params = new URLSearchParams({ action: 'updateEvent', date, name, field, value });
        fetchWithRetry(`${API_URL}?${params.toString()}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Update failed'));
            })
            .catch(reject);
    }),

    // Validate passcode
    validatePasscode: (code) => new Promise((resolve) => {
        fetchWithRetry(`${API_URL}?action=validatePasscode&code=${encodeURIComponent(code)}`)
            .then(res => res.json())
            .then(json => resolve(json.status === 'success' && json.data.valid === true))
            .catch(() => resolve(false));
    }),

    // Get place info (with TTL cache)
    getPlaceInfo: (query) => new Promise((resolve, reject) => {
        if (!query?.trim()) {
            resolve({ found: false });
            return;
        }

        const cacheKey = makeCacheKey('place', query);
        const cached = cache.get(cacheKey);
        if (cached) {
            resolve(cached);
            return;
        }

        fetchWithRetry(`${API_URL}?action=getPlaceInfo&query=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'error') throw new Error(json.error?.message);
                const data = json.data;
                cache.set(cacheKey, data, CACHE_TTL.PLACE_INFO);
                resolve(data);
            })
            .catch(e => reject(new Error(e.message)));
    }),

    // Get place autocomplete suggestions (with TTL cache)
    getPlaceAutocomplete: (input) => new Promise((resolve) => {
        if (!input?.trim() || input.trim().length < 2) {
            resolve({ predictions: [] });
            return;
        }

        const cacheKey = makeCacheKey('autocomplete', input);
        const cached = cache.get(cacheKey);
        if (cached) {
            resolve(cached);
            return;
        }

        fetchWithRetry(`${API_URL}?action=getPlaceAutocomplete&input=${encodeURIComponent(input)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success' && json.data) {
                    cache.set(cacheKey, json.data, CACHE_TTL.AUTOCOMPLETE);
                    resolve(json.data);
                } else {
                    resolve({ predictions: [] });
                }
            })
            .catch(() => resolve({ predictions: [] }));
    }),

    // Get static map image for a location (with TTL cache)
    getStaticMap: (location) => new Promise((resolve) => {
        if (!location?.trim()) {
            resolve(null);
            return;
        }

        const cacheKey = makeCacheKey('staticmap', location);
        const cached = cache.get(cacheKey);
        if (cached) {
            resolve(cached);
            return;
        }

        fetchWithRetry(`${API_URL}?action=getStaticMap&location=${encodeURIComponent(location)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success' && json.data?.image) {
                    cache.set(cacheKey, json.data.image, CACHE_TTL.STATIC_MAP);
                    resolve(json.data.image);
                } else {
                    resolve(null);
                }
            })
            .catch(() => resolve(null));
    }),

    // Get route map image between two locations (with TTL cache)
    getRouteMap: (origin, destination) => new Promise((resolve) => {
        if (!origin?.trim() || !destination?.trim()) {
            resolve(null);
            return;
        }

        const cacheKey = makeCacheKey('routemap', `${origin}|${destination}`);
        const cached = cache.get(cacheKey);
        if (cached) {
            resolve(cached);
            return;
        }

        fetchWithRetry(`${API_URL}?action=getRouteMap&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success' && json.data) {
                    cache.set(cacheKey, json.data, CACHE_TTL.ROUTE_MAP);
                    resolve(json.data);
                } else {
                    resolve(null);
                }
            })
            .catch(() => resolve(null));
    }),

    // Upload Events CSV
    uploadEvents: (csvData) => new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('action', 'uploadEvents');
        params.append('data', csvData);
        fetchWithRetry(API_URL, {
            method: 'POST',
            body: params
        })
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Upload failed'));
            })
            .catch(reject);
    }),

    // Packing list operations
    getPackingList: () => new Promise((resolve) => {
        fetchWithRetry(`${API_URL}?action=getPackingList`)
            .then(res => res.json())
            .then(json => resolve(json.status === 'success' ? json.data : []))
            .catch(() => resolve([]));
    }),

    updatePackingItem: (item) => new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            action: 'updatePackingItem',
            id: item.id || '',
            name: item.name,
            category: item.category,
            isShared: item.isShared,
            assignee: item.assignee || '',
            isChecked: item.isChecked
        });
        fetchWithRetry(`${API_URL}?${params.toString()}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed'));
            })
            .catch(reject);
    }),

    deletePackingItem: (id) => new Promise((resolve, reject) => {
        fetchWithRetry(`${API_URL}?action=deletePackingItem&id=${encodeURIComponent(id)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve({ success: true });
                else reject(new Error(json.error?.message || 'Failed'));
            })
            .catch(reject);
    }),

    // ============================================================================
    // PERFORMANCE OPTIMIZED APIs
    // ============================================================================

    // Batch update multiple events (much faster than saveData)
    batchUpdateEvents: (updates) => new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('action', 'batchUpdateEvents');
        params.append('updates', JSON.stringify(updates));
        fetchWithRetry(API_URL, {
            method: 'POST',
            body: params
        })
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Update failed'));
            })
            .catch(reject);
    }),

    // Add a new event to a specific date
    addEvent: (eventData) => new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('action', 'addEvent');
        params.append('eventData', JSON.stringify(eventData));
        fetchWithRetry(API_URL, {
            method: 'POST',
            body: params
        })
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed to add event'));
            })
            .catch(reject);
    }),

    // Delete a specific event
    deleteEvent: (date, eventId) => new Promise((resolve, reject) => {
        const params = new URLSearchParams({ action: 'deleteEvent', date, eventId });
        fetchWithRetry(`${API_URL}?${params.toString()}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed to delete event'));
            })
            .catch(reject);
    }),

    // Batch update multiple packing items
    batchUpdatePackingItems: (items) => new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('action', 'batchUpdatePackingItems');
        params.append('items', JSON.stringify(items));
        fetchWithRetry(API_URL, {
            method: 'POST',
            body: params
        })
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed to update items'));
            })
            .catch(reject);
    }),

    // Move an event to a different date/time
    moveEvent: (eventData) => new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('action', 'moveEvent');
        params.append('eventData', JSON.stringify(eventData));
        fetchWithRetry(`${API_URL}?${params.toString()}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed to move event'));
            })
            .catch(reject);
    }),

    // Delete all events for a specific date (day deletion)
    deleteEventsByDate: (date) => new Promise((resolve, reject) => {
        const params = new URLSearchParams({ action: 'deleteEventsByDate', date });
        fetchWithRetry(`${API_URL}?${params.toString()}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed to delete day'));
            })
            .catch(reject);
    }),

    // ============================================================================
    // CACHE MANAGEMENT
    // ============================================================================

    /**
     * Invalidate caches for a location (when location name changes)
     * Call this when editing an event's name, to, or from fields
     */
    invalidateLocationCache: (location) => {
        if (!location?.trim()) return;

        const prefixes = ['place_', 'staticmap_', 'routemap_', 'autocomplete_'];
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            for (const prefix of prefixes) {
                if (key.startsWith(prefix)) {
                    const decoded = decodeCacheKey(key, prefix.slice(0, -1));
                    if (decoded && decoded.includes(location)) {
                        keysToRemove.push(key);
                    }
                    break;
                }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        if (keysToRemove.length > 0) {
            console.log(`Cache invalidated for "${location}": ${keysToRemove.length} items removed`);
        }
    },

    /**
     * Clear all app caches (for settings/emergency use)
     */
    clearAllCaches: () => {
        const removed = cache.cleanup();
        cache.enforceLimit();
        return removed;
    },

    /**
     * Get cache statistics
     */
    getCacheStats: () => cache.stats(),

    /**
     * Run cache maintenance (cleanup expired + enforce limit)
     */
    maintainCache: () => {
        cache.cleanup();
        cache.enforceLimit();
    }
};

export default server;
