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
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        return ContentService.createTextOutput(JSON.stringify({
            status: 'success',
            received: data
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

// Test function (run in GAS editor)
function testGetData() {
    const data = getItineraryData();
    Logger.log(JSON.stringify(data, null, 2));
}
