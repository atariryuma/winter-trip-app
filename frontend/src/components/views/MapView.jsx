import React, { useMemo, useState } from 'react';
import { MapPin, ArrowRight, Navigation, Map as MapIcon, Maximize2, Minimize2, ExternalLink, Search } from 'lucide-react';
import { getIcon } from '../common/IconHelper';

/**
 * Generates a Google Maps Directions URL for a given day's itinerary
 */
const getDayRouteUrl = (day) => {
    const locations = [];
    day.events.forEach(e => {
        if (e.type === 'transport') {
            if (e.place) locations.push(e.placeAddress || e.place);
            if (e.to) locations.push(e.toAddress || e.to);
        } else if (e.category === 'hotel' && e.name) {
            locations.push(e.address || e.name);
        } else if ((e.category === 'sightseeing' || e.category === 'meal') && e.name) {
            locations.push(e.address || e.name);
        }
    });
    const uniqueLocs = locations.filter((loc, i, arr) => i === 0 || loc !== arr[i - 1]);
    if (uniqueLocs.length < 2) return null;
    const origin = encodeURIComponent(uniqueLocs[0]);
    const destination = encodeURIComponent(uniqueLocs[uniqueLocs.length - 1]);
    const waypoints = uniqueLocs.slice(1, -1).slice(0, 9).map(l => encodeURIComponent(l)).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=transit`;
};

/**
 * Generate Google Maps Embed URL with all markers
 */
const generateEmbedUrl = (markers, center = null) => {
    // Use first marker as center if not specified
    const centerQuery = center || (markers.length > 0 ? (markers[0].address || markers[0].name) : '日本');
    // For embed, we use place mode for single location or search mode for query
    return `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(centerQuery)}&zoom=10&language=ja`;
};

const MapView = ({ mapUrl, itinerary, mapError }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [mapCenter, setMapCenter] = useState(null);

    const markers = useMemo(() => {
        return itinerary.flatMap(day => {
            const locs = [];
            day.events.forEach(e => {
                if (e.type === 'transport') {
                    if (e.place) locs.push({ name: e.place, type: 'transport', address: e.placeAddress || null, dayId: day.id });
                    if (e.to) locs.push({ name: e.to, type: 'transport', address: e.toAddress || null, dayId: day.id });
                } else if (e.category === 'hotel') {
                    locs.push({ name: e.name, type: 'hotel', address: e.address, dayId: day.id });
                } else if (e.category === 'sightseeing' || e.category === 'meal') {
                    locs.push({ name: e.name, type: e.category, address: e.address, dayId: day.id });
                }
            });
            return locs;
        }).filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
    }, [itinerary]);

    // Current map query - use selected marker or first hotel/attraction
    const currentMapQuery = useMemo(() => {
        if (mapCenter) return mapCenter;
        const hotel = markers.find(m => m.type === 'hotel');
        if (hotel) return hotel.address || hotel.name;
        return markers.length > 0 ? (markers[0].address || markers[0].name) : '沖縄';
    }, [markers, mapCenter]);

    // Generate embed URL
    const embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(currentMapQuery)}&zoom=14&language=ja`;

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'pt-4 space-y-4'}`}>
            {/* Interactive Google Map Embed */}
            <div className={`${isFullscreen ? 'h-full' : 'bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden'}`}>
                <div className={`relative ${isFullscreen ? 'h-full' : 'h-[50vh] lg:h-[60vh]'}`}>
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full"
                    />

                    {/* Map Controls */}
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            title={isFullscreen ? '縮小' : '全画面'}
                        >
                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentMapQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            title="Google Mapsで開く"
                        >
                            <ExternalLink size={20} />
                        </a>
                    </div>

                    {/* Fullscreen Close Hint */}
                    {isFullscreen && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                            ESCまたは右上ボタンで閉じる
                        </div>
                    )}
                </div>
            </div>

            {/* Location Quick Select - Only show when not fullscreen */}
            {!isFullscreen && (
                <div className="space-y-4">
                    {/* Quick Jump to Location */}
                    <div className="bg-white dark:bg-slate-700 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-600">
                        <h3 className="font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <MapPin size={18} className="text-blue-500" />
                            場所をマップで表示
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {markers.slice(0, 12).map((m, i) => (
                                <button
                                    key={i}
                                    onClick={() => setMapCenter(m.address || m.name)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${currentMapQuery === (m.address || m.name)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                        }`}
                                >
                                    {m.type === 'hotel' ? '🏨' : m.type === 'transport' ? '🚉' : m.type === 'meal' ? '🍽️' : '📍'}
                                    <span className="ml-1">{m.name.length > 10 ? m.name.slice(0, 10) + '...' : m.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Day Routes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {itinerary.map((day, i) => {
                            const routeUrl = getDayRouteUrl(day);
                            if (!routeUrl) return null;
                            return (
                                <a
                                    key={day.id}
                                    href={routeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                                >
                                    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg text-blue-600 dark:text-blue-300">
                                        <MapIcon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 dark:text-slate-200 text-sm truncate">
                                            Day {i + 1} のルートを見る
                                        </div>
                                        <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                                            {day.location || '移動行程を確認'}
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                                </a>
                            );
                        })}
                    </div>

                    {/* Location Cards with Smart Search */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {markers.map((m, i) => (
                            <div
                                key={i}
                                onClick={() => setMapCenter(m.address || m.name)}
                                className={`bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border transition cursor-pointer ${currentMapQuery === (m.address || m.name)
                                        ? 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800'
                                        : 'border-gray-100 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-700'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.type === 'hotel' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500' :
                                                m.type === 'meal' ? 'bg-orange-50 dark:bg-orange-900/40 text-orange-500' :
                                                    'bg-blue-50 dark:bg-blue-900/40 text-blue-500'
                                            }`}>
                                            {getIcon(m.type, null, { size: 18 })}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-gray-700 dark:text-slate-200 truncate">{m.name}</div>
                                            {m.address && (
                                                <div className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{m.address}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-2 mt-3">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.address || m.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-2 py-1.5 rounded-lg transition-colors"
                                    >
                                        <MapIcon size={12} /> マップ
                                    </a>
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(m.address || m.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-2 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Navigation size={12} /> ルート
                                    </a>
                                    <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(m.name + ' ' + (m.address ? m.address.split(',')[0] : ''))}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 flex items-center justify-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Search size={12} /> 検索
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapView;
