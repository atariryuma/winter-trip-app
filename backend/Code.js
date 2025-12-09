const SPREADSHEET_ID = '1eoZtWfOECvkp_L3919yWYnZtlMPlTaq0cohV56SrE7I';
const SHEET_NAME = 'tripdata';

function doGet(e) {
    // API Mode: return JSON data
    if (e && e.parameter && e.parameter.action === 'getData') {
        const data = getItineraryData();
        return ContentService.createTextOutput(JSON.stringify(data))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // Validate Passcode
    if (e && e.parameter && e.parameter.action === 'validatePasscode') {
        const inputCode = e.parameter.code || '';
        const storedCode = PropertiesService.getScriptProperties().getProperty('APP_PASSCODE') || '2025';
        const valid = inputCode === storedCode;
        return ContentService.createTextOutput(JSON.stringify({ valid }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // Get Place Info (new feature)
    if (e && e.parameter && e.parameter.action === 'getPlaceInfo') {
        const query = e.parameter.query || '';
        const placeInfo = getPlaceInfo(query);
        return ContentService.createTextOutput(JSON.stringify(placeInfo))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // Default: Redirect to GitHub Pages (Frontend is hosted there)
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

/**
 * Get place information using Google Places API (New)
 * Falls back to basic Geocoding if no API key available
 * @param {string} query - Place name or address to search
 * @returns {object} Place information with dynamic data
 */
function getPlaceInfo(query) {
    if (!query || query.trim() === '') {
        return { error: 'No query provided', found: false };
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = 'place_v2_' + Utilities.base64Encode(query);

    // Check cache first (6 hours - GAS max is 21600s)
    try {
        const cached = cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) { }

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
            reviews: [],
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
            travelTips: [],
            source: 'geocoding' // or 'places_api'
        };

        if (API_KEY) {
            // NOTE: Places API (New) is temporarily disabled due to UrlFetchApp permission issues
            // with anonymous GAS Web App deployments. Using Geocoding fallback only.
            // TODO: Re-enable when GCP project linking is properly configured.
            /*
            // Use Places API (New) - Text Search to find place
            const textSearchUrl = `https://places.googleapis.com/v1/places:searchText`;
            const searchPayload = {
                textQuery: query,
                languageCode: 'ja',
                regionCode: 'JP',
                maxResultCount: 1
            };

            const searchResponse = UrlFetchApp.fetch(textSearchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.regularOpeningHours,places.editorialSummary,places.reviews,places.googleMapsUri'
                },
                payload: JSON.stringify(searchPayload),
                muteHttpExceptions: true
            });

            const searchData = JSON.parse(searchResponse.getContentText());

            if (searchData.places && searchData.places.length > 0) {
                const place = searchData.places[0];

                placeInfo.source = 'places_api';
                placeInfo.formattedAddress = place.formattedAddress || '';
                placeInfo.phone = place.nationalPhoneNumber || null;
                placeInfo.website = place.websiteUri || null;
                placeInfo.rating = place.rating || null;
                placeInfo.userRatingCount = place.userRatingCount || null;
                placeInfo.mapsUrl = place.googleMapsUri || placeInfo.mapsUrl;

                // Editorial summary
                if (place.editorialSummary && place.editorialSummary.text) {
                    placeInfo.editorialSummary = place.editorialSummary.text;
                }

                // Opening hours
                if (place.regularOpeningHours && place.regularOpeningHours.weekdayDescriptions) {
                    placeInfo.openingHours = place.regularOpeningHours.weekdayDescriptions;
                }

                // Reviews (up to 3 for display)
                if (place.reviews && place.reviews.length > 0) {
                    placeInfo.reviews = place.reviews.slice(0, 3).map(r => ({
                        author: r.authorAttribution?.displayName || '匿名',
                        rating: r.rating || null,
                        text: r.text?.text || '',
                        relativeTime: r.relativePublishTimeDescription || ''
                    }));
                }
            }
            */
        }

        // Fallback to Geocoding if Places API didn't return data
        if (!placeInfo.formattedAddress) {
            const geocoder = Maps.newGeocoder();
            geocoder.setLanguage('ja');
            geocoder.setRegion('jp');
            const geoResult = geocoder.geocode(query);

            if (geoResult.status === 'OK' && geoResult.results && geoResult.results.length > 0) {
                const place = geoResult.results[0];
                placeInfo.formattedAddress = place.formatted_address || '';
                placeInfo.types = place.types || [];
            }
        }

        // Generate travel tips (smart tips based on name/type)
        placeInfo.travelTips = generateTravelTips(query, placeInfo.types || []);

        // Mark as not found if no address
        if (!placeInfo.formattedAddress) {
            placeInfo.found = false;
        }

        // Cache the result for 6 hours
        try {
            cache.put(cacheKey, JSON.stringify(placeInfo), 21600);
        } catch (e) { }

        return placeInfo;

    } catch (error) {
        return { error: error.toString(), found: false, query: query };
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

        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: 'Data saved successfully',
            lastUpdate: timestamp
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: 'error',
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
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

    // Generate Static Map URL (if markers exist)
    let mapUrl = null;
    if (mapMarkers.length > 0) {
        try {
            // Using unique locations only to save URL length
            const uniqueLocations = [...new Set(mapMarkers)].slice(0, 15); // Limit to 15 to avoid URL limit
            if (uniqueLocations.length > 0) {
                const map = Maps.newStaticMap()
                    .setSize(600, 400)
                    .setLanguage('ja');
                uniqueLocations.forEach((loc, i) => {
                    map.addMarker(loc);
                    // Add path? Maybe too complex for simple view. Markers are fine.
                });
                // We cannot return the Blob URL directly to frontend efficiently without base64 or hosting.
                // Best for GAS Web App: Return Base64 data URI
                const blob = map.getBlob();
                const base64 = Utilities.base64Encode(blob.getBytes());
                mapUrl = 'data:image/png;base64,' + base64;
            }
        } catch (e) {
            // Map generation failed (quota or bad address), ignore
            mapUrl = null;
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

    // Header
    const header = [
        '日付', '曜日', 'タイトル', '場所', '天気(気温)', '天気(状態)', 'サマリー',
        'カテゴリ', '種別', '名称', '出発時刻', '出発地', '到着時刻', '到着地',
        'ステータス', '詳細', '宿泊施設名', 'チェックイン時間', '予約番号', '宿泊詳細'
    ];
    // Don't add header to rows (we keep existing header or rewrite it)
    // Actually, let's just clear content from row 2 and rewrite data

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

    // Invalidate Cache
    try {
        const cache = CacheService.getScriptCache();
        cache.remove('itinerary_json');
    } catch (e) { }
}
