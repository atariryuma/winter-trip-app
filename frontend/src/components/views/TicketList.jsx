import React, { useMemo, useState } from 'react';
import {
    Clock, Copy, CheckCircle,
    Plane, Train, Bus, Hotel, MapPin, Utensils, Ticket,
    AlertTriangle, Calendar as CalendarIcon
} from 'lucide-react';

// Helper: Calculate days until event
const getDaysUntil = (dateStr) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

    const currentYear = now.getFullYear();
    const [month, day] = dateStr.split('/').map(Number);

    // Try current year first
    let eventDate = new Date(currentYear, month - 1, day);

    // If the date already passed, assume it's next year
    if (eventDate < now) {
        eventDate = new Date(currentYear + 1, month - 1, day);
    }

    const diffTime = eventDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Helper: Get icon
const getCategoryIcon = (category, type) => {
    if (type === 'stay' || category === 'hotel') return Hotel;
    if (category === 'flight') return Plane;
    if (category === 'train') return Train;
    if (category === 'bus') return Bus;
    if (category === 'meal') return Utensils;
    if (category === 'sightseeing') return MapPin;
    return Ticket;
};

// Premium Ticket Card
const TicketCard = ({ event, isBooked }) => {
    const [copied, setCopied] = useState(false);
    const CategoryIcon = getCategoryIcon(event.category, event.type);
    const daysUntil = getDaysUntil(event.date);
    const isPast = daysUntil < 0;

    const handleCopy = (e) => {
        e.stopPropagation();
        if (event.bookingRef) {
            navigator.clipboard.writeText(event.bookingRef);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={`group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-200 hover:shadow-md ${isPast ? 'opacity-60 grayscale' : ''}`}>

            <div className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                            {isBooked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                                    <CheckCircle size={10} strokeWidth={3} />
                                    予約済み
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                                    <AlertTriangle size={10} strokeWidth={3} />
                                    未予約
                                </span>
                            )}
                            {!isPast && (
                                <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                    • {daysUntil === 0 ? '今日' : daysUntil === 1 ? '明日' : `${daysUntil}日後`}
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight break-words">
                            {event.name}
                        </h3>
                    </div>
                    {/* Category Icon Badge */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 shrink-0">
                        <CategoryIcon size={18} />
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-slate-600 dark:text-slate-400 mb-5 pl-1">
                    <div className="flex items-center gap-2.5">
                        <CalendarIcon size={15} className="text-indigo-500/70 dark:text-indigo-400/70 shrink-0" />
                        <span className="font-medium">{event.date} <span className="text-xs text-slate-400 font-normal">({event.dayOfWeek})</span></span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Clock size={15} className="text-indigo-500/70 dark:text-indigo-400/70 shrink-0" />
                        <span className="font-medium">{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2.5 col-span-2">
                        <MapPin size={15} className="text-indigo-500/70 dark:text-indigo-400/70 shrink-0" />
                        <span className="truncate font-medium">{event.details || event.category}</span>
                    </div>
                </div>

                {/* Footer / Actions */}
                {isBooked ? (
                    <button
                        onClick={handleCopy}
                        className="w-full group/btn flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 transition-all active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md shadow-sm group-hover/btn:scale-110 transition-transform duration-200">
                                <Ticket size={14} className="text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">予約番号</span>
                                <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{event.bookingRef}</span>
                            </div>
                        </div>
                        <div className={`transition-all duration-300 ${copied ? 'scale-110 text-emerald-500' : 'text-slate-300 group-hover/btn:text-slate-500'}`}>
                            {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                        </div>
                    </button>
                ) : (
                    <div className="w-full bg-rose-50/50 dark:bg-rose-900/10 border border-dashed border-rose-200 dark:border-rose-800/30 rounded-xl p-3 flex items-center justify-center gap-2">
                        <AlertTriangle size={15} className="text-rose-500" />
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">予約が必要です</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TicketList({ itinerary, isScrolled }) {
    // Process events
    const processedEvents = useMemo(() => {
        if (!itinerary) return [];
        return itinerary.flatMap(day =>
            (day.events || [])
                .filter(e => ['stay', 'transport'].includes(e.type) || ['flight', 'train', 'bus', 'hotel', 'sightseeing', 'meal'].includes(e.category))
                .map(e => ({
                    ...e,
                    date: day.date,
                    dayOfWeek: day.dayOfWeek,
                    isBooked: !!(e.status === 'confirmed' || e.bookingRef)
                }))
        ).sort((a, b) => {
            if (a.isBooked === b.isBooked) {
                const da = parseInt(a.date.split('/')[1]);
                const db = parseInt(b.date.split('/')[1]);
                return da - db;
            }
            return a.isBooked ? 1 : -1;
        });
    }, [itinerary]);

    // Group by day
    const groupedByDay = useMemo(() => {
        if (!itinerary) return [];
        return itinerary.map((day, idx) => {
            const dayEvents = (day.events || [])
                .filter(e => ['stay', 'transport'].includes(e.type) || ['flight', 'train', 'bus', 'hotel', 'sightseeing', 'meal'].includes(e.category))
                .map(e => ({
                    ...e,
                    date: day.date,
                    dayOfWeek: day.dayOfWeek,
                    isBooked: !!(e.status === 'confirmed' || e.bookingRef)
                }))
                .sort((a, b) => {
                    const ta = a.time ? parseInt(a.time.split(':')[0]) : 99;
                    const tb = b.time ? parseInt(b.time.split(':')[0]) : 99;
                    return ta - tb;
                });
            return {
                dayIdx: idx + 1,
                date: day.date,
                dayOfWeek: day.dayOfWeek,
                events: dayEvents,
                pending: dayEvents.filter(e => !e.isBooked).length,
                booked: dayEvents.filter(e => e.isBooked).length
            };
        }).filter(d => d.events.length > 0);
    }, [itinerary]);

    const totalPending = useMemo(() => processedEvents.filter(e => !e.isBooked).length, [processedEvents]);
    const totalBooked = useMemo(() => processedEvents.filter(e => e.isBooked).length, [processedEvents]);

    return (
        <div className="space-y-4 pb-24">
            {/* Large Title with fade animation */}
            <div className={`pb-2 transition-all duration-300 ${isScrolled ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tickets</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">予約状況</p>
            </div>
            {/* Header / Stats - Sticky */}
            <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-sticky-content bg-gray-100/95 dark:bg-slate-900/95 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 py-2">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide lg:overflow-visible">
                    <div className="flex-none w-32 lg:flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                        <div className="text-gray-400 dark:text-slate-500 text-xs font-bold mb-1 uppercase tracking-wide">未予約</div>
                        <div className="flex items-end gap-1">
                            <span className="text-3xl font-black text-rose-500">{totalPending}</span>
                            <span className="text-sm font-bold text-gray-400 mb-1">件</span>
                        </div>
                    </div>
                    <div className="flex-none w-32 lg:flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                        <div className="text-gray-400 dark:text-slate-500 text-xs font-bold mb-1 uppercase tracking-wide">予約済み</div>
                        <div className="flex items-end gap-1">
                            <span className="text-3xl font-black text-emerald-500">{totalBooked}</span>
                            <span className="text-sm font-bold text-gray-400 mb-1">件</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Day Groups */}
            {groupedByDay.map(day => (
                <div key={day.date} className="space-y-3">
                    {/* Day Header */}
                    <div className="flex items-center gap-3 px-1 pt-2">
                        <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-sm">
                            DAY {day.dayIdx}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                            {day.date} <span className="opacity-60 font-normal">({day.dayOfWeek})</span>
                        </span>
                        <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700 ml-2" />
                    </div>

                    {/* Day Events */}
                    <div className="space-y-3">
                        {day.events.map((event, i) => (
                            <TicketCard
                                key={`${day.date}-${i}`}
                                event={event}
                                isBooked={event.isBooked}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {/* Empty State */}
            {processedEvents.length === 0 && (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ticket className="text-gray-300 dark:text-slate-500" size={24} />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-bold mb-1">No Tickets Found</h3>
                    <p className="text-gray-400 text-sm">チケット情報がありません</p>
                </div>
            )}
        </div>
    );
}
