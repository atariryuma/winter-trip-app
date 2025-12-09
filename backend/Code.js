const SPREADSHEET_ID = '1eoZtWfOECvkp_L3919yWYnZtlMPlTaq0cohV56SrE7I';
const SHEET_NAME = 'tripdata';

/**
 * Triggered when the spreadsheet is opened.
 * Adds a custom menu to the spreadsheet.
 */
function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('Trips')
        .addItem('Location Auto-fill', 'fillLocationDetails')
        .addToUi();
}

/**
 * Menu Handler: Auto-fill active selection
 */
function fillLocationDetails() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return;

    const ui = SpreadsheetApp.getUi();
    const selection = sheet.getSelection();
    const range = selection.getActiveRange();

    if (range.getRow() < 2) {
        ui.alert('Please select data rows (excluding header).');
        return;
    }

    // Process the selected range
    const processedCount = processAutoFill(sheet, range.getRow(), range.getNumRows());

    if (processedCount > 0) {
        ui.alert(`Updated ${processedCount} rows with location details.`);
    } else {
        ui.alert('No rows updated.');
    }
}

/**
 * Scan entire sheet for missing details and fill them
 */
function autoFillAllMissingDetails() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Sheet not found');

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return 0;

    return processAutoFill(sheet, 2, lastRow - 1);
}

/**
 * Core Logic: Auto-fill range
 */
function processAutoFill(sheet, startRow, numRows) {
    const dataRange = sheet.getRange(startRow, 1, numRows, 20);
    const values = dataRange.getValues();
    let processedCount = 0;

    values.forEach((row, rIdx) => {
        // Indicies (0-based) from Code.js save logic:
        // Col 7 (Index 7): Category
        // Col 9 (Index 9): Name (Transport/Activity)
        // Col 16 (Index 16): Hotel Name (Stay) -> Actually it's Index 16? Let's check saveItineraryData.
        // saveItineraryData: 
        //  Stay: row[16] = event.name (Hotel Name). row[19] = event.details. 
        //  Trans: row[9] = event.name. row[15] = event.details. row[11]=place, row[13]=to
        //  Activ: row[9] = event.name. row[15] = event.description.

        const category = row[7];
        let targetName = '';
        let targetDetailIdx = -1;
        let currentDetail = '';

        if (category === '宿泊') {
            targetName = row[16]; // Receiver: Hotel Name
            targetDetailIdx = 19; // Receiver: Hotel Details
        } else {
            targetName = row[9]; // Transport/Activity Name
            if (!targetName && category === '交通') {
                // If Name is empty, try Departure Place or Arrival Place
                targetName = row[11] || row[13];
            }
            targetDetailIdx = 15; // Details
        }

        // If we have a valid target name and a valid detail column
        if (targetName && targetDetailIdx > 0) {
            currentDetail = row[targetDetailIdx];

            // Only fill if detail doesn't already have the pin icon (avoid dups)
            if (!currentDetail || !currentDetail.includes('📍')) {
                try {
                    // Use reusable getPlaceInfo logic
                    // We need a wrapper because getPlaceInfo returns object, we want string block
                    const info = getPlaceInfo(targetName);

                    if (info && info.found) {
                        const chunks = [];
                        if (info.formattedAddress) chunks.push(`📍 ${info.formattedAddress}`);
                        if (info.rating) chunks.push(`⭐️ ${info.rating} (${info.userRatingCount || 0})`);
                        if (info.phone) chunks.push(`📞 ${info.phone}`);
                        if (info.website) chunks.push(`🌐 ${info.website}`);

                        const infoBlock = chunks.join('\n');

                        if (infoBlock) {
                            if (currentDetail) {
                                values[rIdx][targetDetailIdx] = currentDetail + '\n\n' + infoBlock;
                            } else {
                                values[rIdx][targetDetailIdx] = infoBlock;
                            }
                            processedCount++;
                        }
                    }
                } catch (e) {
                    Logger.log(`Error processing ${targetName}: ${e}`);
                }
            }
        }
    });

    if (processedCount > 0) {
        // Write back
        dataRange.setValues(values);
    }

    return processedCount;
}

