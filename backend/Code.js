function doGet(e) {
    const params = e.parameter;
    let result = {};

    if (params.action === 'getItinerary') {
        result = getTripData();
    } else {
        result = {
            status: 'success',
            message: 'Hello from GAS Backend! Use ?action=getItinerary to get trip data.'
        };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
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
