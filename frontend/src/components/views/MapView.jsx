import React, { useMemo } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { getIcon } from '../common/IconHelper';

const MapView = ({ mapUrl, itinerary }) => {
    const markers = useMemo(() => {
        return itinerary.flatMap(day => {
            const locs = [];
            // if(day.location) locs.push({name: day.location, type: 'day'}); // Too generic often
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
        <div className="pt-4 space-y-4 overflow-hidden">
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 overflow-hidden mb-6">
                {mapUrl ? (
                    <div className="relative">
                        <img src={mapUrl} alt="Trip Map" loading="lazy" className="w-full h-auto object-cover rounded-xl bg-gray-100 min-h-[200px]" />
                        <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] text-gray-500">Google Maps Data</div>
                    </div>
                ) : (
                    <div className="w-full h-48 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 flex-col gap-2 border-2 border-dashed border-gray-200">
                        <MapPin size={32} className="opacity-20" />
                        <span className="text-xs font-bold">マップ画像を生成できませんでした</span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" />
                    <h3 className="font-bold text-gray-800">スポット一覧</h3>
                </div>
                {markers.map((m, i) => (
                    <a
                        key={i}
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.type === 'hotel' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                                {getIcon(m.type, null, { size: 18 })}
                            </div>
                            <div>
                                <div className="font-bold text-gray-700">{m.name}</div>
                                <div className="text-xs text-gray-400 uppercase font-bold">{m.type}</div>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-300" />
                    </a>
                ))}
            </div>
        </div>
    );
};

export default MapView;
