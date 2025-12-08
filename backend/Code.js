function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Hello from GAS Backend!'
    })).setMimeType(ContentService.MimeType.JSON);
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
