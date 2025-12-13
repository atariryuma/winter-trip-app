import { useReducer, useCallback, useEffect, useState } from 'react';
import server from '../api/gas';
import { generateId } from '../utils';
import { initialItinerary } from '../data/initialData';

// Action Types
const ACTIONS = {
    SET_ITINERARY: 'SET_ITINERARY',
    SET_SELECTED_DAY: 'SET_SELECTED_DAY',
    UPDATE_EVENT: 'UPDATE_EVENT',
    ADD_EVENT: 'ADD_EVENT',
    DELETE_EVENT: 'DELETE_EVENT',
    MOVE_EVENT: 'MOVE_EVENT',
    ADD_DAY: 'ADD_DAY',
    DELETE_DAY: 'DELETE_DAY',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    SET_SAVING: 'SET_SAVING',
    SET_LAST_UPDATE: 'SET_LAST_UPDATE',
};

// Helper: Determine event type from category
const getCategoryType = (category) => {
    if (category === 'hotel') return 'stay';
    if (['flight', 'train', 'bus'].includes(category)) return 'transport';
    return 'activity';
};

// Initial state
const createInitialState = () => ({
    itinerary: [],
    selectedDayId: null,
    loading: true,
    saving: false,
    error: null,
    lastUpdate: localStorage.getItem('lastUpdate') || null,
});

// Reducer
function itineraryReducer(state, action) {
    switch (action.type) {
        case ACTIONS.SET_ITINERARY:
            return {
                ...state,
                itinerary: action.payload,
                loading: false,
                error: null,
            };

        case ACTIONS.SET_SELECTED_DAY:
            return {
                ...state,
                selectedDayId: action.payload,
            };

        case ACTIONS.UPDATE_EVENT: {
            const { dayId, eventId, eventData } = action.payload;
            return {
                ...state,
                itinerary: state.itinerary.map(day =>
                    day.id === dayId
                        ? {
                            ...day,
                            events: day.events.map(e =>
                                e.id === eventId ? { ...e, ...eventData } : e
                            ),
                        }
                        : day
                ),
            };
        }

        case ACTIONS.ADD_EVENT: {
            const { dayId, event } = action.payload;
            return {
                ...state,
                itinerary: state.itinerary.map(day =>
                    day.id === dayId
                        ? { ...day, events: [...day.events, event] }
                        : day
                ),
            };
        }

        case ACTIONS.DELETE_EVENT: {
            const { eventId } = action.payload;
            return {
                ...state,
                itinerary: state.itinerary.map(day => ({
                    ...day,
                    events: day.events.filter(e => e.id !== eventId),
                })),
            };
        }

        case ACTIONS.MOVE_EVENT: {
            const { eventId, fromDate, toDate, eventData } = action.payload;
            return {
                ...state,
                itinerary: state.itinerary.map(day => {
                    if (day.date === fromDate) {
                        return { ...day, events: day.events.filter(e => e.id !== eventId) };
                    }
                    if (day.date === toDate) {
                        return { ...day, events: [...day.events, eventData] };
                    }
                    return day;
                }),
            };
        }

        case ACTIONS.ADD_DAY:
            return {
                ...state,
                itinerary: [...state.itinerary, action.payload],
            };

        case ACTIONS.DELETE_DAY: {
            const { date } = action.payload;
            const newItinerary = state.itinerary.filter(day => day.date !== date);
            const newSelectedDayId = newItinerary.length > 0
                ? (newItinerary.find(d => d.id === state.selectedDayId)?.id || newItinerary[0].id)
                : null;
            return {
                ...state,
                itinerary: newItinerary,
                selectedDayId: newSelectedDayId,
            };
        }

        case ACTIONS.SET_LOADING:
            return { ...state, loading: action.payload };

        case ACTIONS.SET_ERROR:
            return { ...state, error: action.payload, loading: false };

        case ACTIONS.SET_SAVING:
            return { ...state, saving: action.payload };

        case ACTIONS.SET_LAST_UPDATE:
            return { ...state, lastUpdate: action.payload };

        default:
            return state;
    }
}

/**
 * Custom hook for managing itinerary state
 * Extracts all itinerary-related logic from TravelApp
 */
