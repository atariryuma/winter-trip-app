// Read from Script Properties for environment-specific configuration
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const DAYS_SHEET = 'days';
const EVENTS_SHEET = 'events';
const PACKING_SHEET = 'packing_list';
const TRIPS_SHEET = 'trips';

// events sheet: date, type, category, name, time, endTime, from, to, status,
// bookingRef, memo, budget, tripId
const EVENT_COLS = 13;
const EVENTS_HEADER = ['date', 'type', 'category', 'name', 'time', 'endTime', 'from', 'to', 'status', 'bookingRef', 'memo', 'budget', 'tripId'];
const TRIPS_HEADER = ['id', 'title', 'startDate', 'theme', 'budget', 'createdAt'];
// Rows written before trips existed have no tripId; they belong to this trip.
const DEFAULT_TRIP_ID = 'default';
const API_VERSION = 2;
const ITINERARY_CACHE_KEY = 'itinerary_json_v2';

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

/**
 * Locate an event row (0-based index into data rows starting at sheet row 2).
 * `rowHint` is the sheet row the client last saw; it is used only when the row
 * still holds the same date + name, which disambiguates events that share a
 * name on the same day. Falls back to the first date + name match.
 */
function findEventIndex(data, date, name, rowHint) {
    const hint = Number(rowHint) - 2;
    if (hint >= 0 && hint < data.length &&
        dateKey(data[hint][0]) === date && toString(data[hint][3]) === name) {
        return hint;
    }
    return data.findIndex(row => dateKey(row[0]) === date && toString(row[3]) === name);
}

const YMD_PATTERN = /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/;
const MD_PATTERN = /^\d{1,2}\/\d{1,2}$/;

/**
 * Canonical key for a date cell.
 * - Text "2027/8/10" (written by this API) keeps its year: "2027/8/10".
 * - Date cells and "8/10" text are legacy rows: the year Sheets attached to them
 *   may be wrong, so it is dropped ("8/10") and the client infers it.
 */
function dateKey(value) {
    if (value instanceof Date) return toString(value);
    const s = toString(value).trim();
    const m = YMD_PATTERN.exec(s);
    return m ? `${Number(m[1])}/${Number(m[2])}/${Number(m[3])}` : s;
}

/** Cell value for a date key. Written as text so Sheets doesn't convert it (and drop the year). */
function dateCell(value) {
    if (value instanceof Date) return value;
    const key = dateKey(value);
    return YMD_PATTERN.test(key) || MD_PATTERN.test(key) ? "'" + key : key;
}

/** Cell value for "HH:mm", kept as text for the same reason. */
function timeCell(value) {
    if (value instanceof Date) return value;
    const s = value === undefined || value === null ? '' : String(value);
    return /^\d{1,2}:\d{2}$/.test(s) ? "'" + s : s;
}

function tripIdOf(row) {
    return toString(row[12]) || DEFAULT_TRIP_ID;
}

function dateParts(key) {
    const parts = String(key).split('/').map(Number);
    return parts.length === 3
        ? { year: parts[0], month: parts[1], day: parts[2] }
        : { year: null, month: parts[0], day: parts[1] };
}

function getEventsSheet() {
    const sheet = getSpreadsheet().getSheetByName(EVENTS_SHEET);
    if (!sheet) throw new Error('Events sheet not found');
    // Older sheets only have 12 header cells
    if (sheet.getLastRow() >= 1 && !toString(sheet.getRange(1, EVENT_COLS).getValue())) {
        sheet.getRange(1, EVENT_COLS).setValue(EVENTS_HEADER[EVENT_COLS - 1]);
    }
    return sheet;
}

function readEventRows(sheet) {
    const lastRow = sheet.getLastRow();
    return lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, EVENT_COLS).getValues() : [];
}

/** Delete the given 0-based data-row indexes, bottom-up in contiguous runs. */
function deleteEventRows(sheet, indexes) {
    const sorted = [...indexes].sort((a, b) => b - a);
    let i = 0;
    while (i < sorted.length) {
        let start = sorted[i];
        let count = 1;
        while (i + count < sorted.length && sorted[i + count] === start - 1) {
            start -= 1;
            count += 1;
        }
        sheet.deleteRows(start + 2, count);
        i += count;
    }
    return indexes.length;
}

/** Normalise one event row for writing (12 data columns + tripId). */
function eventRowValues(values) {
    const row = [];
    for (let c = 0; c < EVENT_COLS; c++) row.push(values[c] === undefined || values[c] === null ? '' : values[c]);
    row[0] = dateCell(row[0]);
    row[4] = timeCell(row[4]);
    row[5] = timeCell(row[5]);
    return row;
}