// ============================================================================
// API ROUTER & HANDLERS
// ============================================================================

/**
 * Standard API Response Envelope
 * @param {string} status - 'success' or 'error'
 * @param {object} data - Data payload (for success)
 * @param {object} error - Error details (for error)
 */
function createApiResponse(status, data = null, error = null) {
    const response = { status };
    if (status === 'success') response.data = data;
    if (status === 'error') response.error = error;
    return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
    try {
        const action = e?.parameter?.action;

        // API Router
        switch (action) {
            case 'getData':
                return handleGetData();
            case 'validatePasscode':
                return handleValidatePasscode(e);
            case 'getPlaceInfo':
                return handleGetPlaceInfo(e);
            case 'autoFill':
                const count = autoFillAllMissingDetails();
                return createApiResponse('success', {
                    message: `Updated ${count} items`,
                    count: count
                });
            default:
                // Default: Redirect to GitHub Pages (Frontend)
                const FRONTEND_URL = 'https://atariryuma.github.io/winter-trip-app/';
                return HtmlService.createHtmlOutput(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="refresh" content="0; url=${FRONTEND_URL}">
                        <title>Redirecting...</title>
                    </head>
                    <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <p>アプリに移動しています...</p>
                        <p><a href="${FRONTEND_URL}">こちらをクリック</a>してください。</p>
                    </body>
                    </html>
                `).setTitle('Redirecting to Winter Trip App');
        }
    } catch (err) {
        return createApiResponse('error', null, { message: err.toString() });
    }
}

function handleGetData() {
    try {
        const data = getItineraryData();
        return createApiResponse('success', data);
    } catch (err) {
        return createApiResponse('error', null, { message: 'Failed to fetch data: ' + err.toString() });
    }
}

function handleValidatePasscode(e) {
    const inputCode = e.parameter.code || '';
    const storedCode = PropertiesService.getScriptProperties().getProperty('APP_PASSCODE') || '2025';
    console.log(`[Login] Checking code. Input: '${inputCode}', Stored: '${storedCode}'`);
    const valid = inputCode === storedCode;
    return createApiResponse('success', { valid });
}

function handleGetPlaceInfo(e) {
    const query = e.parameter.query || '';
    if (!query) return createApiResponse('error', null, { message: 'No query provided' });

    const placeInfo = getPlaceInfo(query);
    return createApiResponse('success', placeInfo);
}

/**
 * Get place information using Google Places API (New)
 * Optimized based on Google's best practices
 */
function getPlaceInfo(query) {
    if (!query || query.trim() === '') {
        return { error: 'No query provided', found: false };
    }

    const cache = CacheService.getScriptCache();
    // Use v3 cache key for new optimized format
    const cacheKey = 'place_v3_' + Utilities.base64Encode(Utilities.newBlob(query).getBytes());

    // Check cache first (6 hours - GAS max is 21600s)
    try {
        const cached = cache.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            parsed._cached = true; // Mark as cached response
            return parsed;
        }
    } catch (e) {
        Logger.log('Cache read error: ' + e.toString());
    }

    // Get API Key from Script Properties
    const API_KEY = PropertiesService.getScriptProperties().getProperty('GOOGLE_MAPS_API_KEY');

    try {
        let placeInfo = {
            found: true,
            name: query,
            formattedAddress: '',
            phone: null,
            website: null,
            rating: null,
            userRatingCount: null,
            openingHours: null,
            editorialSummary: null,
            photoUrl: null,
            reviews: [],
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
            travelTips: [],
            source: 'geocoding'
        };

        if (API_KEY) {
            try {
                const textSearchUrl = 'https://places.googleapis.com/v1/places:searchText';

                // Optimized search payload with Japan-specific settings
                const searchPayload = {
                    textQuery: query,
                    languageCode: 'ja',   // Japanese language for results
                    regionCode: 'JP',     // Prioritize Japan results
                    // Location bias: Central Japan (covers Okinawa to Hokkaido)
                    locationBias: {
                        circle: {
                            center: { latitude: 36.0, longitude: 138.0 },
                            radius: 800000.0  // 800km to cover all of Japan
                        }
                    },
                    maxResultCount: 1  // Only need top result
                };

                // Optimized FieldMask - request ONLY fields we actually use
                const fieldMask = [
                    'places.id',
                    'places.displayName',
                    'places.formattedAddress',
                    'places.googleMapsUri',
                    'places.types',
                    'places.nationalPhoneNumber',
                    'places.websiteUri',
                    'places.regularOpeningHours.weekdayDescriptions',
                    'places.rating',
                    'places.userRatingCount',
                    'places.editorialSummary',
                    'places.reviews',
                    'places.photos'
                ].join(',');

                const searchResponse = UrlFetchApp.fetch(textSearchUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': API_KEY,
                        'X-Goog-FieldMask': fieldMask
                    },
                    payload: JSON.stringify(searchPayload),
                    muteHttpExceptions: true
                });

                const responseCode = searchResponse.getResponseCode();
                const responseText = searchResponse.getContentText();

                if (responseCode !== 200) {
                    Logger.log(`Places API HTTP Error ${responseCode}: ${responseText}`);
                    throw new Error(`HTTP ${responseCode}`);
                }

                const searchData = JSON.parse(responseText);

                if (searchData.places && searchData.places.length > 0) {
                    const place = searchData.places[0];

                    placeInfo.source = 'places_api';
                    placeInfo.placeId = place.id || null;
                    placeInfo.name = place.displayName?.text || query;
                    placeInfo.formattedAddress = place.formattedAddress || '';
                    placeInfo.phone = place.nationalPhoneNumber || null;
                    placeInfo.website = place.websiteUri || null;
                    placeInfo.rating = place.rating || null;
                    placeInfo.userRatingCount = place.userRatingCount || null;
                    placeInfo.mapsUrl = place.googleMapsUri || placeInfo.mapsUrl;
                    placeInfo.types = place.types || [];

                    // Editorial summary
                    if (place.editorialSummary?.text) {
                        placeInfo.editorialSummary = place.editorialSummary.text;
                    }

                    // Opening hours (weekday descriptions only)
                    if (place.regularOpeningHours?.weekdayDescriptions) {
                        placeInfo.openingHours = place.regularOpeningHours.weekdayDescriptions;
                    }

                    // Reviews (limit to 3 for UI, extract only needed fields)
                    if (place.reviews && place.reviews.length > 0) {
                        placeInfo.reviews = place.reviews.slice(0, 3).map(r => ({
                            author: r.authorAttribution?.displayName || '匿名',
                            rating: r.rating || null,
                            text: (r.text?.text || '').substring(0, 200), // Truncate long reviews
                            relativeTime: r.relativePublishTimeDescription || ''
                        }));
                    }

                    // Photo URL - generate using first photo if available
                    if (place.photos && place.photos.length > 0) {
                        const photoName = place.photos[0].name;
                        if (photoName) {
                            placeInfo.photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=300&maxWidthPx=400&key=${API_KEY}`;
                        }
                    }
                } else {
                    Logger.log('Places API: No results for query: ' + query);
                }
            } catch (placesError) {
                Logger.log('Places API error for "' + query + '": ' + placesError.toString());
            }
        }

        // Fallback to Geocoding if Places API didn't return data
        if (!placeInfo.formattedAddress) {
            try {
                const geocoder = Maps.newGeocoder();
                geocoder.setLanguage('ja');
                geocoder.setRegion('jp');
                const geoResult = geocoder.geocode(query);

                if (geoResult.status === 'OK' && geoResult.results && geoResult.results.length > 0) {
                    const geoPlace = geoResult.results[0];
                    placeInfo.formattedAddress = geoPlace.formatted_address || '';
                    placeInfo.types = geoPlace.types || [];
                    placeInfo.source = 'geocoding';
                }
            } catch (geoError) {
                Logger.log('Geocoding error: ' + geoError.toString());
            }
        }

        // Generate travel tips based on place type
        placeInfo.travelTips = generateTravelTips(query, placeInfo.types || []);

        // Mark as not found if no address obtained
        if (!placeInfo.formattedAddress) {
            placeInfo.found = false;
        }

        // Cache the result (6 hours max in GAS)
        try {
            const cacheData = JSON.stringify(placeInfo);
            // Only cache if under size limit (~100KB per item)
            if (cacheData.length < 100000) {
                cache.put(cacheKey, cacheData, 21600);
            }
        } catch (cacheError) {
            Logger.log('Cache write error: ' + cacheError.toString());
        }

        return placeInfo;

    } catch (error) {
        Logger.log('getPlaceInfo fatal error: ' + error.toString());
        return {
            error: error.toString(),
            found: false,
            query: query,
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
        };
    }
}

