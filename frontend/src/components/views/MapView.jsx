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
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            marginTop: '-80px'
        }}>
            {/* Map Area - Takes 2/3 of screen */}
            <div style={{
                flex: '2 1 0%',
                position: 'relative',
                minHeight: '0',
                backgroundColor: '#f3f4f6'
            }}>
                <iframe
                    src={embedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 'none', display: 'block' }}
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
                    style={{
                        position: 'absolute',
                        top: '90px',
                        right: '16px',
                        zIndex: 10,
                        padding: '10px 14px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        color: '#2563eb',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}
                >
                    <Navigation size={14} />
                    <span>ルート</span>
                </a>
            </div>

            {/* Bottom Section - Takes 1/3 of screen */}
            <div style={{
                flex: '1 1 0%',
                backgroundColor: 'white',
                borderTop: '1px solid #e5e7eb',
                padding: '16px',
                overflowY: 'auto'
            }}>
                {/* Title */}
                <div className="flex items-center gap-2 mb-3">
                    <MapPin size={18} className="text-blue-500" />
                    <h3 className="font-bold text-gray-800 text-sm">場所をマップで表示</h3>
                    <span className="text-xs text-gray-400 ml-auto">{markers.length}件</span>
                </div>

                {/* Day Filter */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                    <button
                        onClick={() => { setActiveDay('all'); setMapCenter(null); }}
                        className={`flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeDay === 'all'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-blue-50'
                            }`}
                    >
                        全て
                    </button>
                    {itinerary.map((day, i) => (
                        <button
                            key={day.id}
                            onClick={() => { setActiveDay(day.id); setMapCenter(null); }}
                            className={`flex-none px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeDay === day.id
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-blue-50'
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
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-100'
                                }`}
                        >
                            <span>{getEmoji(m.type)}</span>
                            <span className="ml-1">{m.name.length > 12 ? m.name.slice(0, 12) + '...' : m.name}</span>
                        </button>
                    )) : (
                        <div className="text-gray-400 text-sm">スポットがありません</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapView;
