import React, { useMemo } from 'react';
import { MapPin, ArrowRight, Navigation, Map as MapIcon } from 'lucide-react';
import { getIcon } from '../common/IconHelper';

/**
 * Generates a Google Maps Directions URL for a given day's itinerary
 * Uses addresses when available for more accurate routing
 */
const getDayRouteUrl = (day) => {
    // Extract meaningful locations in chronological order
    // Prefer address over name for accuracy
    const locations = [];
    day.events.forEach(e => {
        // For transport: use place/to names (stations, airports)
        if (e.place) locations.push(e.place);
        if (e.to) locations.push(e.to);
        // For hotels: use address if available, fallback to name
        if (e.category === 'hotel' && e.name) {
            locations.push(e.address || e.name);
        }
        // For sightseeing/activities: use address if available
        if ((e.category === 'sightseeing' || e.category === 'meal') && e.name) {
            locations.push(e.address || e.name);
        }
    });

    // Deduplicate consecutive locations (avoid A -> A)
    const uniqueLocs = locations.filter((loc, i, arr) => i === 0 || loc !== arr[i - 1]);

    if (uniqueLocs.length < 2) return null;

    const origin = encodeURIComponent(uniqueLocs[0]);
    const destination = encodeURIComponent(uniqueLocs[uniqueLocs.length - 1]);

    // Google Maps allows limited waypoints. We take up to 8 intermediates.
    const waypoints = uniqueLocs.slice(1, -1).slice(0, 9).map(l => encodeURIComponent(l)).join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=transit`;
};


const MapView = ({ mapUrl, itinerary, mapError }) => {
    const [imageError, setImageError] = React.useState(false);

    // Reset image error when URL changes
    React.useEffect(() => {
        if (mapUrl) setImageError(false);
    }, [mapUrl]);

    const markers = useMemo(() => {
        return itinerary.flatMap(day => {
            const locs = [];
            day.events.forEach(e => {
                if (e.place) locs.push({ name: e.place, type: 'transport', address: null });
                if (e.to) locs.push({ name: e.to, type: 'transport', address: null });
                if (e.category === 'hotel') locs.push({ name: e.name, type: 'hotel', address: e.address });
                if (e.category === 'sightseeing') locs.push({ name: e.name, type: 'sightseeing', address: e.address });
            });
            return locs;
        }).filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
    }, [itinerary]);


    return (
        <div className="pt-4 space-y-6">
            <div className="bg-white dark:bg-slate-700 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden">
                {mapUrl && !imageError ? (
                    <div className="relative">
                        <img
                            src={mapUrl}
                            alt="Trip Map"
                            loading="lazy"
                            className="w-full h-auto object-cover rounded-xl bg-gray-100 dark:bg-slate-600 min-h-[200px] lg:min-h-[400px]"
                            onError={(e) => {
                                console.error('Map image load error:', e);
                                setImageError(true);
                            }}
                        />
                        <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-2 py-1 rounded text-[10px] text-gray-500 dark:text-slate-400">Google Maps Data</div>
                    </div>
                ) : (
                    <div className="w-full h-48 lg:h-80 bg-gray-50 dark:bg-slate-600 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-400 flex-col gap-2 border-2 border-dashed border-gray-200 dark:border-slate-500 p-4 text-center">
                        <MapPin size={32} className="opacity-20" />
                        <span className="text-xs font-bold">マップ画像を生成できませんでした</span>
                        {(mapError || imageError) && (
                            <div className="text-[10px] text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded mt-1 break-all">
                                {mapError || '画像の読み込みに失敗しました'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {/* Day Routes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {markers.map((m, i) => (
                        <a
                            key={i}
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.address || m.name)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-between bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 transition active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.type === 'hotel' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-500'}`}>
                                    {getIcon(m.type, null, { size: 18 })}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-700 dark:text-slate-200">{m.name}</div>
                                    <div className="text-xs text-gray-400 dark:text-slate-500 uppercase font-bold">{m.type}</div>
                                    {m.address && <div className="text-[10px] text-gray-400 dark:text-slate-500 truncate max-w-[150px]">{m.address}</div>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    <MapIcon size={12} /> マップ
                                </span>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(m.address || m.name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 mt-2 hover:underline"
                                >
                                    <Navigation size={12} /> ルート
                                </a>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapView;
