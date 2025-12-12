const API_URL = 'https://script.google.com/macros/s/AKfycbzdHh9NfxwTXrtDa41A_2DIhyA32o5OMVg0WxpCNBLYqyF_afPcTqsnSO5cN5t2SKtrPg/exec';

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

    // Get place info
    getPlaceInfo: (query) => new Promise((resolve, reject) => {
        if (!query?.trim()) {
            resolve({ found: false });
            return;
        }

        const cacheKey = `place_${btoa(unescape(encodeURIComponent(query)))}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try { resolve(JSON.parse(cached)); return; } catch { /* ignore */ }
        }

        fetchWithRetry(`${API_URL}?action=getPlaceInfo&query=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'error') throw new Error(json.error?.message);
                const data = json.data;
                try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* ignore */ }
                resolve(data);
            })
            .catch(e => reject(new Error(e.message)));
    }),

    // Get place autocomplete suggestions
    getPlaceAutocomplete: (input) => new Promise((resolve) => {
        if (!input?.trim() || input.length < 2) {
            resolve({ predictions: [] });
            return;
        }

        const cacheKey = `autocomplete_${btoa(unescape(encodeURIComponent(input)))}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try { resolve(JSON.parse(cached)); return; } catch { /* ignore */ }
        }

        fetchWithRetry(`${API_URL}?action=getPlaceAutocomplete&input=${encodeURIComponent(input)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success' && json.data) {
                    try { localStorage.setItem(cacheKey, JSON.stringify(json.data)); } catch { /* ignore */ }
                    resolve(json.data);
                } else {
                    resolve({ predictions: [] });
                }
            })
            .catch(() => resolve({ predictions: [] }));
    }),

    // Get static map image for a location
    getStaticMap: (location) => new Promise((resolve) => {
        if (!location?.trim()) {
            resolve(null);
            return;
        }

        const cacheKey = `staticmap_${btoa(unescape(encodeURIComponent(location)))}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try { resolve(JSON.parse(cached)); return; } catch { /* ignore */ }
        }

        fetchWithRetry(`${API_URL}?action=getStaticMap&location=${encodeURIComponent(location)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success' && json.data?.image) {
                    try { localStorage.setItem(cacheKey, JSON.stringify(json.data.image)); } catch { /* ignore */ }
                    resolve(json.data.image);
                } else {
                    resolve(null);
                }
            })
            .catch(() => resolve(null));
    }),

    // Get route map image between two locations
    getRouteMap: (origin, destination) => new Promise((resolve) => {
        if (!origin?.trim() || !destination?.trim()) {
            console.log('getRouteMap: No origin or destination');
            resolve(null);
            return;
        }

        const cacheKey = `routemap_${btoa(unescape(encodeURIComponent(origin + '|' + destination)))}`;
        const cached = localStorage.getItem(cacheKey); // Change to localStorage
        if (cached) {
            try { resolve(JSON.parse(cached)); return; } catch { /* ignore */ }
        }

        console.log('getRouteMap: Fetching', origin, '->', destination);
        fetchWithRetry(`${API_URL}?action=getRouteMap&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`)
            .then(res => res.json())
            .then(json => {
                console.log('getRouteMap response:', json);
                if (json.status === 'success' && json.data) {
                    try { localStorage.setItem(cacheKey, JSON.stringify(json.data)); } catch { /* ignore */ } // Change to localStorage
                    resolve(json.data);
                } else {
                    console.log('getRouteMap failed:', JSON.stringify(json));
                    resolve(null);
                }
            })
            .catch(err => {
                console.error('getRouteMap fetch error:', err);
                resolve(null);
            });
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
        fetch(`${API_URL}?${params.toString()}`)
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
        fetch(`${API_URL}?${params.toString()}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed to delete day'));
            })
            .catch(reject);
    })
};

export default server;
