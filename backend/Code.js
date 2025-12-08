function doGet(e) {
    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('Tabi Log')
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
