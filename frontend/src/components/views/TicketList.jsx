import React, { useMemo } from 'react';
import { Copy, Calendar } from 'lucide-react';
import { getIcon } from '../common/IconHelper';
import StatusBadge from '../common/StatusBadge';

const TicketList = ({ itinerary }) => {
    const tickets = useMemo(() => {
        return itinerary.flatMap(day =>
            day.events
                .filter(e => e.bookingRef || e.type === 'stay' || (e.type === 'transport' && e.status === 'confirmed'))
                .map(e => ({ ...e, date: day.date, dayOfWeek: day.dayOfWeek }))
        );
    }, [itinerary]);

    if (tickets.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Calendar size={28} className="text-gray-400 dark:text-slate-500" />
            </div>
            <p className="text-gray-500 dark:text-slate-400 font-medium">表示できるチケット情報がありません</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pt-4">
            {tickets.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-700 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-600 flex flex-col gap-3 relative overflow-hidden group hover:shadow-md transition-shadow">
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/5 to-transparent dark:from-blue-400/10 rounded-bl-full -mr-2 -mt-2 transition-transform group-hover:scale-125" />

                    {/* Header */}
                    <div className="flex justify-between items-start gap-3 relative z-10">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{t.date} ({t.dayOfWeek})</span>
                            </div>
                            <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 truncate">{t.name}</h3>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-slate-600 rounded-xl shrink-0">
                            {getIcon(t.category, t.type, { size: 18 })}
                        </div>
                    </div>

                    {/* Time & Status */}
                    <div className="flex items-center justify-between py-2.5 border-t border-b border-gray-100 dark:border-slate-600">
                        <div>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold block mb-0.5">Time</span>
                            <span className="text-sm font-bold text-gray-700 dark:text-slate-200 tabular-nums">{t.time}{t.endTime && ` - ${t.endTime}`}</span>
                        </div>
                        <StatusBadge status={t.status} />
                    </div>

                    {/* Booking Reference */}
                    {t.bookingRef && (
                        <button
                            onClick={() => { navigator.clipboard.writeText(t.bookingRef); alert('予約番号をコピーしました'); }}
                            className="w-full bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 flex justify-between items-center hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors active:scale-[0.98] touch-manipulation"
                        >
                            <div className="text-left">
                                <span className="text-[9px] text-blue-500 dark:text-blue-300 block uppercase font-bold tracking-wider">Booking Ref</span>
                                <span className="font-mono font-black text-blue-600 dark:text-blue-300 text-sm tracking-wider">{t.bookingRef}</span>
                            </div>
                            <Copy size={16} className="text-blue-400 shrink-0" />
                        </button>
                    )}

                    {/* Details */}
                    {t.details && (
                        <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{t.details}</p>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TicketList;

