import React, { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import server from '../api/gas';
import { parseDurationToMinutes } from '../utils';

/**
 * DepartureIndicator - Shows previous day hotel and recommended departure time
 * Calculates departure time by subtracting route duration from first event's start time
 */
const DepartureIndicator = ({ prevHotel, firstEvent }) => {
    const [routeDuration, setRouteDuration] = useState(null);
    const [loading, setLoading] = useState(false);

    // Extract primitive values for optimization - only recalculates when these values change
    const origin = prevHotel?.name || null;
    // Skip route calculation for flights (driving directions don't apply)
    const isFlightFirst = firstEvent?.category === 'flight';
    const destination = firstEvent && !isFlightFirst
        ? (firstEvent.type === 'transport' ? firstEvent.from : (firstEvent.to || firstEvent.name))
        : null;
    const firstEventTime = firstEvent?.time || null;

    // Fetch route duration only when origin/destination changes
    useEffect(() => {
        // Reset if missing required data or if first event is a flight
        if (!origin || !destination) {
            setRouteDuration(null);
            return;
        }

        let isCancelled = false;

        const fetchRouteDuration = async () => {
            setLoading(true);
            try {
                const routeData = await server.getRouteMap(origin, destination);
                // Only update state if this effect hasn't been superseded
                if (!isCancelled && routeData?.duration) {
                    const totalMinutes = parseDurationToMinutes(routeData.duration) || 0;

                    if (totalMinutes > 0) {
                        setRouteDuration(totalMinutes);
                    } else {
                        setRouteDuration(null);
                    }
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error('Failed to fetch route duration:', err);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        fetchRouteDuration();

        // Cleanup: prevent state updates from stale requests
        return () => {
            isCancelled = true;
        };
    }, [origin, destination]); // Only re-fetch when origin/destination strings change

    // Calculate recommended departure time - only recalculates when time or duration changes
    const recommendedTime = useMemo(() => {
        if (!firstEventTime || !routeDuration) return null;

        // Parse first event time (e.g., "10:00" -> 600 minutes)
        const [hours, minutes] = firstEventTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;

        const eventMinutes = hours * 60 + minutes;

        // Subtract route duration + 10 min buffer
        const departureMinutes = eventMinutes - routeDuration - 10;

        // Handle negative times (would be previous day)
        if (departureMinutes < 0) {
            // If departure time would be in the previous day, show warning
            return '前日泊推奨';
        }

        // Convert back to time string
        const depHours = Math.floor(departureMinutes / 60);
        const depMins = departureMinutes % 60;

        return `${String(depHours).padStart(2, '0')}:${String(depMins).padStart(2, '0')}`;
    }, [firstEventTime, routeDuration]);

    const isWarning = recommendedTime === '前日泊推奨';

    if (!prevHotel) return null;

    return (
        <div className="flex items-center py-2 pl-6">
            <div className="w-0.5 h-8 bg-gray-200 dark:bg-slate-700 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 max-w-[calc(100vw-5rem)]">
                    <div className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full border shadow-sm max-w-full ${isWarning
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800'
                        : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800'
                        }`}>
                        {loading ? (
                            <span className="text-xs opacity-70">計算中...</span>
                        ) : recommendedTime && (
                            <span className={`flex items-center gap-1 ${!isWarning && 'border-r border-indigo-200 dark:border-indigo-700 pr-2 mr-1'}`}>
                                {!isWarning && <Clock size={14} />}
                                {recommendedTime}
                            </span>
                        )}
                        <span className="truncate min-w-0">{prevHotel.name} 出発</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepartureIndicator;
