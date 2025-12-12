// Read from Script Properties for environment-specific configuration
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const DAYS_SHEET = 'days';
const EVENTS_SHEET = 'events';
const PACKING_SHEET = 'packing_list';

/**
 * Helper to get spreadsheet instance with fallback
 */
function getSpreadsheet() {
    if (SPREADSHEET_ID) {
        try {
            return SpreadsheetApp.openById(SPREADSHEET_ID);
        } catch (e) {
            console.warn('Failed to open by ID, trying active spreadsheet', e);
        }
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Spreadsheet not found. Please set SPREADSHEET_ID script property or bind script to sheet.');
    return ss;
}

/**
 * Convert cell value to string (handles Date objects, numbers, etc.)
 * GAS Date handling:
 * - Date values: Year >= 2000 -> format as M/D
 * - Time values: Year is 1899/1900 (GAS time-only base date) -> format as HH:MM
 */
function toString(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (value instanceof Date) {
        const year = value.getFullYear();

        // GAS represents time-only values with base date 1899-12-30 or 1900-01-01
        if (year <= 1900) {
            // This is a time-only value - use formatDate with JST timezone
            return Utilities.formatDate(value, 'Asia/Tokyo', 'HH:mm');
        }

        // This is a date value
        return Utilities.formatDate(value, 'Asia/Tokyo', 'M/d');
    }
    return String(value);
}

// ============================================================================
// API ROUTER & HANDLERS
// ============================================================================

function createApiResponse(status, data = null, error = null) {
    const response = { status };
    if (status === 'success') response.data = data;
    if (status === 'error') response.error = error;
    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}

function handleGetData() {
    try {
        const data = getItineraryData();
        return createApiResponse('success', data);
    } catch (err) {
        return createApiResponse('error', null, { message: 'Failed to fetch data: ' + err.toString() });
    }
}

function doGet(e) {
    try {
        const action = e?.parameter?.action;

        switch (action) {
            case 'getData':
                return handleGetData();
            case 'validatePasscode':
                return handleValidatePasscode(e);
            case 'getPlaceInfo':
                return handleGetPlaceInfo(e);
            case 'getPlaceAutocomplete':
                return handleGetPlaceAutocomplete(e);
            case 'updateEvent':
                return handleUpdateEvent(e);
            case 'fixTimeData':
                const fixResult = fixTimeData();
                return createApiResponse('success', fixResult);

            case 'uploadEvents':
                return handleUploadEvents(e);
            case 'getPackingList':
                return createApiResponse('success', getPackingList());
            case 'updatePackingItem':
                return handleUpdatePackingItem(e);
            case 'deletePackingItem':
                deletePackingItem(e.parameter.id);
                return createApiResponse('success');
            case 'batchUpdatePackingItems':
                return handleBatchUpdatePackingItems(e);
            case 'batchUpdateEvents':
                return handleBatchUpdateEvents(e);
            case 'addEvent':
                return handleAddEvent(e);
            case 'deleteEvent':
                return handleDeleteEvent(e);
            case 'deleteEventsByDate':
                return handleDeleteEventsByDate(e);
            case 'moveEvent':
                return handleMoveEvent(e);
            case 'getStaticMap':
                return handleGetStaticMap(e);
            case 'getRouteMap':
                return handleGetRouteMap(e);
            default:
                const FRONTEND_URL = 'https://atariryuma.github.io/winter-trip-app/';
                return HtmlService.createHtmlOutput(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="refresh" content="0; url=${FRONTEND_URL}">
                    </head>
                    <body><p>Redirecting to app...</p></body>
                    </html>
                `);
        }
    } catch (err) {
        return createApiResponse('error', null, { message: err.toString() });
    }
}

function doPost(e) {
    try {
        const action = e.parameter?.action;

        // Route incremental update APIs
        switch (action) {
            case 'batchUpdateEvents':
                return handleBatchUpdateEvents(e);
            case 'addEvent':
                return handleAddEvent(e);
            case 'batchUpdatePackingItems':
                return handleBatchUpdatePackingItems(e);
            case 'uploadEvents':
                return handleUploadEvents(e);
        }

        // Default: save itinerary data (full save)
        let jsonString;
        if (e.parameter?.data) {
            jsonString = e.parameter.data;
        } else if (e.postData) {
            jsonString = e.postData.contents;
        }

        if (!jsonString) throw new Error('No valid post data found');

        const data = JSON.parse(jsonString);
        saveItineraryData(data);

        const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
        PropertiesService.getScriptProperties().setProperty('lastUpdate', timestamp);

        CacheService.getScriptCache().remove('itinerary_json');

        return createApiResponse('success', { message: 'Saved', lastUpdate: timestamp });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

// ============================================================================
// DATA FIX: Convert Date objects in time columns to HH:MM format
// ============================================================================

/**
 * Fix time data in events sheet - converts Date objects to HH:MM strings
 * Call via API: ?action=fixTimeData
 */
function fixTimeData() {
    const ss = getSpreadsheet();
    const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

    if (!eventsSheet) {
        return { fixed: 0, error: 'Events sheet not found' };
    }

    const lastRow = eventsSheet.getLastRow();
    if (lastRow < 2) {
        return { fixed: 0, message: 'No data to fix' };
    }

    // Get time and endTime columns (columns 5 and 6)
    const timeRange = eventsSheet.getRange(2, 5, lastRow - 1, 2);
    const timeData = timeRange.getValues();
    let fixedCount = 0;

    const fixedData = timeData.map(row => {
        return row.map(cell => {
            if (cell instanceof Date) {
                // Convert Date to HH:MM format using JST
                fixedCount++;
                return Utilities.formatDate(cell, 'Asia/Tokyo', 'HH:mm');
            }
            return cell;
        });
    });

    // Write back the fixed data
    timeRange.setValues(fixedData);

    // Also fix the date column (column 1) - convert to M/D format
    const dateRange = eventsSheet.getRange(2, 1, lastRow - 1, 1);
    const dateData = dateRange.getValues();
    let dateFixedCount = 0;

    const fixedDates = dateData.map(row => {
        const cell = row[0];
        if (cell instanceof Date) {
            const month = cell.getMonth() + 1;
            const day = cell.getDate();
            dateFixedCount++;
            return [`${month}/${day}`];
        }
        return row;
    });

    dateRange.setValues(fixedDates);

    // Also fix days sheet date column
    const daysSheet = ss.getSheetByName(DAYS_SHEET);
    if (daysSheet) {
        const daysLastRow = daysSheet.getLastRow();
        if (daysLastRow > 1) {
            const daysDateRange = daysSheet.getRange(2, 1, daysLastRow - 1, 1);
            const daysDateData = daysDateRange.getValues();

            const fixedDaysDates = daysDateData.map(row => {
                const cell = row[0];
                if (cell instanceof Date) {
                    const month = cell.getMonth() + 1;
                    const day = cell.getDate();
                    return [`${month}/${day}`];
                }
                return row;
            });

            daysDateRange.setValues(fixedDaysDates);
        }
    }

    // Clear cache
    CacheService.getScriptCache().remove('itinerary_json');

    return {
        fixed: fixedCount,
        datesFixed: dateFixedCount,
        message: `Fixed ${fixedCount} time values and ${dateFixedCount} date values`
    };
}

// ============================================================================
// CSV UPLOAD HANDLERS
// ============================================================================

/**
 * Handle Events CSV upload - overwrites events sheet
 */
function handleUploadEvents(e) {
    try {
        const csvData = e.parameter.data;
        if (!csvData) {
            return createApiResponse('error', null, { message: 'No CSV data provided' });
        }

        const rows = parseCSV(csvData);
        if (rows.length < 2) {
            return createApiResponse('error', null, { message: 'CSV must have header and at least one row' });
        }

        const ss = getSpreadsheet();
        const sheet = ss.getSheetByName(EVENTS_SHEET);

        if (!sheet) {
            return createApiResponse('error', null, { message: 'Events sheet not found' });
        }

        // Clear existing data (except header)
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
            sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        }

        // Write new data (skip header from CSV, use existing header)
        // Prepend ' to time columns (5, 6) to prevent auto-date conversion
        const dataRows = rows.slice(1).filter(row => row[0]).map(row => {
            return row.map((cell, idx) => {
                // Column 5 (time) and 6 (endTime) - 0-indexed: 4 and 5
                if ((idx === 4 || idx === 5) && cell && /^\d{1,2}:\d{2}$/.test(cell)) {
                    return "'" + cell;
                }
                return cell;
            });
        });

        if (dataRows.length > 0) {
            sheet.getRange(2, 1, dataRows.length, dataRows[0].length).setValues(dataRows);
        }

        CacheService.getScriptCache().remove('itinerary_json');

        return createApiResponse('success', {
            uploaded: dataRows.length,
            message: `Uploaded ${dataRows.length} events`
        });
    } catch (err) {
        return createApiResponse('error', null, { message: err.toString() });
    }
}

/**
 * Parse CSV string into 2D array
 */
function parseCSV(csvString) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvString.length; i++) {
        const char = csvString[i];
        const nextChar = csvString[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
            if (char === '\r') i++; // Skip \n after \r
        } else if (char === '\r' && !inQuotes) {
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }

    // Handle last cell/row
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    return rows;
}

// ============================================================================
// DATA OPERATIONS
// ============================================================================

/**
 * Get itinerary data - derives days from events only (no days sheet required)
 */
function getItineraryData() {
    const cache = CacheService.getScriptCache();

    try {
        const cached = cache.get('itinerary_json');
        if (cached) return JSON.parse(cached);
    } catch (e) { }

    const ss = getSpreadsheet();
    const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

    if (!eventsSheet) {
        throw new Error('Events sheet not found');
    }

    // Read events
    const eventsLastRow = eventsSheet.getLastRow();
    const eventsData = eventsLastRow > 1
        ? eventsSheet.getRange(2, 1, eventsLastRow - 1, 12).getValues()
        : [];

    // Helper: Get day of week from date string (M/D format)
    const getDayOfWeek = (dateStr) => {
        const [month, day] = dateStr.split('/').map(Number);
        const now = new Date();
        const year = now.getFullYear();
        // Determine year: if month is past current month, use next year
        const targetYear = (month < now.getMonth() + 1) ? year + 1 : year;
        const date = new Date(targetYear, month - 1, day);
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        return days[date.getDay()];
    };

    // Build days map from events (derive days dynamically)
    const daysMap = {};
    const mapLocations = [];

    // Process events and create days on-the-fly
    eventsData.forEach((row, idx) => {
        const [date, type, category, name, time, endTime, from, to, status, bookingRef, memo, budget] = row;
        const dateStr = toString(date);

        if (!dateStr) return;

        // Create day if not exists
        if (!daysMap[dateStr]) {
            daysMap[dateStr] = {
                id: `day-${dateStr.replace('/', '-')}`,
                date: dateStr,
                dayOfWeek: getDayOfWeek(dateStr),
                title: '',
                summary: '',
                theme: 'default',
                weather: null,
                events: []
            };
        }

        let budgetAmount = '', budgetPaidBy = '';
        if (budget && toString(budget).includes('/')) {
            const parts = toString(budget).split('/');
            budgetAmount = parts[0];
            budgetPaidBy = parts[1] || '';
        }

        const event = {
            id: `e-${dateStr.replace('/', '-')}-${idx}`,
            type: toString(type),
            category: toString(category),
            name: toString(name),
            time: toString(time),
            endTime: toString(endTime),
            from: toString(from),
            to: toString(to),
            status: toString(status) || 'planned',
            bookingRef: toString(bookingRef),
            details: toString(memo),
            budgetAmount,
            budgetPaidBy
        };

        if (type === 'stay') {
            event.checkIn = toString(time);
        }

        if (from) mapLocations.push(toString(from));
        if (to) mapLocations.push(toString(to));
        if (type === 'stay' && name) mapLocations.push(toString(name));

        daysMap[dateStr].events.push(event);
    });

    // Sort events by time within each day
    Object.values(daysMap).forEach(day => {
        day.events.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
    });

    // Sort days by date (consider year boundary: Dec before Jan)
    const sortedDays = Object.values(daysMap).sort((a, b) => {
        const [aMonth, aDay] = a.date.split('/').map(Number);
        const [bMonth, bDay] = b.date.split('/').map(Number);

        // Handle year boundary: December (10-12) should come before January (1-3)
        // Assume trips don't span more than a few months
        const aIsLateYear = aMonth >= 10; // Oct-Dec
        const bIsLateYear = bMonth >= 10;

        if (aIsLateYear && !bIsLateYear) return -1; // a is Dec, b is Jan → a first
        if (!aIsLateYear && bIsLateYear) return 1;  // a is Jan, b is Dec → b first

        // Same year period, sort by month then day
        if (aMonth !== bMonth) return aMonth - bMonth;
        return aDay - bDay;
    });

    // Generate map
    let mapUrl = null, mapError = null;
    try {
        const uniqueLocations = [...new Set(mapLocations)].filter(l => l && l.trim());
        if (uniqueLocations.length > 0) {
            mapUrl = generateStaticMapUrl(uniqueLocations.slice(0, 15));
        }
    } catch (e) {
        mapError = e.toString();
    }

    const result = {
        days: sortedDays,
        mapUrl,
        mapError,
        lastUpdate: PropertiesService.getScriptProperties().getProperty('lastUpdate') || null
    };

    try {
        cache.put('itinerary_json', JSON.stringify(result), 3600);
    } catch (e) { }

    return result;
}

/**
 * Save itinerary data to sheets
 */
function saveItineraryData(data) {
    const ss = getSpreadsheet();

    const daysData = data.map(day => [
        day.date,
        day.dayOfWeek,
        day.title,
        day.summary || '',
        day.theme || 'default'
    ]);

    const eventsData = [];
    data.forEach(day => {
        (day.events || []).forEach(event => {
            const budget = event.budgetAmount
                ? `${event.budgetAmount}/${event.budgetPaidBy || ''}`
                : '';

            eventsData.push([
                day.date,
                event.type,
                event.category,
                event.name,
                event.time || '',
                event.endTime || '',
                event.from || event.place || '',
                event.to || '',
                event.status || 'planned',
                event.bookingRef || '',
                event.details || '',
                budget
            ]);
        });
    });

    let daysSheet = ss.getSheetByName(DAYS_SHEET);
    if (!daysSheet) {
        daysSheet = ss.insertSheet(DAYS_SHEET);
        daysSheet.appendRow(['date', 'dayOfWeek', 'title', 'summary', 'theme']);
    } else if (daysSheet.getLastRow() > 1) {
        daysSheet.getRange(2, 1, daysSheet.getLastRow() - 1, 5).clearContent();
    }

    let eventsSheet = ss.getSheetByName(EVENTS_SHEET);
    if (!eventsSheet) {
        eventsSheet = ss.insertSheet(EVENTS_SHEET);
        eventsSheet.appendRow(['date', 'type', 'category', 'name', 'time', 'endTime', 'from', 'to', 'status', 'bookingRef', 'memo', 'budget']);
    } else if (eventsSheet.getLastRow() > 1) {
        eventsSheet.getRange(2, 1, eventsSheet.getLastRow() - 1, 12).clearContent();
    }

    if (daysData.length > 0) {
        daysSheet.getRange(2, 1, daysData.length, 5).setValues(daysData);
    }
    if (eventsData.length > 0) {
        eventsSheet.getRange(2, 1, eventsData.length, 12).setValues(eventsData);
    }
}

// ============================================================================
// PLACES API
// ============================================================================

function handleGetPlaceAutocomplete(e) {
    const input = e.parameter.input || '';
    if (!input) return createApiResponse('error', null, { message: 'No input provided' });
    return createApiResponse('success', getPlaceAutocomplete(input));
}

/**
 * Get place autocomplete suggestions using Google Places API (New)
 * Returns array of suggestions with description and placeId
 */
function getPlaceAutocomplete(input) {
    if (!input || input.trim() === '' || input.length < 2) {
        return { predictions: [] };
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = 'autocomplete_' + Utilities.base64Encode(Utilities.newBlob(input).getBytes());

    try {
        const cached = cache.get(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch (e) { }

    const API_KEY = PropertiesService.getScriptProperties().getProperty('GOOGLE_MAPS_API_KEY');

    if (!API_KEY) {
        return { predictions: [], error: 'API key not configured' };
    }

    try {
        const autocompleteUrl = 'https://places.googleapis.com/v1/places:autocomplete';
        const payload = {
            input: input,
            languageCode: 'ja',
            regionCode: 'JP',
            locationBias: {
                circle: {
                    center: { latitude: 36.0, longitude: 138.0 },
                    radius: 800000.0
                }
            }
        };

        const response = UrlFetchApp.fetch(autocompleteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': API_KEY
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        });

        if (response.getResponseCode() === 200) {
            const data = JSON.parse(response.getContentText());

            const result = {
                predictions: (data.suggestions || []).map(s => ({
                    description: s.placePrediction?.text?.text || s.placePrediction?.structuredFormat?.mainText?.text || '',
                    placeId: s.placePrediction?.placeId || null
                })).filter(p => p.description)
            };

            // Cache for 1 hour
            try {
                cache.put(cacheKey, JSON.stringify(result), 3600);
            } catch (e) { }

            return result;
        } else {
            Logger.log('Autocomplete API error: ' + response.getContentText());
            return { predictions: [], error: 'API request failed' };
        }
    } catch (e) {
        Logger.log('Autocomplete error: ' + e);
        return { predictions: [], error: e.toString() };
    }
}

function handleGetPlaceInfo(e) {
    const query = e.parameter.query || '';
    if (!query) return createApiResponse('error', null, { message: 'No query provided' });
    return createApiResponse('success', getPlaceInfo(query));
}

function getPlaceInfo(query) {
    if (!query || query.trim() === '') {
        return { found: false };
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = 'place_v3_' + Utilities.base64Encode(Utilities.newBlob(query).getBytes());

    // 1. Try Script Cache (Memory - Fast)
    try {
        const cached = cache.get(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch (e) { }

    // 2. Try Sheet Cache (Persistent)
    const sheetCached = getPlaceFromSheetCache(query);
    if (sheetCached) {
        // Warm up script cache
        try { cache.put(cacheKey, JSON.stringify(sheetCached), 43200); } catch (e) { }
        return sheetCached;
    }

    const API_KEY = PropertiesService.getScriptProperties().getProperty('GOOGLE_MAPS_API_KEY');

    let placeInfo = {
        found: true,
        name: query,
        formattedAddress: '',
        phone: null,
        website: null,
        rating: null,
        userRatingCount: null,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
        source: 'geocoding'
    };

    if (API_KEY) {
        try {
            const textSearchUrl = 'https://places.googleapis.com/v1/places:searchText';
            const searchPayload = {
                textQuery: query,
                languageCode: 'ja',
                regionCode: 'JP',
                locationBias: {
                    circle: { center: { latitude: 36.0, longitude: 138.0 }, radius: 800000.0 }
                },
                maxResultCount: 1
            };

            const fieldMask = [
                'places.id', 'places.displayName', 'places.formattedAddress',
                'places.googleMapsUri', 'places.nationalPhoneNumber', 'places.websiteUri',
                'places.rating', 'places.userRatingCount', 'places.photos'
            ].join(',');

            const response = UrlFetchApp.fetch(textSearchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': API_KEY,
                    'X-Goog-FieldMask': fieldMask
                },
                payload: JSON.stringify(searchPayload),
                muteHttpExceptions: true
            });

            if (response.getResponseCode() === 200) {
                const data = JSON.parse(response.getContentText());
                if (data.places && data.places.length > 0) {
                    const place = data.places[0];
                    placeInfo = {
                        found: true,
                        source: 'places_api',
                        placeId: place.id,
                        name: place.displayName?.text || query,
                        formattedAddress: place.formattedAddress || '',
                        phone: place.nationalPhoneNumber || null,
                        website: place.websiteUri || null,
                        rating: place.rating || null,
                        userRatingCount: place.userRatingCount || null,
                        mapsUrl: place.googleMapsUri || placeInfo.mapsUrl,
                        photoUrl: place.photos?.[0]?.name
                            ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=300&maxWidthPx=400&key=${API_KEY}`
                            : null
                    };
                }
            }
        } catch (e) {
            Logger.log('Places API error: ' + e);
        }
    }

    // Fallback to geocoding
    if (!placeInfo.formattedAddress) {
        try {
            const geo = Maps.newGeocoder().setLanguage('ja').setRegion('jp').geocode(query);
            if (geo.status === 'OK' && geo.results.length) {
                placeInfo.formattedAddress = geo.results[0].formatted_address;
                placeInfo.source = 'geocoding';
            }
        } catch (e) { }
    }

    if (!placeInfo.formattedAddress) {
        placeInfo.found = false;
    }

    // Save to caches
    try {
        cache.put(cacheKey, JSON.stringify(placeInfo), 43200);
    } catch (e) { }

    // Save to persistent sheet cache
    if (placeInfo.found) {
        try { saveToPlaceSheetCache(query, placeInfo); } catch (e) { }
    }

    return placeInfo;
}

