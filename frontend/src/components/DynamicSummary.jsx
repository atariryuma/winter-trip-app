import React from 'react';
import {
    CheckCircle,
    Ticket,
    Edit3,
    Trash2,
    ChevronRight,
    Navigation
} from 'lucide-react';
import { getIcon } from './common/IconHelper';
import { getTripDate } from '../utils';

// Helper: Build unique route locations from events and previous day hotel
// Note: Flights are excluded as driving directions don't apply to air travel
const buildRouteLocations = (events, previousDayHotel) => {
    const allLocations = [];

    // Add previous day hotel as starting point for Day 2+
    if (previousDayHotel) {
        const hotelName = previousDayHotel.name || previousDayHotel.to;
        if (hotelName) allLocations.push(hotelName);
    }

    events.forEach(e => {
        // Skip flights - driving directions don't apply to air travel
        if (e.category === 'flight') return;

        if (e.type === 'transport') {
            if (e.from) allLocations.push(e.from);
            if (e.to) allLocations.push(e.to);
        } else {
            const loc = e.to || e.name;
            if (loc) allLocations.push(loc);
        }
    });

    // Remove consecutive duplicates
    return allLocations.filter((loc, i, arr) => i === 0 || loc !== arr[i - 1]);
};

// Helper: Generate Google Maps route URL from locations
const buildGoogleMapsRouteUrl = (locations) => {
    if (locations.length === 0) return 'https://www.google.com/maps';
    if (locations.length === 1) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locations[0])}`;
    }
    const origin = encodeURIComponent(locations[0]);
    const destination = encodeURIComponent(locations[locations.length - 1]);
    const waypoints = locations.slice(1, -1).slice(0, 9).map(l => encodeURIComponent(l)).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
};

const DynamicSummary = ({ day, events, dayIdx, previousDayHotel, onEditPlanned, onDeleteDay, isEditMode }) => {
    if (!day || !events) return null;

    // Calculate from Events data only
    const spotCount = events.filter(e => e.type !== 'transport').length;
    const moveCount = events.filter(e => e.type === 'transport').length;
    const confirmedCount = events.filter(e => e.status === 'booked' || e.status === 'confirmed').length;
    const plannedCount = events.filter(e => e.status === 'planned' || e.status === 'suggested').length;
    const pendingBooking = events.filter(e => e.status === 'planned' && ['flight', 'train', 'hotel'].includes(e.category));

    // Build route locations once (used for both display and link)
    const routeLocations = buildRouteLocations(events, previousDayHotel);
    const routeUrl = buildGoogleMapsRouteUrl(routeLocations);

    // Determine trip phase and next action
    // Use centralized year calculation logic from utils
    const tripDate = getTripDate(day.date);

    // Create fresh Date objects to avoid mutating shared references
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const tripDateMidnight = new Date(tripDate);
    tripDateMidnight.setHours(0, 0, 0, 0);

    const daysUntil = Math.ceil((tripDateMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

    const isTripDay = daysUntil === 0;
    const isPast = daysUntil < 0;

    // Generate next action message
    const getNextAction = () => {
        if (isPast) {
            return { icon: <CheckCircle size={18} />, text: '完了した日程', sub: '' };
        }

        if (isTripDay) {
            // During trip - show next event
            const now = new Date();
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();
            const nextEvent = events.find(e => {
                if (!e.time) return false;
                const [h, m] = e.time.split(':').map(Number);
                return h > currentHour || (h === currentHour && m > currentMin);
            });
            if (nextEvent) {
                const categoryLabel = { flight: '搭乗', train: '乗車', bus: '乗車', hotel: 'チェックイン', meal: '食事', sightseeing: '観光' }[nextEvent.category] || '予定';
                return {
                    icon: getIcon(nextEvent.category, nextEvent.type, { size: 18, className: 'text-white/80' }),
                    text: `${nextEvent.time} ${categoryLabel}`,
                    sub: nextEvent.name
                };
            }
            return { icon: <CheckCircle size={18} />, text: '本日の予定は完了', sub: '' };
        }

        // Planning phase - show booking action
        if (pendingBooking.length > 0) {
            const urgent = pendingBooking[0];
            const categoryLabel = { flight: '航空券', train: '電車', hotel: 'ホテル' }[urgent.category] || '予約';
            return {
                icon: <Ticket size={18} />,
                text: `${categoryLabel}の予約が必要`,
                sub: urgent.name
            };
        }

        if (plannedCount > 0) {
            return { icon: <Edit3 size={18} />, text: `${plannedCount}件の計画を確認`, sub: '', editable: true };
        }

        return { icon: <CheckCircle size={18} />, text: '準備完了', sub: `${daysUntil}日後に出発` };
    };

    const nextAction = getNextAction();
    const firstPlannedEvent = events.find(e => e.status === 'planned' || e.status === 'suggested');

    return (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-slate-800 rounded-2xl p-4 lg:p-5 mb-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

            {/* Mobile Layout (default) */}
            <div className="lg:hidden">
                {/* Day Header */}
                <div className="relative z-content flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-sm font-black">
                            DAY {dayIdx + 1}
                        </span>
                        <span className="text-sm font-bold text-white/80">
                            {day.date}
                        </span>
                    </div>
                    {/* Status indicator & Delete button */}
                    <div className="flex items-center gap-2">
                        {confirmedCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-green-400/20 text-green-100 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle size={10} /> {confirmedCount}
                            </span>
                        )}
                        {plannedCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-100 text-[10px] font-bold">
                                計画中 {plannedCount}
                            </span>
                        )}
                        {/* Delete Day Button - Animated */}
                        {onDeleteDay && (
                            <div className={`overflow-hidden transition-all duration-500 ease-out ${isEditMode ? 'w-8 opacity-100 scale-100' : 'w-0 opacity-0 scale-90 pointer-events-none'}`}>
                                <button
                                    onClick={() => onDeleteDay(day.date, dayIdx)}
                                    className="p-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-100 transition-colors whitespace-nowrap"
                                    title="この日を削除"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Next Action - Main focus (Clickable if editable) */}
                <div
                    className={`relative z-content flex items-center gap-3 mb-3 ${nextAction.editable ? 'cursor-pointer hover:bg-white/10 -mx-2 px-2 py-2 rounded-xl transition-colors' : ''}`}
                    onClick={() => {
                        if (nextAction.editable && firstPlannedEvent && onEditPlanned) {
                            onEditPlanned(firstPlannedEvent);
                        }
                    }}
                >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                        {nextAction.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-black text-white leading-tight">
                            {nextAction.text}
                        </h2>
                        {nextAction.sub && (
                            <p className="text-sm text-white/70 truncate">{nextAction.sub}</p>
                        )}
                    </div>
                    {nextAction.editable && (
                        <ChevronRight size={20} className="text-white/60" />
                    )}
                </div>

                {/* Day Route Display */}
                {routeLocations.length >= 2 && (
                    <div className="relative z-content mb-3 py-2 px-3 bg-white/10 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs text-white/90 flex-wrap">
                            {routeLocations.slice(0, 6).map((loc, i) => (
                                <React.Fragment key={i}>
                                    <span className="font-medium truncate max-w-[80px]" title={loc}>
                                        {loc.length > 10 ? loc.slice(0, 8) + '...' : loc}
                                    </span>
                                    {i < Math.min(routeLocations.length - 1, 5) && (
                                        <span className="text-white/50">→</span>
                                    )}
                                </React.Fragment>
                            ))}
                            {routeLocations.length > 6 && (
                                <span className="text-white/50">+{routeLocations.length - 6}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats + Route Button */}
                <div className="relative z-content flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-xl font-black">{spotCount}</span>
                            <span className="text-xs text-white/70">スポット</span>
                        </div>
                        <div className="flex items-center gap-2 text-white">
                            <span className="text-xl font-black">{moveCount}</span>
                            <span className="text-xs text-white/70">移動</span>
                        </div>
                    </div>
                    {/* Route Button */}
                    <a
                        href={routeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-xs font-bold transition-colors"
                    >
                        <Navigation size={14} />
                        ルート
                    </a>
                </div>
            </div>

            {/* Tablet/Desktop Layout (lg+) - Horizontal 2-column design */}
            <div className="hidden lg:flex lg:items-center lg:gap-6 relative z-content">
                {/* Left: Day info + Next Action */}
                <div className="flex-1 min-w-0">
                    {/* Day Header Row */}
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-sm font-black">
                            DAY {dayIdx + 1}
                        </span>
                        <span className="text-sm font-bold text-white/80">
                            {day.date} {day.dayOfWeek && `(${day.dayOfWeek})`}
                        </span>
                        {/* Status badges inline */}
                        {confirmedCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-green-400/20 text-green-100 text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle size={10} /> {confirmedCount}件確定
                            </span>
                        )}
                        {plannedCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-100 text-[10px] font-bold">
                                {plannedCount}件計画中
                            </span>
                        )}
                        {/* Delete Day Button */}
                        {onDeleteDay && (
                            <div className={`overflow-hidden transition-all duration-500 ease-out ${isEditMode ? 'w-8 opacity-100 scale-100' : 'w-0 opacity-0 scale-90 pointer-events-none'}`}>
                                <button
                                    onClick={() => onDeleteDay(day.date, dayIdx)}
                                    className="p-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-100 transition-colors"
                                    title="この日を削除"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Next Action + Route inline */}
                    <div className="flex items-center gap-4">
                        <div
                            className={`flex items-center gap-3 ${nextAction.editable ? 'cursor-pointer hover:bg-white/10 px-2 py-1.5 -ml-2 rounded-xl transition-colors' : ''}`}
                            onClick={() => {
                                if (nextAction.editable && firstPlannedEvent && onEditPlanned) {
                                    onEditPlanned(firstPlannedEvent);
                                }
                            }}
                        >
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                                {nextAction.icon}
                            </div>
                            <div className="min-w-0">
                                <span className="text-base font-black text-white">
                                    {nextAction.text}
                                </span>
                                {nextAction.sub && (
                                    <span className="text-sm text-white/70 ml-2 truncate">{nextAction.sub}</span>
                                )}
                            </div>
                            {nextAction.editable && (
                                <ChevronRight size={18} className="text-white/60 shrink-0" />
                            )}
                        </div>

                    </div>

                    {/* Route display (tablet/desktop) - show all locations */}
                    {routeLocations.length >= 2 && (
                        <div className="flex items-center gap-1.5 py-1.5 px-3 bg-white/10 rounded-xl text-xs text-white/90 mt-2 flex-wrap">
                            {routeLocations.map((loc, i) => (
                                <React.Fragment key={i}>
                                    <span className="font-medium truncate max-w-[120px]" title={loc}>
                                        {loc.length > 12 ? loc.slice(0, 10) + '..' : loc}
                                    </span>
                                    {i < routeLocations.length - 1 && (
                                        <span className="text-white/50">→</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Stats + Route Button */}
                <div className="flex items-center gap-4 shrink-0">
                    {/* Stats - compact */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-white">
                            <span className="text-lg font-black">{spotCount}</span>
                            <span className="text-[10px] text-white/70">スポット</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white">
                            <span className="text-lg font-black">{moveCount}</span>
                            <span className="text-[10px] text-white/70">移動</span>
                        </div>
                    </div>
                    {/* Route Button */}
                    <a
                        href={routeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-xs font-bold transition-colors"
                    >
                        <Navigation size={14} />
                        ルート
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DynamicSummary;
