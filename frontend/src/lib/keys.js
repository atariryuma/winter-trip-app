// localStorage keys (v1 names kept so existing data carries over)
export const PAYERS_KEY = 'travel_payers';
export const BUDGET_GOAL_KEY = 'travel_budget_goal';
export const TRIP_TITLE_KEY = 'trip_title';
export const CURRENT_TRIP_KEY = 'current_trip';
// Trip settings while the backend has no trips sheet (API v1)
export const LEGACY_TRIP_KEY = 'legacy_trip';
export const DEFAULT_TRIP_ID = 'default';
export const DEFAULT_TRIP_TITLE = '家族旅行';

// The shopping list lives on the device, one per trip. The first trip keeps the v1 key.
export const shoppingKey = (tripId) => (!tripId || tripId === DEFAULT_TRIP_ID ? 'shoppingList' : `shoppingList:${tripId}`);