export function useItinerary(showToast) {
    const [state, dispatch] = useReducer(itineraryReducer, null, createInitialState);

    // Fetch data from server
    const fetchData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                dispatch({ type: ACTIONS.SET_LOADING, payload: true });
            }

            const data = await server.getData();
            let daysData = [];

            if (Array.isArray(data)) {
                daysData = data;
            } else if (data && data.days) {
                daysData = data.days;
            }

            if (daysData && daysData.length > 0) {
                dispatch({ type: ACTIONS.SET_ITINERARY, payload: daysData });
                dispatch({
                    type: ACTIONS.SET_SELECTED_DAY,
                    payload: (prev) => {
                        // This is handled in the component
                        return daysData.some(d => d.id === state.selectedDayId)
                            ? state.selectedDayId
                            : daysData[0].id;
                    },
                });
                // Actually set selected day
                if (!state.selectedDayId || !daysData.some(d => d.id === state.selectedDayId)) {
                    dispatch({ type: ACTIONS.SET_SELECTED_DAY, payload: daysData[0].id });
                }

                if (data.lastUpdate) {
                    dispatch({ type: ACTIONS.SET_LAST_UPDATE, payload: data.lastUpdate });
                    localStorage.setItem('lastUpdate', data.lastUpdate);
                }
            } else {
                throw new Error('No data');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            // Fallback to initial data only on first load
            if (state.itinerary.length === 0) {
                dispatch({ type: ACTIONS.SET_ITINERARY, payload: initialItinerary });
                dispatch({ type: ACTIONS.SET_SELECTED_DAY, payload: initialItinerary[0].id });
            }
            dispatch({ type: ACTIONS.SET_ERROR, payload: `Load error: ${err.message}` });
        }
    }, [state.itinerary.length, state.selectedDayId]);

    // Save itinerary to session storage
    useEffect(() => {
        if (state.itinerary.length > 0) {
            sessionStorage.setItem('trip_data_v7', JSON.stringify(state.itinerary));
        }
    }, [state.itinerary]);

    // Set selected day
    const setSelectedDayId = useCallback((dayId) => {
        dispatch({ type: ACTIONS.SET_SELECTED_DAY, payload: dayId });
    }, []);

    // Save event (add or update)
    const saveEvent = useCallback(async (newItem, editItem, selectedDayId) => {
        // Deep copy for rollback using structuredClone
        const previousItinerary = structuredClone(state.itinerary);

        const isMoving = newItem.newDate && newItem.newDate !== newItem.originalDate;
        const isEdit = editItem?.id && state.itinerary.some(day => day.events.some(e => e.id === editItem.id));

        // Find target day
        const targetDay = isMoving
            ? state.itinerary.find(d => d.date === newItem.newDate)
            : state.itinerary.find(d => d.id === selectedDayId);

        if (!targetDay) {
            console.error('targetDay not found', { isMoving, newDate: newItem.newDate, selectedDayId });
            showToast?.('error', '対象の日程が見つかりません');
            return false;
        }

        // Optimistic update
        if (isMoving) {
            const cleanItem = { ...newItem };
            delete cleanItem.newDate;
            delete cleanItem.originalDate;
            dispatch({
                type: ACTIONS.MOVE_EVENT,
                payload: {
                    eventId: newItem.id,
                    fromDate: newItem.originalDate,
                    toDate: newItem.newDate,
                    eventData: cleanItem,
                },
            });
        } else if (isEdit) {
            dispatch({
                type: ACTIONS.UPDATE_EVENT,
                payload: {
                    dayId: selectedDayId,
                    eventId: newItem.id,
                    eventData: newItem,
                },
            });
        } else {
            const newEvent = {
                ...newItem,
                id: generateId(),
                type: getCategoryType(newItem.category),
            };
            dispatch({
                type: ACTIONS.ADD_EVENT,
                payload: { dayId: selectedDayId, event: newEvent },
            });
        }

        // Background save
        try {
            dispatch({ type: ACTIONS.SET_SAVING, payload: true });

            if (isMoving) {
                const originalDay = state.itinerary.find(d => d.date === newItem.originalDate);
                const originalEvent = originalDay?.events.find(e => e.id === newItem.id);
                const originalEventName = originalEvent?.name || newItem.name;

                await server.moveEvent({
                    originalDate: newItem.originalDate,
                    eventId: originalEventName,
                    newDate: newItem.newDate,
                    newStartTime: newItem.time,
                    newEndTime: newItem.endTime,
                });
            } else if (isEdit) {
                const originalEvent = previousItinerary.find(d => d.id === selectedDayId)?.events.find(e => e.id === newItem.id);
                await server.batchUpdateEvents([{
                    date: targetDay.date,
                    eventId: originalEvent?.name || newItem.name,
                    eventData: newItem,
                }]);
            } else {
                await server.addEvent({ ...newItem, date: targetDay.date });
            }

            // Cache invalidation
            if (isEdit && editItem) {
                if (editItem.name !== newItem.name) server.invalidateLocationCache(editItem.name);
                if (editItem.to !== newItem.to) server.invalidateLocationCache(editItem.to);
                if (editItem.from !== newItem.from) server.invalidateLocationCache(editItem.from);
            }

            return true;
        } catch (err) {
            console.error('Save error:', err);
            // Rollback
            dispatch({ type: ACTIONS.SET_ITINERARY, payload: previousItinerary });
            showToast?.('error', '保存に失敗しました。変更を元に戻しました。');
            return false;
        } finally {
            dispatch({ type: ACTIONS.SET_SAVING, payload: false });
        }
    }, [state.itinerary, showToast]);

    // Delete event
    const deleteEvent = useCallback(async (id) => {
        // Deep copy for rollback
        const previousItinerary = structuredClone(state.itinerary);

        // Find event
        let eventToDelete, dayDate;
        for (const day of state.itinerary) {
            const event = day.events.find(e => e.id === id);
            if (event) {
                eventToDelete = event;
                dayDate = day.date;
                break;
            }
        }

        // Optimistic update
        dispatch({ type: ACTIONS.DELETE_EVENT, payload: { eventId: id } });

        // Background delete
        if (eventToDelete && dayDate) {
            try {
                dispatch({ type: ACTIONS.SET_SAVING, payload: true });
                await server.deleteEvent(dayDate, eventToDelete.name);
                return true;
            } catch (err) {
                console.error('Delete error:', err);
                dispatch({ type: ACTIONS.SET_ITINERARY, payload: previousItinerary });
                showToast?.('error', '削除に失敗しました。変更を元に戻しました。');
                return false;
            } finally {
                dispatch({ type: ACTIONS.SET_SAVING, payload: false });
            }
        }
        return false;
    }, [state.itinerary, showToast]);

    // Delete day
    const deleteDay = useCallback(async (date) => {
        const previousItinerary = structuredClone(state.itinerary);

        dispatch({ type: ACTIONS.DELETE_DAY, payload: { date } });

        try {
            dispatch({ type: ACTIONS.SET_SAVING, payload: true });
            await server.deleteEventsByDate(date);
            return true;
        } catch (err) {
            console.error('Delete day error:', err);
            dispatch({ type: ACTIONS.SET_ITINERARY, payload: previousItinerary });
            showToast?.('error', '日程の削除に失敗しました。変更を元に戻しました。');
            return false;
        } finally {
            dispatch({ type: ACTIONS.SET_SAVING, payload: false });
        }
    }, [state.itinerary, showToast]);

    // Add new day
    const addDay = useCallback(async (newDay) => {
        dispatch({ type: ACTIONS.ADD_DAY, payload: newDay });
        dispatch({ type: ACTIONS.SET_SELECTED_DAY, payload: newDay.id });

        const placeholderEvent = newDay.events[0];
        if (placeholderEvent) {
            try {
                dispatch({ type: ACTIONS.SET_SAVING, payload: true });
                await server.addEvent({ ...placeholderEvent, date: newDay.date });
                return true;
            } catch (err) {
                console.error('Save error:', err);
                showToast?.('error', '日程の追加に失敗しました。');
                return false;
            } finally {
                dispatch({ type: ACTIONS.SET_SAVING, payload: false });
            }
        }
        return true;
    }, [showToast]);

    return {
        ...state,
        fetchData,
        setSelectedDayId,
        saveEvent,
        deleteEvent,
        deleteDay,
        addDay,
    };
}

export default useItinerary;
