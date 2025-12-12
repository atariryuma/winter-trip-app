import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import server from '../api/gas';
import { parseDurationToMinutes, formatDuration } from '../utils';

const TimeConnector = ({ duration, isEditMode, onInsert, fromLocation, toLocation }) => {
    const [travelMinutes, setTravelMinutes] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch travel time (uses API/local cache)
    useEffect(() => {
        if (!fromLocation?.trim() || !toLocation?.trim()) {
            setTravelMinutes(null);
            return;
        }

        let isCancelled = false;

        const fetchTravelTime = async () => {
            setLoading(true);
            try {
                const routeData = await server.getRouteMap(fromLocation, toLocation);
                // Only update state if this effect hasn't been superseded
                if (!isCancelled && routeData?.duration) {
                    const minutes = parseDurationToMinutes(routeData.duration);
                    setTravelMinutes(minutes > 0 ? minutes : null);
                } else if (!isCancelled) {
                    setTravelMinutes(null);
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error('Travel time fetch failed:', err);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };
        fetchTravelTime();

        // Cleanup: prevent state updates from stale requests
        return () => {
            isCancelled = true;
        };
    }, [fromLocation, toLocation]);

    // Calculate margin: available time - travel time
    const margin = travelMinutes !== null && duration !== null ? duration - travelMinutes : null;

    // Determine status based on margin (or fallback to duration if no travel time)
    const getStatus = () => {
        if (duration === null || duration === undefined) return 'unknown';

        if (travelMinutes !== null && margin !== null) {
            // With travel time: check margin
            if (margin < 0) return 'overlap';   // Not enough time to travel
            if (margin < 10) return 'tight';    // Less than 10 min buffer
            return 'ok';
        }

        // Fallback: use duration directly
        if (duration < 0) return 'overlap';
        if (duration < 15) return 'tight';
        return 'ok';
    };

    const status = getStatus();

    // Display text - always show raw duration, color indicates margin status
    const getText = () => {
        if (loading) return '...';
        if (duration === null || duration === undefined) return null;

        const durationText = formatDuration(duration);

        // Add icons based on status
        if (status === 'overlap') {
            // Show negative margin in consistent format
            const overlapMins = Math.abs(margin !== null ? margin : duration);
            return `⛔ -${formatDuration(overlapMins)}`;
        }
        if (status === 'tight') return `⚠️ ${durationText}`;
        return durationText;  // ok status - no icon
    };

    // Color classes
    const getColorClasses = () => {
        switch (status) {
            case 'overlap':
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
            case 'tight':
                return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700';
            case 'ok':
                return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
            default:
                return 'text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700';
        }
    };

    const text = getText();

    // Do not render empty connector if no duration context
    if (duration === null && !isEditMode) return null;

    return (
        <div className="flex items-center py-2 pl-6">
            <div className="w-0.5 h-10 bg-gray-200 dark:bg-slate-700 relative">
                {/* Insert button in edit mode */}
                <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isEditMode ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-0 pointer-events-none'}`}>
                    {onInsert && (
                        <button
                            onClick={onInsert}
                            className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 active:scale-95 transition-transform"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
                {/* Duration badge */}
                {text && (
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap transition-all duration-300 ${isEditMode ? 'opacity-0 translate-x-[-10px]' : 'opacity-100 translate-x-0'}`}>
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1 ${getColorClasses()}`}>
                            {text}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeConnector;