// ============================================================================
// INCREMENTAL UPDATE APIs (Performance Optimization)
// ============================================================================

/**
 * Batch update multiple events - true batch processing (single write)
 * GAS Best Practice: Read all → Modify in memory → Write all once
 */
function handleBatchUpdateEvents(e) {
    try {
        const updates = JSON.parse(e.parameter.updates || e.postData?.contents);
        if (!updates || !Array.isArray(updates)) {
            return createApiResponse('error', null, { message: 'Invalid updates format' });
        }

        const ss = getSpreadsheet();
        const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

        if (!eventsSheet) {
            return createApiResponse('error', null, { message: 'Events sheet not found' });
        }

        const lastRow = eventsSheet.getLastRow();
        if (lastRow < 2) {
            return createApiResponse('error', null, { message: 'No data to update' });
        }

        // 1. Batch read: Get all data once
        const allData = eventsSheet.getRange(2, 1, lastRow - 1, 12).getValues();
        let updateCount = 0;
        let modified = false;

        // 2. Modify in memory
        updates.forEach(update => {
            const { date, eventId, eventData } = update;

            // Find the row index
            const rowIndex = allData.findIndex((row) => {
                const rowDate = toString(row[0]);
                const rowName = toString(row[3]);
                return rowDate === date && (eventId ? rowName === eventId : true);
            });

            if (rowIndex !== -1) {
                // Update the event data in memory
                const budget = eventData.budgetAmount
                    ? `${eventData.budgetAmount}/${eventData.budgetPaidBy || ''}`
                    : '';

                allData[rowIndex] = [
                    date,
                    eventData.type || allData[rowIndex][1],
                    eventData.category || allData[rowIndex][2],
                    eventData.name || allData[rowIndex][3],
                    eventData.time || allData[rowIndex][4],
                    eventData.endTime || allData[rowIndex][5],
                    eventData.from || eventData.place || allData[rowIndex][6],
                    eventData.to || allData[rowIndex][7],
                    eventData.status || allData[rowIndex][8],
                    eventData.bookingRef !== undefined ? eventData.bookingRef : allData[rowIndex][9],
                    eventData.details !== undefined ? eventData.details : allData[rowIndex][10],
                    budget || allData[rowIndex][11]
                ];
                updateCount++;
                modified = true;
            }
        });

        // 3. Batch write: Write all data back in a single call
        if (modified) {
            eventsSheet.getRange(2, 1, allData.length, 12).setValues(allData);
        }

        // Invalidate cache
        CacheService.getScriptCache().remove('itinerary_json');

        return createApiResponse('success', { updated: updateCount });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

/**
 * Add a new event to a specific date
 */
function handleAddEvent(e) {
    try {
        const eventData = JSON.parse(e.parameter.eventData || e.postData?.contents);
        const { date } = eventData;

        if (!date) {
            return createApiResponse('error', null, { message: 'Date is required' });
        }

        const ss = getSpreadsheet();
        const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

        if (!eventsSheet) {
            return createApiResponse('error', null, { message: 'Events sheet not found' });
        }

        const budget = eventData.budgetAmount
            ? `${eventData.budgetAmount}/${eventData.budgetPaidBy || ''}`
            : '';

        const rowData = [
            date,
            eventData.type || '',
            eventData.category || '',
            eventData.name || '',
            eventData.time || '',
            eventData.endTime || '',
            eventData.from || eventData.place || '',
            eventData.to || '',
            eventData.status || 'planned',
            eventData.bookingRef || '',
            eventData.details || '',
            budget
        ];

        // Append row (fast operation)
        eventsSheet.appendRow(rowData);

        // Invalidate cache
        CacheService.getScriptCache().remove('itinerary_json');

        return createApiResponse('success', { message: 'Event added' });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

/**
 * Delete a specific event
 */
function handleDeleteEvent(e) {
    try {
        const date = e.parameter.date;
        const eventId = e.parameter.eventId; // event name

        if (!date || !eventId) {
            return createApiResponse('error', null, { message: 'Date and eventId required' });
        }

        const ss = getSpreadsheet();
        const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

        if (!eventsSheet) {
            return createApiResponse('error', null, { message: 'Events sheet not found' });
        }

        const lastRow = eventsSheet.getLastRow();
        if (lastRow < 2) {
            return createApiResponse('error', null, { message: 'No data' });
        }

        // Find the row to delete
        const data = eventsSheet.getRange(2, 1, lastRow - 1, 4).getValues();

        for (let i = 0; i < data.length; i++) {
            if (toString(data[i][0]) === date && toString(data[i][3]) === eventId) {
                eventsSheet.deleteRow(i + 2);

                // Invalidate cache
                CacheService.getScriptCache().remove('itinerary_json');

                return createApiResponse('success', { message: 'Event deleted' });
            }
        }

        return createApiResponse('error', null, { message: 'Event not found' });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

/**
 * Delete all events for a specific date (day deletion)
 */
function handleDeleteEventsByDate(e) {
    try {
        const date = e.parameter.date;

        if (!date) {
            return createApiResponse('error', null, { message: 'Date is required' });
        }

        const ss = getSpreadsheet();
        const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

        if (!eventsSheet) {
            return createApiResponse('error', null, { message: 'Events sheet not found' });
        }

        const lastRow = eventsSheet.getLastRow();
        if (lastRow < 2) {
            return createApiResponse('success', { message: 'No events to delete', deletedCount: 0 });
        }

        // Find all rows to delete (iterate backwards to avoid index shifting)
        const data = eventsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
        let deletedCount = 0;

        for (let i = data.length - 1; i >= 0; i--) {
            if (toString(data[i][0]) === date) {
                eventsSheet.deleteRow(i + 2);
                deletedCount++;
            }
        }

        // Invalidate cache
        CacheService.getScriptCache().remove('itinerary_json');

        return createApiResponse('success', { message: `Deleted ${deletedCount} events`, deletedCount });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

/**
 * Move an event to a different date and/or time
 */
function handleMoveEvent(e) {
    try {
        const eventData = JSON.parse(e.parameter.eventData || e.postData?.contents);
        const { originalDate, eventId, newDate, newStartTime, newEndTime } = eventData;

        if (!originalDate || !eventId || !newDate) {
            return createApiResponse('error', null, { message: 'originalDate, eventId, and newDate are required' });
        }

        const ss = getSpreadsheet();
        const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

        if (!eventsSheet) {
            return createApiResponse('error', null, { message: 'Events sheet not found' });
        }

        const lastRow = eventsSheet.getLastRow();
        if (lastRow < 2) {
            return createApiResponse('error', null, { message: 'No data' });
        }

        // Find the event to update (columns: date, startTime, endTime, name)
        const data = eventsSheet.getRange(2, 1, lastRow - 1, 4).getValues();

        for (let i = 0; i < data.length; i++) {
            if (toString(data[i][0]) === originalDate && toString(data[i][3]) === eventId) {
                const rowIndex = i + 2;

                // Update date (column 1)
                eventsSheet.getRange(rowIndex, 1).setValue(newDate);

                // Update start time if provided (column 5)
                if (newStartTime !== undefined && newStartTime !== null) {
                    eventsSheet.getRange(rowIndex, 5).setValue(newStartTime);
                }

                // Update end time if provided (column 6)
                if (newEndTime !== undefined && newEndTime !== null) {
                    eventsSheet.getRange(rowIndex, 6).setValue(newEndTime);
                }

                // Invalidate cache
                CacheService.getScriptCache().remove('itinerary_json');

                return createApiResponse('success', { message: 'Event moved successfully' });
            }
        }

        return createApiResponse('error', null, { message: 'Event not found' });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

// ============================================================================
// EVENT UPDATE (Legacy - for backward compatibility)
// ============================================================================

function handleUpdateEvent(e) {
    const date = e.parameter.date;
    const name = e.parameter.name;
    const field = e.parameter.field;
    const value = e.parameter.value;

    if (!date || !name || !field) {
        return createApiResponse('error', null, { message: 'Missing params' });
    }

    const result = updateEventField(date, name, field, value);
    return createApiResponse(result.success ? 'success' : 'error', result.success ? result : null, result.error ? { message: result.error } : null);
}

function updateEventField(date, eventName, field, value) {
    const ss = getSpreadsheet();
    const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

    if (!eventsSheet) {
        return { success: false, error: 'Events sheet not found' };
    }

    const colMap = {
        'status': 9,
        'bookingRef': 10,
        'memo': 11,
        'budget': 12
    };

    const colIndex = colMap[field];
    if (!colIndex) return { success: false, error: 'Invalid field' };

    const lastRow = eventsSheet.getLastRow();
    if (lastRow < 2) return { success: false, error: 'No data' };

    const data = eventsSheet.getRange(2, 1, lastRow - 1, 4).getValues();

    for (let i = 0; i < data.length; i++) {
        if (toString(data[i][0]) === date && toString(data[i][3]) === eventName) {
            eventsSheet.getRange(i + 2, colIndex).setValue(value);
            CacheService.getScriptCache().remove('itinerary_json');
            return { success: true };
        }
    }

    return { success: false, error: 'Event not found' };
}

// ============================================================================
// MAP GENERATION
// ============================================================================

/**
 * Get static map image for a single location
 * Returns base64 encoded PNG image
 */
function handleGetStaticMap(e) {
    const location = e.parameter.location;
    if (!location) {
        return createApiResponse('error', null, { message: 'Location is required' });
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = 'staticmap_' + Utilities.base64Encode(Utilities.newBlob(location).getBytes());

    // 1. Try Script Cache (Memory - Fast)
    try {
        const cached = cache.get(cacheKey);
        if (cached) return createApiResponse('success', { image: cached });
    } catch (e) { }

    // 2. Try Sheet Cache (Persistent)
    const sheetCached = getMapFromSheetCache(location);
    if (sheetCached) {
        // Warm up script cache
        try { cache.put(cacheKey, sheetCached, 86400); } catch (e) { }
        return createApiResponse('success', { image: sheetCached });
    }

    // 3. Generate new map
    try {
        const map = Maps.newStaticMap()
            .setSize(400, 200)
            .setLanguage('ja')
            .setMapType(Maps.StaticMap.Type.ROADMAP)
            .setZoom(15)
            .addMarker(location);

        // Try to center on the location using geocoding
        const geocoder = Maps.newGeocoder().setLanguage('ja').setRegion('jp');
        const geoResult = geocoder.geocode(location);
        if (geoResult.status === 'OK' && geoResult.results.length > 0) {
            const loc = geoResult.results[0].geometry.location;
            map.setCenter(loc.lat, loc.lng);
        }

        const blob = map.getBlob();
        const base64Image = 'data:image/png;base64,' + Utilities.base64Encode(blob.getBytes());

        // Save to all caches
        try { cache.put(cacheKey, base64Image, 86400); } catch (e) { }
        try { saveToMapSheetCache(location, base64Image); } catch (e) { }

        return createApiResponse('success', { image: base64Image });
    } catch (err) {
        return createApiResponse('error', null, { message: err.toString() });
    }
}

/**
 * Get route map image between two locations
 * Returns base64 encoded PNG image with route line
 */
function handleGetRouteMap(e) {
    const origin = e.parameter.origin;
    const destination = e.parameter.destination;

    if (!origin || !destination) {
        return createApiResponse('error', null, { message: 'Origin and destination are required' });
    }

    const scriptCache = CacheService.getScriptCache();
    const cacheKey = 'routemap_v2_' + Utilities.base64Encode(
        Utilities.newBlob(origin + '|' + destination).getBytes()
    );

    // 1. Try Script Cache (Memory - Fast)
    try {
        const cached = scriptCache.get(cacheKey);
        if (cached) return createApiResponse('success', JSON.parse(cached));
    } catch (e) { }

    // 2. Try Sheet Cache (Persistent - Server)
    let routeData = getRouteFromSheetCache(origin, destination);

    // 3. If not in sheet, Call Maps API
    if (!routeData) {
        try {
            const directions = Maps.newDirectionFinder()
                .setOrigin(origin)
                .setDestination(destination)
                .setMode(Maps.DirectionFinder.Mode.TRANSIT)
                .setLanguage('ja')
                .setRegion('jp')
                .getDirections();

            if (!directions.routes || directions.routes.length === 0) {
                return createApiResponse('error', null, { message: 'No route found' });
            }

            const route = directions.routes[0];
            const leg = route.legs[0];

            routeData = {
                duration: leg.duration?.text || null,
                distance: leg.distance?.text || null,
                polyline: route.overview_polyline?.points || null
            };

            // Save to Sheet Cache
            saveToSheetCache(origin, destination, routeData);

        } catch (err) {
            return createApiResponse('error', null, { message: err.toString() });
        }
    }

    // 4. Get or Generate Map Image
    let base64Image = routeData.image;  // Check if image is already cached

    if (!base64Image) {
        // Generate new map image only if not cached
        const map = Maps.newStaticMap()
            .setSize(400, 200)
            .setLanguage('ja')
            .setMapType(Maps.StaticMap.Type.ROADMAP);

        if (routeData.polyline) {
            map.addPath(routeData.polyline);
        }

        map.setMarkerStyle(Maps.StaticMap.MarkerSize.SMALL, Maps.StaticMap.Color.GREEN, 'A');
        map.addMarker(origin);
        map.setMarkerStyle(Maps.StaticMap.MarkerSize.SMALL, Maps.StaticMap.Color.RED, 'B');
        map.addMarker(destination);

        const blob = map.getBlob();
        base64Image = 'data:image/png;base64,' + Utilities.base64Encode(blob.getBytes());

        // Update sheet cache with generated image
        routeData.image = base64Image;
        saveToSheetCache(origin, destination, routeData);
    }

    const result = {
        image: base64Image,
        duration: routeData.duration,
        distance: routeData.distance
    };

    // Save to Script Cache
    try {
        scriptCache.put(cacheKey, JSON.stringify(result), 21600); // 6 hours
    } catch (e) { }

    return createApiResponse('success', result);
}

// --- Sheet Cache Helpers ---

function getRouteCacheSheet() {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('_RouteCache');
    if (!sheet) {
        sheet = ss.insertSheet('_RouteCache');
        // Added Image column for Static Maps caching
        sheet.appendRow(['Origin', 'Destination', 'Duration', 'Distance', 'Polyline', 'Image', 'UpdatedAt']);
        sheet.setFrozenRows(1);
        sheet.hideSheet();
    }
    return sheet;
}

function getRouteFromSheetCache(origin, destination) {
    const sheet = getRouteCacheSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] === origin && row[1] === destination) {
            return {
                duration: row[2],
                distance: row[3],
                polyline: row[4],
                image: row[5] || null  // Return cached image if exists
            };
        }
    }
    return null;
}

function saveToSheetCache(origin, destination, data) {
    const sheet = getRouteCacheSheet();
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === origin && rows[i][1] === destination) {
            // Update existing - now includes image
            sheet.getRange(i + 1, 3, 1, 5).setValues([[
                data.duration,
                data.distance,
                data.polyline,
                data.image || '',
                new Date()
            ]]);
            return;
        }
    }
    // Append new with image
    sheet.appendRow([origin, destination, data.duration, data.distance, data.polyline, data.image || '', new Date()]);
}

// --- Place Cache Helpers (Persistent) ---

function getPlaceCacheSheet() {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('_PlaceCache');
    if (!sheet) {
        sheet = ss.insertSheet('_PlaceCache');
        sheet.appendRow(['Query', 'Data', 'UpdatedAt']);
        sheet.setFrozenRows(1);
        sheet.hideSheet();
    }
    return sheet;
}

function getPlaceFromSheetCache(query) {
    const sheet = getPlaceCacheSheet();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === query) {
            try { return JSON.parse(data[i][1]); } catch { return null; }
        }
    }
    return null;
}

function saveToPlaceSheetCache(query, placeData) {
    const sheet = getPlaceCacheSheet();
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === query) {
            sheet.getRange(i + 1, 2, 1, 2).setValues([[JSON.stringify(placeData), new Date()]]);
            return;
        }
    }
    sheet.appendRow([query, JSON.stringify(placeData), new Date()]);
}

// --- Static Map Cache Helpers (Persistent) ---

function getMapCacheSheet() {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('_MapCache');
    if (!sheet) {
        sheet = ss.insertSheet('_MapCache');
        sheet.appendRow(['Location', 'Image', 'UpdatedAt']);
        sheet.setFrozenRows(1);
        sheet.hideSheet();
    }
    return sheet;
}

function getMapFromSheetCache(location) {
    const sheet = getMapCacheSheet();
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] === location) {
            return data[i][1] || null;
        }
    }
    return null;
}