/**
 * Generate travel tips based on place type and name
 */
function generateTravelTips(name, types) {
    const tips = [];
    const nameLower = name.toLowerCase();

    // Hotel/Lodging tips
    if (types.includes('lodging') || nameLower.includes('ホテル') || nameLower.includes('inn') || nameLower.includes('旅館') || nameLower.includes('温泉')) {
        tips.push('💡 チェックイン前でも荷物を預けられることが多いです');
        tips.push('🏪 近くのコンビニの場所を事前に確認しておくと便利です');
        tips.push('📱 WiFiパスワードはフロントで確認できます');
    }

    // Airport tips
    if (types.includes('airport') || nameLower.includes('空港') || nameLower.includes('airport')) {
        tips.push('✈️ 国内線は出発の1.5〜2時間前に到着がおすすめ');
        tips.push('💧 液体は100ml以下の容器で透明な袋に入れましょう');
        tips.push('🎒 モバイルバッテリーは預け荷物に入れられません');
    }

    // Train station tips
    if (types.includes('train_station') || nameLower.includes('駅') || nameLower.includes('station')) {
        tips.push('🚃 特急券は乗車前にホームを確認しましょう');
        tips.push('🎫 JRと私鉄は改札が別の場合があります');
        tips.push('📍 大きな駅では待ち合わせ場所を事前に決めておきましょう');
    }

    // Temple/Shrine tips
    if (types.includes('temple') || types.includes('shrine') || nameLower.includes('神社') || nameLower.includes('寺')) {
        tips.push('🙏 参拝前に手水舎で手を清めましょう');
        tips.push('💰 お賽銭用の小銭を用意しておくと便利です');
        tips.push('📸 撮影禁止の場所もあるので確認しましょう');
    }

    // Tourist attraction tips
    if (types.includes('tourist_attraction') || types.includes('museum') || nameLower.includes('観光')) {
        tips.push('🕐 午前中は比較的空いていることが多いです');
        tips.push('🎟️ 事前にオンライン予約できる場合があります');
    }

    // Onsen/Spa tips
    if (nameLower.includes('温泉') || nameLower.includes('onsen') || nameLower.includes('spa')) {
        tips.push('♨️ 入浴前に体を洗ってから湯船に入りましょう');
        tips.push('🧴 タオルは湯船に入れないのがマナーです');
        tips.push('🚫 タトゥーがある場合は事前に確認しましょう');
    }

    // Restaurant tips
    if (types.includes('restaurant') || types.includes('food') || nameLower.includes('レストラン') || nameLower.includes('ランチ')) {
        tips.push('📞 人気店は予約がおすすめです');
        tips.push('💴 現金のみの場合もあるので準備しておきましょう');
    }

    // Default tips if none matched
    if (tips.length === 0) {
        tips.push('📍 現地の営業時間を事前に確認しましょう');
        tips.push('🗺️ オフラインマップをダウンロードしておくと安心です');
    }

    return tips;
}