/** Invalidate the itinerary cache and record the time of the last edit. */
function markUpdated() {
    CacheService.getScriptCache().remove(ITINERARY_CACHE_KEY);
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
    PropertiesService.getScriptProperties().setProperty('lastUpdate', timestamp);
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
            case 'saveTrip':
                return handleSaveTrip(e);
            case 'deleteTrip':
                return handleDeleteTrip(e);
            case 'renameDates':
                return handleRenameDates(e);
        }

        // The old "save the whole itinerary" fallback was removed: it rewrote every
        // row without trip ids. Unknown actions are rejected instead.
        return createApiResponse('error', null, { message: `Unknown action: ${action}` });
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
    CacheService.getScriptCache().remove(ITINERARY_CACHE_KEY);

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
        const tripId = e.parameter.tripId || '';
        if (!csvData) {
            return createApiResponse('error', null, { message: 'No CSV data provided' });
        }

        const rows = parseCSV(csvData);
        if (rows.length < 2) {
            return createApiResponse('error', null, { message: 'CSV must have header and at least one row' });
        }

        const sheet = getEventsSheet();

        // Header row skipped; the first 12 columns follow EVENTS_HEADER.
        const dataRows = rows.slice(1)
            .filter(row => row[0])
            .map(row => eventRowValues([...row.slice(0, EVENT_COLS - 1), tripId || row[EVENT_COLS - 1] || '']));

        if (tripId) {
            // Replace only this trip's events
            const existing = readEventRows(sheet);
            const mine = [];
            existing.forEach((row, i) => { if (tripIdOf(row) === tripId) mine.push(i); });
            deleteEventRows(sheet, mine);
            if (dataRows.length > 0) {
                sheet.getRange(sheet.getLastRow() + 1, 1, dataRows.length, EVENT_COLS).setValues(dataRows);
            }
        } else {
            // Legacy: replace everything
            const lastRow = sheet.getLastRow();
            if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, EVENT_COLS).clearContent();
            if (dataRows.length > 0) sheet.getRange(2, 1, dataRows.length, EVENT_COLS).setValues(dataRows);
        }

        markUpdated();

        return createApiResponse('success', {
            uploaded: dataRows.length,
            message: `${dataRows.length}件の予定を取り込みました`
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
        const cached = cache.get(ITINERARY_CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch (e) { }

    const eventsSheet = getSpreadsheet().getSheetByName(EVENTS_SHEET);
    if (!eventsSheet) {
        throw new Error('Events sheet not found');
    }
    const eventsData = readEventRows(eventsSheet);

    const days = ['日', '月', '火', '水', '木', '金', '土'];
    // Legacy "M/D" keys have no year; guess one only for the day-of-week label
    // (the app computes its own dates).
    const getDayOfWeek = (key) => {
        const { year, month, day } = dateParts(key);
        let targetYear = year;
        if (!targetYear) {
            const now = new Date();
            targetYear = now.getFullYear();
            if (now.getMonth() + 1 >= 10 && month <= 3) targetYear += 1;
            else if (now.getMonth() + 1 <= 3 && month >= 10) targetYear -= 1;
        }
        return days[new Date(targetYear, month - 1, day).getDay()];
    };

    const daysMap = {};
    const mapLocations = [];

    eventsData.forEach((row, idx) => {
        const [date, type, category, name, time, endTime, from, to, status, bookingRef, memo, budget] = row;
        const dateStr = dateKey(date);
        if (!dateStr) return;

        if (!daysMap[dateStr]) {
            daysMap[dateStr] = {
                id: `day-${dateStr.replace(/\//g, '-')}`,
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
            // Sheet row number: lets clients point at this exact row
            id: `ev-${idx + 2}`,
            tripId: tripIdOf(row),
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

    Object.values(daysMap).forEach(day => {
        day.events.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
    });

    // Year-qualified keys sort by date; legacy keys fall back to the old
    // "autumn/winter before spring" ordering.
    const sortedDays = Object.values(daysMap).sort((a, b) => {
        const pa = dateParts(a.date);
        const pb = dateParts(b.date);
        if (pa.year && pb.year) {
            return new Date(pa.year, pa.month - 1, pa.day) - new Date(pb.year, pb.month - 1, pb.day);
        }
        if (pa.year !== pb.year) return pa.year ? 1 : -1;
        const aLate = pa.month >= 10;
        const bLate = pb.month >= 10;
        if (aLate !== bLate) return aLate ? -1 : 1;
        return pa.month - pb.month || pa.day - pb.day;
    });

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
        apiVersion: API_VERSION,
        days: sortedDays,
        trips: getTrips(),
        mapUrl,
        mapError,
        lastUpdate: PropertiesService.getScriptProperties().getProperty('lastUpdate') || null
    };

    try {
        cache.put(ITINERARY_CACHE_KEY, JSON.stringify(result), 3600);
    } catch (e) { }

    return result;
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

        const eventsSheet = getEventsSheet();
        const allData = readEventRows(eventsSheet);
        if (allData.length === 0) {
            return createApiResponse('error', null, { message: 'No data to update' });
        }

        const pick = (data, key, current) => (data[key] !== undefined ? data[key] : current);
        const changedRows = new Set();
        const notFound = [];

        updates.forEach(update => {
            const { date, eventId, eventData, row } = update;

            // An update without a name would silently hit the first event of the day
            if (!eventId) {
                notFound.push(date);
                return;
            }
            const rowIndex = findEventIndex(allData, date, eventId, row);
            if (rowIndex === -1) {
                notFound.push(`${date} ${eventId}`);
                return;
            }

            const current = allData[rowIndex];
            // Only touch the budget column when the client sent budget fields
            const budget = 'budgetAmount' in eventData
                ? (eventData.budgetAmount ? `${eventData.budgetAmount}/${eventData.budgetPaidBy || ''}` : '')
                : current[11];

            allData[rowIndex] = [
                current[0], // date changes go through moveEvent / renameDates
                pick(eventData, 'type', current[1]),
                pick(eventData, 'category', current[2]),
                pick(eventData, 'name', current[3]),
                pick(eventData, 'time', current[4]),
                pick(eventData, 'endTime', current[5]),
                eventData.from !== undefined ? eventData.from : pick(eventData, 'place', current[6]),
                pick(eventData, 'to', current[7]),
                pick(eventData, 'status', current[8]),
                pick(eventData, 'bookingRef', current[9]),
                pick(eventData, 'details', current[10]),
                budget,
                pick(eventData, 'tripId', current[12])
            ];
            changedRows.add(rowIndex);
        });

        // Write only the rows that changed: rewriting every row would turn text
        // dates/times back into Sheets date values.
        changedRows.forEach(i => {
            eventsSheet.getRange(i + 2, 1, 1, EVENT_COLS).setValues([eventRowValues(allData[i])]);
        });
        if (changedRows.size > 0) markUpdated();

        if (changedRows.size === 0 && notFound.length > 0) {
            return createApiResponse('error', null, { message: `Event not found: ${notFound.join(', ')}` });
        }
        return createApiResponse('success', { updated: changedRows.size, notFound });
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

        const eventsSheet = getEventsSheet();
        const budget = eventData.budgetAmount
            ? `${eventData.budgetAmount}/${eventData.budgetPaidBy || ''}`
            : '';
        const value = (key, fallback = '') => (eventData[key] !== undefined ? eventData[key] : fallback);

        const rowData = eventRowValues([
            date,
            value('type'),
            value('category'),
            value('name'),
            value('time'),
            value('endTime'),
            eventData.from !== undefined ? eventData.from : value('place'),
            value('to'),
            value('status', 'planned'),
            value('bookingRef'),
            value('details'),
            budget,
            value('tripId')
        ]);

        eventsSheet.appendRow(rowData);
        markUpdated();

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

        const eventsSheet = getEventsSheet();
        const data = readEventRows(eventsSheet);
        const index = findEventIndex(data, date, eventId, e.parameter.row);

        if (index === -1) {
            return createApiResponse('error', null, { message: 'Event not found' });
        }

        eventsSheet.deleteRow(index + 2);
        markUpdated();
        return createApiResponse('success', { message: 'Event deleted' });
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
        const tripId = e.parameter.tripId || '';

        if (!date) {
            return createApiResponse('error', null, { message: 'Date is required' });
        }

        const eventsSheet = getEventsSheet();
        const matches = [];
        readEventRows(eventsSheet).forEach((row, i) => {
            if (dateKey(row[0]) === date && (!tripId || tripIdOf(row) === tripId)) matches.push(i);
        });

        const deletedCount = deleteEventRows(eventsSheet, matches);
        if (deletedCount > 0) markUpdated();

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
        const { originalDate, eventId, newDate, newStartTime, newEndTime, row } = eventData;

        if (!originalDate || !eventId || !newDate) {
            return createApiResponse('error', null, { message: 'originalDate, eventId, and newDate are required' });
        }

        const eventsSheet = getEventsSheet();
        const index = findEventIndex(readEventRows(eventsSheet), originalDate, eventId, row);
        if (index === -1) {
            return createApiResponse('error', null, { message: 'Event not found' });
        }

        const rowIndex = index + 2;
        eventsSheet.getRange(rowIndex, 1).setValue(dateCell(newDate));
        if (newStartTime !== undefined && newStartTime !== null) {
            eventsSheet.getRange(rowIndex, 5).setValue(timeCell(newStartTime));
        }
        if (newEndTime !== undefined && newEndTime !== null) {
            eventsSheet.getRange(rowIndex, 6).setValue(timeCell(newEndTime));
        }

        markUpdated();
        return createApiResponse('success', { message: 'Event moved successfully' });
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
        if (dateKey(data[i][0]) === date && toString(data[i][3]) === eventName) {
            eventsSheet.getRange(i + 2, colIndex).setValue(value);
            markUpdated();
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
// TRIPS
// ============================================================================

function getTripsSheet() {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(TRIPS_SHEET);
    if (!sheet) {
        sheet = ss.insertSheet(TRIPS_SHEET);
        sheet.appendRow(TRIPS_HEADER);
    }
    return sheet;
}

/** Trip start dates are written by this API only, so a Date cell's year can be trusted. */
function tripDateKey(value) {
    if (value instanceof Date) return Utilities.formatDate(value, 'Asia/Tokyo', 'yyyy/M/d');
    return dateKey(value);
}

function getTrips() {
    const sheet = getSpreadsheet().getSheetByName(TRIPS_SHEET);
    if (!sheet || sheet.getLastRow() < 2) return [];
    return sheet.getRange(2, 1, sheet.getLastRow() - 1, TRIPS_HEADER.length).getValues()
        .filter(row => toString(row[0]))
        .map(row => ({
            id: toString(row[0]),
            title: toString(row[1]),
            startDate: tripDateKey(row[2]),
            theme: toString(row[3]) || 'auto',
            budget: Number(row[4]) || 0
        }));
}

/** Create or update a trip. POST trip={id?, title, startDate, theme, budget} */
function handleSaveTrip(e) {
    try {
        const trip = JSON.parse(e.parameter.trip || '{}');
        if (!trip.title) {
            return createApiResponse('error', null, { message: 'Title is required' });
        }
        const sheet = getTripsSheet();
        const id = trip.id || `trip-${Utilities.getUuid().slice(0, 8)}`;
        const lastRow = sheet.getLastRow();
        const ids = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(r => toString(r[0])) : [];
        const index = ids.indexOf(id);
        const createdAt = index === -1 ? new Date() : sheet.getRange(index + 2, 6).getValue();
        const row = [id, trip.title, trip.startDate ? dateCell(trip.startDate) : '', trip.theme || 'auto', Number(trip.budget) || 0, createdAt];

        if (index === -1) sheet.appendRow(row);
        else sheet.getRange(index + 2, 1, 1, TRIPS_HEADER.length).setValues([row]);

        markUpdated();
        return createApiResponse('success', { id });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

/** Delete a trip and all of its events. POST id=... */
function handleDeleteTrip(e) {
    try {
        const id = e.parameter.id;
        if (!id) return createApiResponse('error', null, { message: 'id is required' });

        const eventsSheet = getEventsSheet();
        const mine = [];
        readEventRows(eventsSheet).forEach((row, i) => { if (tripIdOf(row) === id) mine.push(i); });
        const deletedEvents = deleteEventRows(eventsSheet, mine);

        const sheet = getSpreadsheet().getSheetByName(TRIPS_SHEET);
        if (sheet && sheet.getLastRow() > 1) {
            const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(r => toString(r[0]));
            const index = ids.indexOf(id);
            if (index !== -1) sheet.deleteRow(index + 2);
        }

        markUpdated();
        return createApiResponse('success', { deletedEvents });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

/**
 * Change the dates of a trip's events, e.g. to add the year to legacy "M/D"
 * rows or to shift a rescheduled trip. POST tripId=..., changes=[{from, to}]
 * All changes are applied against the original values, so swaps are safe.
 */
function handleRenameDates(e) {
    try {
        const tripId = e.parameter.tripId;
        const changes = JSON.parse(e.parameter.changes || '[]');
        if (!tripId || !Array.isArray(changes)) {
            return createApiResponse('error', null, { message: 'tripId and changes are required' });
        }
        const map = {};
        changes.forEach(c => { if (c.from && c.to) map[dateKey(c.from)] = dateKey(c.to); });

        const sheet = getEventsSheet();
        const rows = readEventRows(sheet);
        let renamed = 0;
        const column = rows.map(row => {
            const key = dateKey(row[0]);
            if (tripIdOf(row) === tripId && map[key] && map[key] !== key) {
                renamed++;
                return [dateCell(map[key])];
            }
            return [dateCell(row[0])];
        });
        if (renamed > 0) {
            sheet.getRange(2, 1, column.length, 1).setValues(column);
            markUpdated();
        }
        return createApiResponse('success', { renamed });
    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
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
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(PACKING_SHEET);

    if (!sheet) {
        getPackingList(); // This creates the sheet
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
    const ss = getSpreadsheet();
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
