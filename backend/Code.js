const SPREADSHEET_ID = '1eoZtWfOECvkp_L3919yWYnZtlMPlTaq0cohV56SrE7I';
const DAYS_SHEET = 'days';
const EVENTS_SHEET = 'events';
const PACKING_SHEET = 'packing_list';

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
            case 'updateEvent':
                return handleUpdateEvent(e);
            case 'getWeather':
                return handleGetWeather(e);
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
            case 'updateDay':
                return handleUpdateDay(e);
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
            case 'updateDay':
                return handleUpdateDay(e);
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
 * Handle Days CSV upload - overwrites days sheet
 */


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

        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
 * Get itinerary data from days/events sheets
 */
function getItineraryData() {
    const cache = CacheService.getScriptCache();

    try {
        const cached = cache.get('itinerary_json');
        if (cached) return JSON.parse(cached);
    } catch (e) { }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const daysSheet = ss.getSheetByName(DAYS_SHEET);
    const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

    if (!daysSheet || !eventsSheet) {
        throw new Error('Required sheets (days/events) not found');
    }

    // Read days
    const daysLastRow = daysSheet.getLastRow();
    const daysData = daysLastRow > 1
        ? daysSheet.getRange(2, 1, daysLastRow - 1, 5).getValues()
        : [];

    // Read events
    const eventsLastRow = eventsSheet.getLastRow();
    const eventsData = eventsLastRow > 1
        ? eventsSheet.getRange(2, 1, eventsLastRow - 1, 12).getValues()
        : [];

    // Build days map
    const daysMap = {};
    daysData.forEach(([date, dayOfWeek, title, summary, theme]) => {
        if (!date) return;
        daysMap[toString(date)] = {
            id: `day-${toString(date).replace('/', '-')}`,
            date: toString(date),
            dayOfWeek: toString(dayOfWeek),
            title: toString(title),
            summary: toString(summary),
            theme: theme || 'default',
            weather: null,
            events: []
        };
    });

    const mapLocations = [];

    // Process events
    eventsData.forEach((row, idx) => {
        const [date, type, category, name, time, endTime, from, to, status, bookingRef, memo, budget] = row;
        const dateStr = toString(date);

        if (!dateStr || !daysMap[dateStr]) return;

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

    // Sort events by time
    Object.values(daysMap).forEach(day => {
        day.events.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
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
        days: Object.values(daysMap),
        mapUrl,
        mapError,
        lastUpdate: PropertiesService.getScriptProperties().getProperty('lastUpdate') || null
    };

    try {
        // Increased cache TTL from 30min to 1 hour for better performance
        cache.put('itinerary_json', JSON.stringify(result), 3600);
    } catch (e) { }

    return result;
}

/**
 * Save itinerary data to sheets
 */
function saveItineraryData(data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

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
// WEATHER API (Open-Meteo)
// ============================================================================

function getWeather(date, locationName) {
    const cache = CacheService.getScriptCache();
    const cacheKey = `weather_${date}_${Utilities.base64Encode(locationName)}`;

    try {
        const cached = cache.get(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch (e) { }

    try {
        const geocoder = Maps.newGeocoder().setLanguage('ja').setRegion('jp');
        const geoResult = geocoder.geocode(locationName);

        if (geoResult.status !== 'OK' || !geoResult.results.length) {
            return { error: 'Location not found' };
        }

        const loc = geoResult.results[0].geometry.location;
        const currentYear = new Date().getFullYear();
        const [month, day] = date.split('/').map(Number);
        const year = month >= 10 ? currentYear : currentYear + 1;
        const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia/Tokyo&start_date=${isoDate}&end_date=${isoDate}`;

        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        const data = JSON.parse(response.getContentText());

        if (!data.daily || !data.daily.weathercode) {
            return { error: 'No weather data' };
        }

        const weatherCode = data.daily.weathercode[0];
        const result = {
            temp: `${Math.round(data.daily.temperature_2m_max[0])}°/${Math.round(data.daily.temperature_2m_min[0])}°`,
            condition: getWeatherCondition(weatherCode),
            icon: getWeatherIcon(weatherCode),
            code: weatherCode
        };

        // Increased cache TTL from 6 hours to 12 hours for weather data
        cache.put(cacheKey, JSON.stringify(result), 43200);
        return result;

    } catch (e) {
        return { error: e.toString() };
    }
}

function getWeatherCondition(code) {
    const conditions = {
        0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Fog',
        51: 'Light Rain', 53: 'Rain', 55: 'Heavy Rain',
        61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
        71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
        77: 'Snow', 80: 'Light Rain', 81: 'Rain', 82: 'Heavy Rain',
        85: 'Light Snow', 86: 'Heavy Snow',
        95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
    };
    return conditions[code] || 'Unknown';
}

function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 65) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '❄️';
    return '⛈️';
}

function handleGetWeather(e) {
    const date = e.parameter.date;
    const location = e.parameter.location;
    if (!date || !location) {
        return createApiResponse('error', null, { message: 'Missing date or location' });
    }
    return createApiResponse('success', getWeather(date, location));
}

// ============================================================================
// PLACES API
// ============================================================================

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

    try {
        const cached = cache.get(cacheKey);
        if (cached) return JSON.parse(cached);
    } catch (e) { }

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

    try {
        // Increased cache TTL from 6 hours to 12 hours for place data
        cache.put(cacheKey, JSON.stringify(placeInfo), 43200);
    } catch (e) { }

    return placeInfo;
}

/**
 * Auto-fill location details for events
 */
function autoFillAllMissingDetails() {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const eventsSheet = ss.getSheetByName(EVENTS_SHEET);

    if (!eventsSheet) return 0;

    const lastRow = eventsSheet.getLastRow();
    if (lastRow < 2) return 0;

    const data = eventsSheet.getRange(2, 1, lastRow - 1, 12).getValues();
    let count = 0;

    data.forEach((row, idx) => {
        const [date, type, category, name, time, endTime, from, to, status, bookingRef, memo, budget] = row;

        if (memo && toString(memo).includes('📍')) return;

        let targetName = toString(name);
        if (type === 'transport') {
            targetName = toString(from) || toString(to);
        }

        if (targetName) {
            try {
                const info = getPlaceInfo(targetName);
                if (info && info.found && info.formattedAddress) {
                    const newMemo = memo
                        ? `${toString(memo)}\n📍 ${info.formattedAddress}`
                        : `📍 ${info.formattedAddress}`;
                    eventsSheet.getRange(idx + 2, 11).setValue(newMemo);
                    count++;
                }
            } catch (e) { }
        }
    });

    return count;
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

        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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

        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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

        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
 * Update a single day's metadata (title, summary, theme)
 */
function handleUpdateDay(e) {
    try {
        const dayData = JSON.parse(e.parameter.dayData || e.postData?.contents);
        const { date } = dayData;

        if (!date) {
            return createApiResponse('error', null, { message: 'Date is required' });
        }

        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        const daysSheet = ss.getSheetByName(DAYS_SHEET);

        if (!daysSheet) {
            return createApiResponse('error', null, { message: 'Days sheet not found' });
        }

        const lastRow = daysSheet.getLastRow();
        if (lastRow < 2) {
            // No data, create new row
            const rowData = [
                date,
                dayData.dayOfWeek || '',
                dayData.title || '',
                dayData.summary || '',
                dayData.theme || 'default'
            ];
            daysSheet.appendRow(rowData);
        } else {
            // Find and update existing row
            const dates = daysSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
            const rowIndex = dates.findIndex(d => toString(d) === date);

            if (rowIndex !== -1) {
                const rowData = [
                    date,
                    dayData.dayOfWeek || '',
                    dayData.title || '',
                    dayData.summary || '',
                    dayData.theme || 'default'
                ];
                daysSheet.getRange(rowIndex + 2, 1, 1, 5).setValues([rowData]);
            } else {
                // Date not found, append new
                const rowData = [
                    date,
                    dayData.dayOfWeek || '',
                    dayData.title || '',
                    dayData.summary || '',
                    dayData.theme || 'default'
                ];
                daysSheet.appendRow(rowData);
            }
        }

        // Invalidate cache
        CacheService.getScriptCache().remove('itinerary_json');

        return createApiResponse('success', { message: 'Day updated' });
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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

        const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
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