function doPost(e) {
    try {
        let jsonString;

        // 1. Try 'data' parameter (Form URL Encoded) - Most reliable for no-cors
        if (e.parameter && e.parameter.data) {
            jsonString = e.parameter.data;
        }

        // 2. Try raw postData content
        if (!jsonString && e.postData) {
            jsonString = e.postData.contents;
            if (!jsonString) {
                try {
                    jsonString = e.postData.getDataAsString();
                } catch (err) { }
            }
        }

        if (!jsonString) throw new Error('No valid post data found');

        const data = JSON.parse(jsonString);

        // Full Sync: Overwrite sheet with new data
        saveItineraryData(data);

        // Save last update timestamp
        const now = new Date();
        const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm');
        PropertiesService.getScriptProperties().setProperty('lastUpdate', timestamp);

        // Invalidate Cache
        try {
            const cache = CacheService.getScriptCache();
            cache.remove('itinerary_json');
        } catch (e) { }

        return createApiResponse('success', {
            message: 'Data saved successfully',
            lastUpdate: timestamp
        });

    } catch (error) {
        return createApiResponse('error', null, { message: error.toString() });
    }
}

/**
 * Read itinerary data from Google Spreadsheet and transform to app format
 */
function getItineraryData() {
    const cache = CacheService.getScriptCache();

    // Check Cache first
    try {
        const cachedData = cache.get('itinerary_json');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (e) { }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getDisplayValues();

    // Skip header row
    const rows = data.slice(1).filter(row => row[0]); // Filter empty rows

    // Group by date
    const daysMap = {};
    // Track all locations for the map
    const mapMarkers = [];

    rows.forEach((row, idx) => {
        const [
            date, dayOfWeek, title, location, weatherTemp, weatherCondition, summary,
            category, type, name, departureTime, departurePlace, arrivalTime, arrivalPlace,
            status, details, hotelName, checkInTime, bookingRef, hotelDetails
        ] = row;

        // Collect locations for map (Airport, Hotel, Sightseeing)
        if (category === '宿泊' && hotelName) mapMarkers.push(hotelName);
        if (category === '交通' && departurePlace) mapMarkers.push(departurePlace);
        if (category === '交通' && arrivalPlace) mapMarkers.push(arrivalPlace);
        if (category === 'アクティビティ' && name) mapMarkers.push(name);

        // ... (existing logic) ...
        // Create or get day object
        if (!daysMap[date]) {
            daysMap[date] = {
                id: `day-${Object.keys(daysMap).length + 1}`,
                date: date,
                dayOfWeek: dayOfWeek,
                title: title,
                location: location,
                weather: { temp: weatherTemp, condition: weatherCondition },
                summary: summary,
                events: []
            };
        }

        const day = daysMap[date];

        // Create event based on category
        if (category === '宿泊') {
            day.events.push({
                id: `e${Object.keys(daysMap).length}-${day.events.length + 1}`,
                type: 'stay',
                category: 'hotel',
                name: hotelName,
                time: (checkInTime || '').split('-')[0] || '15:00',
                checkIn: checkInTime,
                status: status || 'confirmed',
                bookingRef: (bookingRef || '').replace('予約番号: ', ''),
                details: hotelDetails
            });
        } else if (category === '交通') {
            day.events.push({
                id: `e${Object.keys(daysMap).length}-${day.events.length + 1}`,
                type: 'transport',
                category: type || 'other',
                name: name,
                time: departureTime,
                endTime: arrivalTime,
                place: departurePlace,
                to: arrivalPlace,
                status: status || 'planned',
                details: details
            });
        } else if (category === 'アクティビティ') {
            day.events.push({
                id: `e${Object.keys(daysMap).length}-${day.events.length + 1}`,
                type: 'activity',
                category: type || 'sightseeing',
                name: name,
                time: departureTime,
                description: details,
                status: status || 'planned'
            });
        }
    });

    // Generate Static Map URL (with fallback strategy)
    let mapUrl = null;
    let mapError = null;

    if (mapMarkers.length > 0) {
        const uniqueLocations = [...new Set(mapMarkers)].filter(l => l && !l.match(/^\d{3}-\d{4}$/));

        // Strategy 1: Try all markers (limit 15)
        try {
            mapUrl = generateStaticMapUrl(uniqueLocations.slice(0, 15));
        } catch (e1) {
            Logger.log(`Map Gen Strategy 1 Failed: ${e1}`);

            // Strategy 2: Try fewer markers (Start, End, and up to 3 intermediates)
            try {
                const importantLocs = [];
                if (uniqueLocations.length > 0) importantLocs.push(uniqueLocations[0]);
                if (uniqueLocations.length > 1) importantLocs.push(uniqueLocations[uniqueLocations.length - 1]);
                // Add a few random middles if available
                if (uniqueLocations.length > 5) {
                    importantLocs.push(uniqueLocations[Math.floor(uniqueLocations.length / 2)]);
                }
                mapUrl = generateStaticMapUrl(importantLocs);
            } catch (e2) {
                Logger.log(`Map Gen Strategy 2 Failed: ${e2}`);

                // Strategy 3: Try just the FIRST location (Center map)
                try {
                    if (uniqueLocations.length > 0) {
                        mapUrl = generateStaticMapUrl([uniqueLocations[0]]);
                    }
                } catch (e3) {
                    mapError = 'Map Gen Failed: ' + e3.toString();
                    Logger.log(mapError);
                }
            }
        }
    }

    // Convert to array and sort events by time
    const result = Object.values(daysMap).map(day => ({
        ...day,
        events: day.events.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
    }));

    const response = {
        days: result,
        mapUrl: mapUrl,
        mapError: mapError,
        lastUpdate: PropertiesService.getScriptProperties().getProperty('lastUpdate') || null
    };


    // Cache the response (JSON string) for 30 minutes (1800 seconds)
    try {
        cache.put('itinerary_json', JSON.stringify(response), 1800);
    } catch (e) { }

    return response;
}

/**
 * Save itinerary data (Full Sync) to Spreadsheet
 */
function saveItineraryData(days) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    // Prepare rows
    const rows = [];

    // Header columns (kept for reference, not used in code):
    // '日付', '曜日', 'タイトル', '場所', '天気(気温)', '天気(状態)', 'サマリー',
    // 'カテゴリ', '種別', '名称', '出発時刻', '出発地', '到着時刻', '到着地',
    // 'ステータス', '詳細', '宿泊施設名', 'チェックイン時間', '予約番号', '宿泊詳細'

    days.forEach(day => {
        day.events.forEach(event => {
            let row = new Array(20).fill('');

            // Common Day Info
            row[0] = day.date;
            row[1] = day.dayOfWeek;
            row[2] = day.title;
            row[3] = day.location;
            row[4] = day.weather ? day.weather.temp : '';
            row[5] = day.weather ? day.weather.condition : '';
            row[6] = day.summary;

            // Event Specifics
            if (event.type === 'stay') {
                row[7] = '宿泊';
                row[8] = '';
                row[9] = ''; // 名称 col 10 is empty for stay in original CSV mapping? No, wait.
                // In original CSV: 
                // Col 10 (J) is '名称' for transport/activity
                // Col 17 (Q) is '宿泊施設名'
                // Let's follow the reading logic reversed.

                row[14] = event.status;
                row[16] = event.name;
                row[17] = event.checkIn;
                row[18] = event.bookingRef ? `予約番号: ${event.bookingRef}` : '';
                row[19] = event.details;

            } else if (event.type === 'transport') {
                row[7] = '交通';
                row[8] = event.category;
                row[9] = event.name;
                row[10] = event.time;
                row[11] = event.place;
                row[12] = event.endTime;
                row[13] = event.to;
                row[14] = event.status;
                row[15] = event.details;

            } else { // activity
                row[7] = 'アクティビティ';
                row[8] = event.category;
                row[9] = event.name;
                row[10] = event.time;
                row[14] = event.status;
                row[15] = event.description;
            }

            rows.push(row);
        });
    });

    // Clear old data and write new
    // Assuming row 1 is header, data starts at row 2
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 20).clearContent();
    }

    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 20).setValues(rows);
    }

    try {
        const cache = CacheService.getScriptCache();
        cache.remove('itinerary_json');
    } catch (e) { }
}

/**
 * Helper to generate static map base64 from list of locations
 */
function generateStaticMapUrl(locations) {
    if (!locations || locations.length === 0) return null;

    const map = Maps.newStaticMap()
        .setSize(600, 400)
        .setLanguage('ja'); // Note: 'ja' sometimes causes issues if locale not supported 

    locations.forEach(loc => {
        map.addMarker(loc);
    });

    const blob = map.getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    return 'data:image/png;base64,' + base64;
}
