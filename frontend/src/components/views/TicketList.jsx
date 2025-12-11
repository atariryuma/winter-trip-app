import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Clock, Copy, Search, CheckCircle,
    Plane, Train, Bus, Hotel, MapPin, Utensils, Ticket,
    AlertCircle, X, Maximize2, Minimize2
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

// Simple Ticket Card
const SimpleTicketCard = ({ event, isBooked, onSearchClick }) => {
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
                        {React.createElement(CategoryIcon, { size: 14 })}
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

// Search Modal Component - iOS Bottom Sheet Style
const SearchModal = ({ event, onClose }) => {
    const [isMaximized, setIsMaximized] = useState(false);

    if (!event) return null;

    const searchQuery = `${event.name}の予約の取り方を旅行者向けに教えてください`;
    const searchUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(searchQuery)}`;

    const handleTouch = () => {
        if (!isMaximized) setIsMaximized(true);
    };

    return createPortal(
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
            <div
                className={`bg-white dark:bg-slate-800 w-full shadow-2xl flex flex-col animate-slide-up-spring transition-all duration-300 ${isMaximized
                    ? 'h-[100dvh] rounded-none'
                    : 'max-h-[90vh] h-[85vh] sm:h-[75vh] rounded-t-3xl sm:rounded-3xl sm:max-w-lg'
                    }`}
                onClick={e => e.stopPropagation()}
            >
                {/* Grabber (mobile only) */}
                {!isMaximized && (
                    <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                        <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
                    </div>
                )}

                {/* Header */}
                <div className={`shrink-0 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3 ${isMaximized ? 'px-3 py-2' : 'px-4 py-3'}`}>
                    <h3 className={`font-bold text-gray-800 dark:text-white truncate ${isMaximized ? 'text-sm' : 'text-base'}`}>
                        {event.name} の予約
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="p-2 bg-gray-100 dark:bg-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 bg-gray-100 dark:bg-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Search iframe */}
                <div className="flex-1 min-h-0" onTouchStart={handleTouch} onMouseDown={handleTouch}>
                    <iframe
                        src={searchUrl}
                        title="Google Search"
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                </div>
            </div>
        </div>,
        document.body
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
        <div className="space-y-6 pt-2 pb-20">
            {/* Header / Stats */}
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide lg:overflow-visible lg:mx-0 lg:px-0">
                <div className="flex-none w-32 lg:flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="text-gray-400 dark:text-slate-500 text-xs font-bold mb-1">未予約</div>
                    <div className="flex items-end gap-1">
                        <span className="text-3xl font-black text-rose-500">{totalPending}</span>
                        <span className="text-sm font-bold text-gray-400 mb-1">件</span>
                    </div>
                </div>
                <div className="flex-none w-32 lg:flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="text-gray-400 dark:text-slate-500 text-xs font-bold mb-1">予約済み</div>
                    <div className="flex items-end gap-1">
                        <span className="text-3xl font-black text-emerald-500">{totalBooked}</span>
                        <span className="text-sm font-bold text-gray-400 mb-1">件</span>
                    </div>
                </div>
            </div>

            {/* Day Groups */}
            {groupedByDay.map(day => (
                <div key={day.date} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    {/* Day Header */}
                    <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-black rounded-lg">
                                DAY {day.dayIdx}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-white text-sm">
                                {day.date} <span className="text-gray-400 dark:text-slate-500 font-normal">({day.dayOfWeek})</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            {day.pending > 0 && (
                                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full font-bold">
                                    未予約 {day.pending}
                                </span>
                            )}
                            {day.booked > 0 && (
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">
                                    確定 {day.booked}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Day Events */}
                    <div className="divide-y divide-gray-50 dark:divide-slate-700">
                        {day.events.map((event, i) => (
                            <SimpleTicketCard
                                key={`${day.date}-${i}`}
                                event={event}
                                isBooked={event.isBooked}
                                onSearchClick={setSearchEvent}
                            />
                        ))}
                    </div>
                </div>
            ))}

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
