import React, { useMemo, useState } from 'react';
import {
    Clock, Copy, CheckCircle,
    Plane, Train, Bus, Hotel, MapPin, Utensils, Ticket,
    AlertTriangle, ExternalLink, Edit3, ChevronDown, ChevronUp, Navigation
} from 'lucide-react';

// Helper: Calculate days until event
const getDaysUntil = (dateStr) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentYear = now.getFullYear();
    const [month, day] = dateStr.split('/').map(Number);
    let eventDate = new Date(currentYear, month - 1, day);
    if (eventDate < now) eventDate = new Date(currentYear + 1, month - 1, day);
    return Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
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

// Helper: Parse route from details field (e.g., "那覇 (OKA) -> 名古屋 (NGO)")
const parseRouteDetails = (details) => {
    if (!details) return { from: null, to: null };
    // Match patterns like "A -> B" or "A - > B" or "A → B"
    const match = details.match(/^(.+?)\s*(?:->|→|-)\s*(.+?)(?:\s*\(|$)/);
    if (match) {
        return { from: match[1].trim(), to: match[2].trim() };
    }
    return { from: null, to: null };
};

const TicketCard = ({ event, onEditClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const CategoryIcon = getCategoryIcon(event.category, event.type);
    const daysUntil = getDaysUntil(event.date);
    const isPast = daysUntil < 0;
    const isBooked = !!(event.status === 'confirmed' || event.bookingRef);

    // Parse route from details
    const { from: routeFrom, to: routeTo } = parseRouteDetails(event.details);

    const handleCopy = (e) => {
        e.stopPropagation();
        if (event.bookingRef) {
            navigator.clipboard.writeText(event.bookingRef);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSearch = (e) => {
        e.stopPropagation();
        const query = encodeURIComponent(`${event.name} 予約`);
        window.open(`https://www.google.com/search?q=${query}`, '_blank');
    };

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <div
            onClick={toggleExpand}
            className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-300 w-full max-w-full cursor-pointer ${isPast ? 'opacity-60 grayscale' : ''} ${isExpanded ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 shadow-lg' : 'active:scale-[0.98]'}`}
        >
            {/* Left Border Accent */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isBooked ? 'bg-emerald-500' : 'bg-rose-400'}`} />

            <div className="p-4 pl-5">
                {/* Header: Date & Status */}
                <div className="flex flex-wrap justify-between items-center mb-3 gap-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {event.date} ({event.dayOfWeek})
                        </span>
                        {!isPast && daysUntil <= 3 && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold whitespace-nowrap">
                                {daysUntil === 0 ? '今日' : daysUntil === 1 ? '明日' : `${daysUntil}日後`}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {isBooked ? (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-wider">予約済み</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                                <AlertTriangle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-wider">未予約</span>
                            </div>
                        )}
                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-1 break-words">
                            {event.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <Clock size={14} strokeWidth={2.5} className="text-slate-400 shrink-0" />
                            <span className="whitespace-nowrap">{event.time}</span>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600">
                        <CategoryIcon size={18} className="text-slate-500 dark:text-slate-400" />
                    </div>
                </div>

                {/* Expanded Details */}
                <div className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                    {/* Route: From / To (parsed from details) */}
                    {(routeFrom || routeTo) && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 mb-3 space-y-2 border border-indigo-100 dark:border-indigo-800/30">
                            {routeFrom && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase w-10 shrink-0">出発</span>
                                    <Navigation size={12} className="text-indigo-500 rotate-180 shrink-0" />
                                    <span className="text-indigo-700 dark:text-indigo-300 font-bold">{routeFrom}</span>
                                </div>
                            )}
                            {routeTo && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-[10px] font-bold text-indigo-500 uppercase w-10 shrink-0">到着</span>
                                    <Navigation size={12} className="text-emerald-500 shrink-0" />
                                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">{routeTo}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Details */}
                    {event.details && (
                        <div className="mb-3 px-1">
                            <p className="text-sm text-slate-600 dark:text-slate-400">{event.details}</p>
                        </div>
                    )}

                    {/* Booking Ref (if booked) */}
                    {isBooked && event.bookingRef && (
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3.5 py-2.5 border border-emerald-200 dark:border-emerald-800/30 group hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors mb-3"
                        >
                            <div className="flex flex-col items-start">
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">予約番号</span>
                                <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-300 tracking-tight">{event.bookingRef}</span>
                            </div>
                            <div className={`p-1.5 rounded-full ${copied ? 'bg-emerald-200 text-emerald-700' : 'bg-white dark:bg-emerald-800/50 text-emerald-500'} shadow-sm transition-all duration-300`}>
                                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                            </div>
                        </button>
                    )}

                    {/* Actions (Unbooked only) */}
                    {!isBooked && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSearch}
                                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl px-3 py-2.5 border border-indigo-100 dark:border-indigo-800/30 font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                                <ExternalLink size={14} />
                                予約を探す
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onEditClick) onEditClick(event); }}
                                className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-600 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                <Edit3 size={14} />
                                記録
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Section Header Component
const SectionHeader = ({ title, icon: Icon, count }) => (
    <div className="flex items-center justify-between px-1 py-2 mt-6 mb-2">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <Icon size={14} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                {title}
            </h3>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {count}
        </span>
    </div>
);

// Status Guide Component
const StatusGuide = ({ pending, booked, pendingItems }) => {
    const isAllSet = pending === 0;
    const unbookedNames = pendingItems.slice(0, 2).map(e => e.name);

    return (
        <div className={`rounded-2xl p-4 border shadow-sm transition-all duration-300 ${isAllSet
            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
            : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/30'
            }`}>
            <div className="flex items-center gap-3">
                {isAllSet ? (
                    <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-800/30">
                        <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                ) : (
                    <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-800/30 animate-pulse">
                        <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
                    </div>
                )}
                <div className="flex-1">
                    <h3 className={`font-black text-lg ${isAllSet ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                        {isAllSet ? '準備完了！' : `未完了 ${pending} 件`}
                    </h3>
                    <p className={`text-xs font-medium ${isAllSet ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-rose-600/70 dark:text-rose-400/70'}`}>
                        {isAllSet
                            ? '安心して出発できます'
                            : unbookedNames.length > 0
                                ? `${unbookedNames.join('、')}${pending > 2 ? ' など' : ''}`
                                : '予約が必要な項目があります'}
                    </p>
                </div>
                <div className="text-right">
                    <span className={`text-2xl font-black ${isAllSet ? 'text-emerald-600' : 'text-rose-500'}`}>{isAllSet ? booked : pending}</span>
                    <span className={`text-[10px] font-bold block ${isAllSet ? 'text-emerald-500' : 'text-rose-400'}`}>{isAllSet ? '件 完了' : '件 残り'}</span>
                </div>
            </div>
        </div>
    );
};

export default function TicketList({ itinerary, isScrolled, onEventClick }) {
    // 1. Flatten and Process Events with context
    const processedEvents = useMemo(() => {
        if (!itinerary) return { transport: [], stay: [] };

        // Flatten all events with day info
        const allFlat = itinerary.flatMap((day, dayIdx) =>
            (day.events || []).map((e, eIdx) => ({
                ...e,
                date: day.date,
                dayOfWeek: day.dayOfWeek,
                dayIdx: dayIdx + 1,
                globalIdx: `${dayIdx}-${eIdx}`,
                isBooked: !!(e.status === 'confirmed' || e.bookingRef)
            }))
        );

        // Helper to get location from event
        const getLocation = (ev) => ev?.name || ev?.details || null;

        // Build transport list with prev/next context
        const transport = allFlat
            .filter(e => ['flight', 'train', 'bus'].includes(e.category) || e.type === 'transport')
            .map((ev, idx, arr) => ({
                ...ev,
                prevLocation: idx > 0 ? getLocation(arr[idx - 1]) : null,
                nextLocation: idx < arr.length - 1 ? getLocation(arr[idx + 1]) : null
            }))
            .sort((a, b) => {
                if (a.date !== b.date) return parseInt(a.date.split('/')[1]) - parseInt(b.date.split('/')[1]);
                const ta = a.time ? parseInt(a.time.replace(':', '')) : 0;
                const tb = b.time ? parseInt(b.time.replace(':', '')) : 0;
                return ta - tb;
            });

        // Build stay list with prev/next context
        const stay = allFlat
            .filter(e => e.type === 'stay' || e.category === 'hotel')
            .map((ev, idx, arr) => ({
                ...ev,
                prevLocation: idx > 0 ? getLocation(arr[idx - 1]) : null,
                nextLocation: idx < arr.length - 1 ? getLocation(arr[idx + 1]) : null
            }))
            .sort((a, b) => parseInt(a.date.split('/')[1]) - parseInt(b.date.split('/')[1]));

        return { transport, stay, allFlat };
    }, [itinerary]);

    const { transport, stay, allFlat = [] } = processedEvents;

    // Stats
    const pendingItems = allFlat.filter(e => !e.isBooked && (['flight', 'train', 'bus', 'hotel'].includes(e.category) || e.type === 'stay' || e.type === 'transport'));
    const totalPending = pendingItems.length;
    const totalBooked = allFlat.filter(e => e.isBooked).length;

    // Empty State
    if (transport.length === 0 && stay.length === 0) {
        return (
            <div className="space-y-4 pb-24">
                <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                    <Ticket className="mx-auto text-gray-300 dark:text-slate-500 mb-3" size={32} />
                    <p className="text-gray-400 font-bold">チケット情報がありません</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-24">
            {/* Large Title */}
            <div className={`pb-2 transition-all duration-300 ${isScrolled ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tickets</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">予約・手配状況</p>
            </div>

            {/* Status Guide - Sticky */}
            <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-sticky-content bg-gray-100/95 dark:bg-slate-900/95 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 py-2">
                <StatusGuide pending={totalPending} booked={totalBooked} pendingItems={pendingItems} />
            </div>

            {/* Transportation Section */}
            {transport.length > 0 && (
                <div className="animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
                    <SectionHeader title="交通機関" icon={Train} count={transport.length} />
                    <div className="space-y-3">
                        {transport.map((event, i) => (
                            <TicketCard
                                key={`transport-${i}`}
                                event={event}
                                prevLocation={event.prevLocation}
                                nextLocation={event.nextLocation}
                                onEditClick={onEventClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Stay Section */}
            {stay.length > 0 && (
                <div className="animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                    <SectionHeader title="宿泊施設" icon={Hotel} count={stay.length} />
                    <div className="space-y-3">
                        {stay.map((event, i) => (
                            <TicketCard
                                key={`stay-${i}`}
                                event={event}
                                prevLocation={event.prevLocation}
                                nextLocation={event.nextLocation}
                                onEditClick={onEventClick}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
