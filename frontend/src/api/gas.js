const API_URL = 'https://script.google.com/macros/s/AKfycbyVmdxEnX8UCokHiRjda-jJ7SAexeRywQs7Cz_f80x9W0MHHiNwDAV0AVeNMrMVlVnPLw/exec';

const server = {
    // Get itinerary data
    getData: () => new Promise((resolve, reject) => {
        fetch(`${API_URL}?action=getData`)
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
        fetch(API_URL, {
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
        fetch(`${API_URL}?${params.toString()}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Update failed'));
            })
            .catch(reject);
    }),

    // Validate passcode
    validatePasscode: (code) => new Promise((resolve) => {
        fetch(`${API_URL}?action=validatePasscode&code=${encodeURIComponent(code)}`)
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
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try { resolve(JSON.parse(cached)); return; } catch (e) { }
        }

        fetch(`${API_URL}?action=getPlaceInfo&query=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'error') throw new Error(json.error?.message);
                const data = json.data;
                try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) { }
                resolve(data);
            })
            .catch(e => reject(new Error(e.message)));
    }),



    // Upload Events CSV
    uploadEvents: (csvData) => new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('action', 'uploadEvents');
        params.append('data', csvData);
        fetch(API_URL, {
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

    // Get weather data
    getWeather: (date, location) => new Promise((resolve) => {
        if (!date || !location) {
            resolve({ error: 'Missing date or location' });
            return;
        }

        const cacheKey = `weather_${date}_${btoa(unescape(encodeURIComponent(location)))}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            try { resolve(JSON.parse(cached)); return; } catch (e) { }
        }

        fetch(`${API_URL}?action=getWeather&date=${encodeURIComponent(date)}&location=${encodeURIComponent(location)}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success' && json.data) {
                    try { sessionStorage.setItem(cacheKey, JSON.stringify(json.data)); } catch (e) { }
                    resolve(json.data);
                } else {
                    resolve({ error: json.error?.message || 'Failed to get weather' });
                }
            })
            .catch(e => resolve({ error: e.message }));
    }),

    // Packing list operations
    getPackingList: () => new Promise((resolve) => {
        fetch(`${API_URL}?action=getPackingList`)
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
        fetch(`${API_URL}?${params.toString()}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed'));
            })
            .catch(reject);
    }),

    deletePackingItem: (id) => new Promise((resolve, reject) => {
        fetch(`${API_URL}?action=deletePackingItem&id=${encodeURIComponent(id)}`)
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
        fetch(API_URL, {
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
        fetch(API_URL, {
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
        fetch(`${API_URL}?${params.toString()}`)
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed to delete event'));
            })
            .catch(reject);
    }),

    // Update a single day's metadata
    updateDay: (dayData) => new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('action', 'updateDay');
        params.append('dayData', JSON.stringify(dayData));
        fetch(API_URL, {
            method: 'POST',
            body: params
        })
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed to update day'));
            })
            .catch(reject);
    }),

    // Batch update multiple packing items
    batchUpdatePackingItems: (items) => new Promise((resolve, reject) => {
        const params = new URLSearchParams();
        params.append('action', 'batchUpdatePackingItems');
        params.append('items', JSON.stringify(items));
        fetch(API_URL, {
            method: 'POST',
            body: params
        })
            .then(res => res.json())
            .then(json => {
                if (json.status === 'success') resolve(json.data);
                else reject(new Error(json.error?.message || 'Failed to update items'));
            })
            .catch(reject);
    })
};

export default server;
