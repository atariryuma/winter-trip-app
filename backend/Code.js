const SPREADSHEET_ID = '1eoZtWfOECvkp_L3919yWYnZtlMPlTaq0cohV56SrE7I';
const SHEET_NAME = 'tripdata';

function doGet(e) {
    // API Mode: return JSON data
    if (e && e.parameter && e.parameter.action === 'getData') {
        const data = getItineraryData();
        return ContentService.createTextOutput(JSON.stringify(data))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // Default: return HTML app
    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('Winter Trip')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);

        // Full Sync: Overwrite sheet with new data
        saveItineraryData(data);

        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            message: 'Data saved successfully'
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
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    // Skip header row
    const rows = data.slice(1).filter(row => row[0]); // Filter empty rows

    // Group by date
    const daysMap = {};

    rows.forEach((row, idx) => {
        const [
            date, dayOfWeek, title, location, weatherTemp, weatherCondition, summary,
            category, type, name, departureTime, departurePlace, arrivalTime, arrivalPlace,
            status, details, hotelName, checkInTime, bookingRef, hotelDetails
        ] = row;

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

    // Convert to array and sort events by time
    const result = Object.values(daysMap).map(day => ({
        ...day,
        events: day.events.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'))
    }));

    return result;
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
}
