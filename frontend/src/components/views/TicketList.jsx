import React, { useMemo, useState } from 'react';
import {
    Clock, Copy, CheckCircle,
    Plane, Train, Bus, Hotel, MapPin, Utensils, Ticket,
    AlertTriangle, Calendar as CalendarIcon, ChevronRight
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

// Travel Wallet Card
const TicketCard = ({ event }) => {
    const [copied, setCopied] = useState(false);
    const CategoryIcon = getCategoryIcon(event.category, event.type);
    const daysUntil = getDaysUntil(event.date);
    const isPast = daysUntil < 0;
    const isBooked = !!(event.status === 'confirmed' || event.bookingRef);

    const handleCopy = (e) => {
        e.stopPropagation();
        if (event.bookingRef) {
            navigator.clipboard.writeText(event.bookingRef);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-all duration-200 active:scale-[0.98] w-full max-w-full ${isPast ? 'opacity-60 grayscale' : ''}`}>
            {/* Left Border Accent based on Booked Status */}
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
                    <div className="flex items-center gap-1.5 shrink-0">
                        {isBooked ? (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle size={14} className="fill-emerald-100 dark:fill-emerald-900/20" />
                                <span className="text-[10px] font-black uppercase tracking-wider">予約済み</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                                <AlertTriangle size={14} className="fill-rose-100 dark:fill-rose-900/20" />
                                <span className="text-[10px] font-black uppercase tracking-wider">未予約</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-1 break-words">
                            {event.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                            <Clock size={14} strokeWidth={2.5} className="text-slate-400 shrink-0" />
                            <span className="whitespace-nowrap">{event.time}</span>
                            {['flight', 'train', 'bus'].includes(event.category) && event.details && (
                                <>
                                    <span className="text-slate-300">•</span>
                                    <span className="truncate min-w-0 max-w-[150px] sm:max-w-xs">{event.details}</span>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Icon Circle */}
                    <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-600">
                        <CategoryIcon size={18} className="text-slate-500 dark:text-slate-400" />
                    </div>
                </div>

                {/* Footer: Booking Ref */}
                {isBooked ? (
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3.5 py-2.5 border border-slate-100 dark:border-slate-700/50 group hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">予約番号</span>
                            <span className="font-mono text-base font-bold text-slate-700 dark:text-slate-200 tracking-tight">{event.bookingRef}</span>
                        </div>
                        <div className={`p-1.5 rounded-full ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-white dark:bg-slate-600 text-slate-400 group-hover:text-slate-600'} shadow-sm transition-all duration-300`}>
                            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                        </div>
                    </button>
                ) : (
                    // Unbooked Warning Strip
                    <div className="w-full bg-rose-50 dark:bg-rose-900/10 rounded-xl px-3.5 py-2.5 border border-dashed border-rose-200 dark:border-rose-800/30 flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">手配が必要です</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Section Header Component
const SectionHeader = ({ title, icon: Icon, count, isAlert }) => (
    <div className="flex items-center justify-between px-1 py-2 mt-6 mb-2">
        <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isAlert ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
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

export default function TicketList({ itinerary, isScrolled }) {
    // 1. Flatten and Process Events
    const allEvents = useMemo(() => {
        if (!itinerary) return [];
        return itinerary.flatMap(day =>
            (day.events || []).map(e => ({
                ...e,
                date: day.date,
                dayOfWeek: day.dayOfWeek,
                isBooked: !!(e.status === 'confirmed' || e.bookingRef)
            }))
        );
    }, [itinerary]);

    // 2. Categorize Events
    const categorized = useMemo(() => {
        const transport = allEvents
            .filter(e => ['flight', 'train', 'bus'].includes(e.category) || e.type === 'transport')
            .sort((a, b) => { // Sort by date then time
                if (a.date !== b.date) return parseInt(a.date.split('/')[1]) - parseInt(b.date.split('/')[1]);
                const ta = a.time ? parseInt(a.time.replace(':', '')) : 0;
                const tb = b.time ? parseInt(b.time.replace(':', '')) : 0;
                return ta - tb;
            });

        const stay = allEvents
            .filter(e => e.type === 'stay' || e.category === 'hotel')
            .sort((a, b) => parseInt(a.date.split('/')[1]) - parseInt(b.date.split('/')[1])); // Sort by check-in date

        const activities = allEvents
            .filter(e => ['sightseeing', 'meal', 'ticket'].includes(e.category) && !['stay', 'transport'].includes(e.type))
            .sort((a, b) => parseInt(a.date.split('/')[1]) - parseInt(b.date.split('/')[1]));

        return { transport, stay, activities };
    }, [allEvents]);

    // Stats
    const totalPending = allEvents.filter(e => !e.isBooked && (['flight', 'train', 'bus', 'hotel', 'ticket'].includes(e.category) || e.type === 'stay')).length;
    const totalBooked = allEvents.filter(e => e.isBooked).length;


    // Empty State Check
    if (allEvents.length === 0) {
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
            {/* Large Title with fade animation */}
            <div className={`pb-2 transition-all duration-300 ${isScrolled ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Tickets</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">予約・手配状況</p>
            </div>

            {/* Header / Stats - Sticky */}
            <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-sticky-content bg-gray-100/95 dark:bg-slate-900/95 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 py-2 border-b border-gray-200/50 dark:border-slate-700/50 shadow-sm">
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide lg:overflow-visible">
                    {/* Unbooked Alert Card */}
                    <div className={`flex-none w-36 lg:flex-1 p-3 rounded-2xl border ${totalPending > 0 ? 'bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-800/30' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'} shadow-sm`}>
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={14} className={totalPending > 0 ? 'text-rose-500' : 'text-gray-400'} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${totalPending > 0 ? 'text-rose-500' : 'text-gray-400'}`}>未予約</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className={`text-2xl font-black ${totalPending > 0 ? 'text-rose-500' : 'text-gray-300'}`}>{totalPending}</span>
                            <span className="text-[10px] font-bold text-gray-400 mb-1">件</span>
                        </div>
                    </div>

                    {/* Ready Card */}
                    <div className="flex-none w-36 lg:flex-1 bg-white dark:bg-slate-800 rounded-2xl p-3 border border-gray-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">完了</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-black text-emerald-500">{totalBooked}</span>
                            <span className="text-[10px] font-bold text-gray-400 mb-1">件</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transportation Section */}
            {categorized.transport.length > 0 && (
                <div className="animate-slide-up-fade" style={{ animationDelay: '0ms' }}>
                    <SectionHeader title="交通機関" icon={Train} count={categorized.transport.length} />
                    <div className="space-y-3">
                        {categorized.transport.map((event, i) => (
                            <TicketCard key={`transport-${i}`} event={event} />
                        ))}
                    </div>
                </div>
            )}

            {/* Stay Section */}
            {categorized.stay.length > 0 && (
                <div className="animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
                    <SectionHeader title="宿泊施設" icon={Hotel} count={categorized.stay.length} />
                    <div className="space-y-3">
                        {categorized.stay.map((event, i) => (
                            <TicketCard key={`stay-${i}`} event={event} />
                        ))}
                    </div>
                </div>
            )}

            {/* Activities Section (Only if booked/tickets involved) */}
            {categorized.activities.length > 0 && (
                <div className="animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
                    {/* Only show section if items look like they need tickets/reservation */}
                    <SectionHeader title="その他・アクティビティ" icon={Ticket} count={categorized.activities.length} />
                    <div className="space-y-3">
                        {categorized.activities.map((event, i) => (
                            <TicketCard key={`activity-${i}`} event={event} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
