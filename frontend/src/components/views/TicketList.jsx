import React, { useMemo, useState } from 'react';
import {
    Clock, Copy, Search, CheckCircle,
    Plane, Train, Bus, Hotel, MapPin, Utensils, Ticket,
    AlertCircle, X, Maximize2, Minimize2
} from 'lucide-react';

// Helper: Calculate days until event
const getDaysUntil = (dateStr) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const [month, day] = dateStr.split('/').map(Number);
    const eventYear = month >= now.getMonth() + 1 ? currentYear : currentYear + 1;
    const eventDate = new Date(eventYear, month - 1, day);
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

// Simple Ticket Card
const SimpleTicketCard = ({ event, isBooked, onSearchClick }) => {
    const [copied, setCopied] = useState(false);
    const IconComponent = getCategoryIcon(event.category, event.type);
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
        <div className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 ${isPast ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex items-start gap-4">
                {/* Date Box */}
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-gray-50 dark:bg-slate-700 rounded-xl shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">{event.dayOfWeek}</span>
                    <span className="text-lg font-black text-gray-800 dark:text-white leading-none mt-0.5">{event.date.split('/')[1]}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBooked
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                            }`}>
                            {isBooked ? '予約済み' : '未予約'}
                        </span>
                        {!isPast && (
                            <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                                <Clock size={10} />
                                {daysUntil === 0 ? '今日' : daysUntil === 1 ? '明日' : `${daysUntil}日後`}
                            </span>
                        )}
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-base break-words">{event.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-slate-400">
                        <IconComponent size={14} />
                        <span className="break-words">{event.details || event.category}</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                        {isBooked ? (
                            <button
                                onClick={handleCopy}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                            >
                                <span className="font-mono">{event.bookingRef}</span>
                                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                            </button>
                        ) : (
                            <button
                                onClick={() => onSearchClick(event)}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                            >
                                <Search size={14} />
                                予約を探す
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Search Modal Component
const SearchModal = ({ event, onClose }) => {
    const [isMaximized, setIsMaximized] = useState(false);

    if (!event) return null;

    const searchQuery = `${event.name}の予約の取り方を旅行者向けに教えてください`;
    const searchUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(searchQuery)}`;

    const handleTouch = () => {
        if (!isMaximized) setIsMaximized(true);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className={`relative w-full bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isMaximized ? 'h-[100dvh] rounded-none' : 'h-[80vh] sm:h-[75vh] rounded-t-3xl sm:rounded-2xl sm:max-w-lg'
                }`}>
                {/* Header */}
                <div className={`shrink-0 border-b border-gray-200 dark:border-slate-700 ${isMaximized ? 'px-3 py-2' : 'px-4 py-3'}`}>
                    <div className="flex items-center justify-between gap-3">
                        <h3 className={`font-bold text-gray-800 dark:text-white truncate ${isMaximized ? 'text-sm' : 'text-base'}`}>
                            {event.name} の予約
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-600 hover:bg-gray-200"
                            >
                                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button onClick={onClose} className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-600 hover:bg-gray-200">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
                {/* Search iframe */}
                <div className="flex-1" onTouchStart={handleTouch} onMouseDown={handleTouch}>
                    <iframe
                        src={searchUrl}
                        title="Google Search"
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                </div>
            </div>
        </div>
    );
};

export default function TicketList({ itinerary }) {
    const [searchEvent, setSearchEvent] = useState(null);

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

    const { pending, booked } = useMemo(() => {
        return {
            pending: processedEvents.filter(e => !e.isBooked),
            booked: processedEvents.filter(e => e.isBooked)
        };
    }, [processedEvents]);

    return (
        <div className="space-y-6 pt-2 pb-20">
            {/* Header / Stats */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide lg:overflow-visible lg:mx-0 lg:px-0">
                <div className="flex-none w-32 lg:flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="text-gray-400 dark:text-slate-500 text-xs font-bold mb-1">未予約</div>
                    <div className="flex items-end gap-1">
                        <span className="text-3xl font-black text-rose-500">{pending.length}</span>
                        <span className="text-sm font-bold text-gray-400 mb-1">件</span>
                    </div>
                </div>
                <div className="flex-none w-32 lg:flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="text-gray-400 dark:text-slate-500 text-xs font-bold mb-1">予約済み</div>
                    <div className="flex items-end gap-1">
                        <span className="text-3xl font-black text-emerald-500">{booked.length}</span>
                        <span className="text-sm font-bold text-gray-400 mb-1">件</span>
                    </div>
                </div>
            </div>

            {/* Pending Section */}
            {pending.length > 0 && (
                <div>
                    <h2 className="text-gray-900 dark:text-white font-black text-lg mb-4 flex items-center gap-2">
                        <AlertCircle className="text-rose-500" />
                        予約が必要 ({pending.length})
                    </h2>
                    <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                        {pending.map((event, i) => (
                            <SimpleTicketCard key={`pending-${i}`} event={event} isBooked={false} onSearchClick={setSearchEvent} />
                        ))}
                    </div>
                </div>
            )}

            {/* Booked Section */}
            <div>
                <h2 className="text-gray-900 dark:text-white font-black text-lg mb-4 flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" />
                    予約済み ({booked.length})
                </h2>
                <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                    {booked.map((event, i) => (
                        <SimpleTicketCard key={`booked-${i}`} event={event} isBooked={true} onSearchClick={setSearchEvent} />
                    ))}
                </div>
            </div>

            {/* Empty State */}
            {processedEvents.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                    <Ticket className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-400 font-bold">チケット情報がありません</p>
                </div>
            )}

            {/* Search Modal */}
            {searchEvent && (
                <SearchModal event={searchEvent} onClose={() => setSearchEvent(null)} />
            )}
        </div>
    );
}
