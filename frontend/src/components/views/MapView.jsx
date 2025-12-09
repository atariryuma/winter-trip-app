import React, { useMemo } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { getIcon } from '../common/IconHelper';

const MapView = ({ mapUrl, itinerary }) => {
    const markers = useMemo(() => {
        return itinerary.flatMap(day => {
            const locs = [];
            day.events.forEach(e => {
                if (e.place) locs.push({ name: e.place, type: 'transport' });
                if (e.to) locs.push({ name: e.to, type: 'transport' });
                if (e.category === 'hotel') locs.push({ name: e.name, type: 'hotel' });
                if (e.category === 'sightseeing') locs.push({ name: e.name, type: 'sightseeing' });
            });
            return locs;
        }).filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
    }, [itinerary]);

    return (
        <div className="pt-4 space-y-6">
            <div className="bg-white dark:bg-slate-700 rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden">
                {mapUrl ? (
                    <div className="relative">
                        <img src={mapUrl} alt="Trip Map" loading="lazy" className="w-full h-auto object-cover rounded-xl bg-gray-100 dark:bg-slate-600 min-h-[200px] lg:min-h-[400px]" />
                        <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-2 py-1 rounded text-[10px] text-gray-500 dark:text-slate-400">Google Maps Data</div>
                    </div>
                ) : (
                    <div className="w-full h-48 lg:h-80 bg-gray-50 dark:bg-slate-600 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-400 flex-col gap-2 border-2 border-dashed border-gray-200 dark:border-slate-500">
                        <MapPin size={32} className="opacity-20" />
                        <span className="text-xs font-bold">マップ画像を生成できませんでした</span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" />
                    <h3 className="font-bold text-gray-800 dark:text-slate-100">スポット一覧</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {markers.map((m, i) => (
                        <a
                            key={i}
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name)}`}
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
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-gray-300 dark:text-slate-500" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MapView;