function saveToMapSheetCache(location, imageBase64) {
    const sheet = getMapCacheSheet();
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === location) {
            sheet.getRange(i + 1, 2, 1, 2).setValues([[imageBase64, new Date()]]);
            return;
        }
    }
    sheet.appendRow([location, imageBase64, new Date()]);
}

// Legacy function (kept for compatibility)
function generateStaticMapUrl(locations) {
    if (!locations || locations.length === 0) return null;

    const map = Maps.newStaticMap().setSize(600, 400).setLanguage('ja');
    locations.forEach(loc => map.addMarker(loc));

    const blob = map.getBlob();
    return 'data:image/png;base64,' + Utilities.base64Encode(blob.getBytes());
}

// ============================================================================
// PACKING LIST
// ============================================================================

/**
 * Batch update multiple packing items - true batch processing (single write)
 * GAS Best Practice: Read all → Modify in memory → Write all once
 */
function handleBatchUpdatePackingItems(e) {
    try {
        const items = JSON.parse(e.parameter.items || e.postData?.contents);
        if (!items || !Array.isArray(items)) {
            return createApiResponse('error', null, { message: 'Invalid items format' });
        }

        const ss = getSpreadsheet();
        let sheet = ss.getSheetByName(PACKING_SHEET);

        if (!sheet) {
            sheet = ss.insertSheet(PACKING_SHEET);
            sheet.appendRow(['id', 'name', 'category', 'isShared', 'assignee', 'isChecked', 'createdAt']);
        }

        const lastRow = sheet.getLastRow();
        const now = new Date();

        // 1. Batch read: Get all existing data
        let allData = lastRow >= 2
            ? sheet.getRange(2, 1, lastRow - 1, 7).getValues()
            : [];

        const existingIds = allData.map(row => row[0]);
        const rowsToAppend = [];
        let updateCount = 0;
        let modified = false;

        // 2. Modify in memory
        items.forEach(item => {
            const rowData = [
                item.id || Utilities.getUuid(),
                item.name,
                item.category,
                item.isShared,
                item.assignee || '',
                item.isChecked,
                item.createdAt || now
            ];

            if (item.id) {
                const rowIndex = existingIds.indexOf(item.id);
                if (rowIndex !== -1) {
                    // Update in memory
                    allData[rowIndex] = rowData;
                    updateCount++;
                    modified = true;
                } else {
                    // New item
                    rowsToAppend.push(rowData);
                }
            } else {
                // New item without ID
                rowsToAppend.push(rowData);
            }
        });

        // 3. Batch write: Write all existing data back in single call
        if (modified && allData.length > 0) {
            sheet.getRange(2, 1, allData.length, 7).setValues(allData);
        }

        // 4. Batch append: Append all new rows in single call
        if (rowsToAppend.length > 0) {
            sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, 7).setValues(rowsToAppend);
        }

        return createApiResponse('success', {
            updated: updateCount,
            added: rowsToAppend.length
        });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

function getPackingList() {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(PACKING_SHEET);

    if (!sheet) {
        sheet = ss.insertSheet(PACKING_SHEET);
        sheet.appendRow(['id', 'name', 'category', 'isShared', 'assignee', 'isChecked', 'createdAt']);
        return [];
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    return sheet.getRange(2, 1, lastRow - 1, 7).getValues().map(row => ({
        id: row[0], name: row[1], category: row[2],
        isShared: row[3], assignee: row[4],
        isChecked: row[5], createdAt: row[6]
    }));
}

function handleUpdatePackingItem(e) {
    const item = {
        id: e.parameter.id,
        name: e.parameter.name,
        category: e.parameter.category,
        isShared: e.parameter.isShared === 'true',
        assignee: e.parameter.assignee,
        isChecked: e.parameter.isChecked === 'true'
    };
    return createApiResponse('success', updatePackingItem(item));
}

function updatePackingItem(item) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(PACKING_SHEET);

    if (!sheet) {
        getPackingList();
        sheet = ss.getSheetByName(PACKING_SHEET);
    }

    const lastRow = sheet.getLastRow();
    let rowIndex = -1;

    if (item.id && lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
        const found = ids.indexOf(item.id);
        if (found !== -1) rowIndex = found + 2;
    }

    const rowData = [
        item.id || Utilities.getUuid(),
        item.name, item.category, item.isShared,
        item.assignee, item.isChecked, new Date()
    ];

    if (rowIndex !== -1) {
        sheet.getRange(rowIndex, 1, 1, 7).setValues([rowData]);
    } else {
        sheet.appendRow(rowData);
    }

    return {
        id: rowData[0], name: rowData[1], category: rowData[2],
        isShared: rowData[3], assignee: rowData[4],
        isChecked: rowData[5], createdAt: rowData[6]
    };
}

function deletePackingItem(id) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(PACKING_SHEET);
    if (!sheet) return;

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    const index = ids.indexOf(id);

    if (index !== -1) {
        sheet.deleteRow(index + 2);
    }
}

// ============================================================================
// PASSCODE VALIDATION
// ============================================================================

function handleValidatePasscode(e) {
    const inputCode = e.parameter.code || '';
    const storedCode = PropertiesService.getScriptProperties().getProperty('APP_PASSCODE') || '2025';
    return createApiResponse('success', { valid: inputCode === storedCode });
}
