import React, { useMemo } from 'react';
import { Copy } from 'lucide-react';
import { getIcon } from '../common/IconHelper';
import StatusBadge from '../common/StatusBadge';

const TicketList = ({ itinerary }) => {
    const tickets = useMemo(() => {
        return itinerary.flatMap(day =>
            day.events
                .filter(e => e.bookingRef || e.type === 'stay' || (e.type === 'transport' && e.status === 'confirmed'))
                .map(e => ({ ...e, date: day.date }))
        );
    }, [itinerary]);

    if (tickets.length === 0) return <div className="p-10 text-center text-gray-400 font-bold">表示できるチケット情報がありません</div>;

    return (
        <div className="space-y-4 pt-4 overflow-hidden">
            {tickets.map(t => (
                <div key={t.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.date} • {t.category}</span>
                            <h3 className="text-xl font-bold text-gray-800 mt-1">{t.name}</h3>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            {getIcon(t.category, t.type)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-2 border-t border-b border-gray-100 py-3">
                        <div>
                            <span className="text-xs text-gray-400 block mb-1">TIME</span>
                            <span className="text-lg font-mono font-bold text-gray-700">{t.time}{t.endTime && ` - ${t.endTime}`}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block mb-1">STATUS</span>
                            <StatusBadge status={t.status} />
                        </div>
                    </div>

                    {t.bookingRef && (
                        <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition" onClick={() => { navigator.clipboard.writeText(t.bookingRef); alert('予約番号をコピーしました'); }}>
                            <div>
                                <span className="text-[10px] text-blue-400 block uppercase font-bold">BOOKING REF</span>
                                <span className="font-mono font-black text-blue-600 text-lg tracking-widest">{t.bookingRef}</span>
                            </div>
                            <Copy size={16} className="text-blue-300" />
                        </div>
                    )}

                    {t.details && <p className="text-sm text-gray-500 mt-1">{t.details}</p>}
                </div>
            ))}
        </div>
    );
};

export default TicketList;
