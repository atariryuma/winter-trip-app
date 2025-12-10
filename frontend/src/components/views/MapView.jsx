import React, { useMemo, useState } from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';

/**
 * MapView - Simplified Layout with Multiple Pins
 * - Uses Google Maps Embed API (more reliable than Static Maps)
 * - Day-based filtering
 * - When clicking a pill, shows that specific location
 */
const MapView = ({ mapUrl, itinerary, mapError }) => {
    const [activeDay, setActiveDay] = useState('all');
    const [mapCenter, setMapCenter] = useState(null);

    const API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8';

    // Filter markers based on active day
    // Transport: use 'to' field (destination)
    // Others (hotel/meal/sightseeing): use 'name' field
    const markers = useMemo(() => {
        let events = [];
        if (activeDay === 'all') {
            events = itinerary.flatMap((day, i) => day.events.map(e => ({ ...e, dayLabel: `Day ${i + 1}`, dayId: day.id })));
        } else {
            const day = itinerary.find(d => d.id === activeDay);
            if (day) {
                const idx = itinerary.indexOf(day);
                events = day.events.map(e => ({ ...e, dayLabel: `Day ${idx + 1}`, dayId: day.id }));
            }
        }

        const locs = [];
        events.forEach(e => {
            // Determine the location query based on event type
            let query = null;
            const isTransport = ['flight', 'train', 'bus'].includes(e.category);

            if (isTransport) {
                // For transport, use the destination (to)
                query = e.to;
            } else {
                // For hotel/meal/sightseeing, use the name
                query = e.name;
            }

            if (!query) return;

            if (!locs.find(l => l.query === query)) {
                locs.push({
                    name: e.name || query,
                    query: query,
                    type: isTransport ? 'transport' : e.category === 'hotel' ? 'hotel' : e.category === 'meal' ? 'meal' : 'activity'
                });
            }
        });
        return locs;
    }, [itinerary, activeDay]);



    // Current map query
    const currentMapQuery = useMemo(() => {
        if (mapCenter) return mapCenter;
        if (markers.length > 0) return markers[0].query;
        return '日本';
    }, [markers, mapCenter]);

    // Use Embed API - more reliable
    const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(currentMapQuery)}&zoom=13&language=ja`;

    // Google Maps URL for route with all markers
    const allMarkersUrl = useMemo(() => {
        if (markers.length === 0) return 'https://www.google.com/maps';
        if (markers.length === 1) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(markers[0].query)}`;
        }
        const origin = encodeURIComponent(markers[0].query);
        const destination = encodeURIComponent(markers[markers.length - 1].query);
        const waypoints = markers.slice(1, -1).slice(0, 9).map(m => encodeURIComponent(m.query)).join('|');
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
    }, [markers]);

    // Emoji icon helper
    const getEmoji = (type) => {
        switch (type) {
            case 'hotel': return '🏨';
            case 'meal': return '🍽️';
            case 'transport': return '🚉';
            default: return '📍';
        }
    };

    return (
        <div className="flex flex-col lg:flex-row lg:gap-4 h-[70vh] lg:h-[calc(100vh-10rem)] w-full max-w-full box-border">
            {/* Map Area */}
            <div className="flex-[2_1_0%] lg:flex-1 relative min-h-0 bg-gray-100 dark:bg-slate-800 rounded-2xl overflow-hidden">
                <iframe
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    className="border-0 block"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Travel Map"
                />

                {/* External Link Button */}
                <a
                    href={allMarkersUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 z-10 px-3.5 py-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-lg text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-slate-700 flex items-center gap-1.5 no-underline text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <Navigation size={14} />
                    <span>ルート</span>
                </a>
            </div>

            {/* Bottom/Right Section */}
            <div className="flex-1 lg:flex-none lg:w-80 bg-white dark:bg-slate-900 border-t lg:border-t-0 border-gray-200 dark:border-slate-800 p-4 overflow-y-auto rounded-2xl lg:border lg:border-gray-200 lg:dark:border-slate-700">
                {/* Title */}
                <div className="flex items-center gap-2 mb-3">
                    <MapPin size={18} className="text-indigo-500" />
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm">場所をマップで表示</h3>
                    <span className="text-xs text-gray-400 ml-auto">{markers.length}件</span>
                </div>

                {/* Day Filter */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                    <button
                        onClick={() => { setActiveDay('all'); setMapCenter(null); }}
                        className={`flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeDay === 'all'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600'
                            }`}
                    >
                        全て
                    </button>
                    {itinerary.map((day, i) => (
                        <button
                            key={day.id}
                            onClick={() => { setActiveDay(day.id); setMapCenter(null); }}
                            className={`flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeDay === day.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-slate-600'
                                }`}
                        >
                            Day {i + 1}
                        </button>
                    ))}
                </div>

                {/* Location Pills - Clickable to center map */}
                <div className="flex flex-wrap gap-2">
                    {markers.length > 0 ? markers.map((m, i) => (
                        <button
                            key={i}
                            onClick={() => setMapCenter(m.query)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-all border ${currentMapQuery === m.query
                                ? 'bg-indigo-500 text-white border-indigo-500'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:bg-indigo-100 dark:hover:bg-slate-600'
                                }`}
                        >
                            <span>{getEmoji(m.type)}</span>
                            <span className="ml-1">{m.name.length > 12 ? m.name.slice(0, 12) + '...' : m.name}</span>
                        </button>
                    )) : (
                        <div className="text-gray-400 dark:text-slate-500 text-sm">スポットがありません</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapView;
