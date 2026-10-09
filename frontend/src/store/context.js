import { createContext, useContext } from 'react';

export const TripContext = createContext(null);

export const useTrip = () => {
    const ctx = useContext(TripContext);
    if (!ctx) throw new Error('useTrip must be used within TripProvider');
    return ctx;
};
