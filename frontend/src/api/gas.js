export const GAS_API_URL = import.meta.env.VITE_GAS_API_URL || '';

/**
 * Sends a POST request to the GAS Web App.
 * Note: GAS Web App must be deployed as "Me" and "Anyone" (or specific logic) to be accessible.
 * To avoid CORS preflight issues, we use 'text/plain' content type.
 */
export const postToGAS = async (data) => {
    if (!GAS_API_URL) {
        console.warn('GAS_API_URL is not set. Returning mock response.');
        return new Promise(resolve => setTimeout(() => resolve({ status: 'success', message: 'Mock Data' }), 500));
    }

    const response = await fetch(GAS_API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`GAS request failed: ${response.statusText}`);
    }

    return response.json();
};
