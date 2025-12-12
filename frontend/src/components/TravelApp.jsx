import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import ExpandableEventCard from './ExpandableEventCard';
import DepartureIndicator from './DepartureIndicator';
import {
    Calendar, Map, Settings as SettingsIcon,
    Plane, Train, Bus, Hotel, MapPin, Utensils, Ticket,
    Plus, ArrowRight, Wallet, CheckCircle,
    X, Edit3, Save, Navigation, Package, ChevronRight, Trash2
} from 'lucide-react';
import { initialItinerary } from '../data/initialData';
import { generateId, toMinutes, toTimeStr, getMidTime } from '../utils';
import { getIcon } from './common/IconHelper';
import StatusBadge from './common/StatusBadge';
import LoadingSpinner from './common/LoadingSpinner';
import ReloadPrompt from './common/ReloadPrompt';
import PullToRefresh from './common/PullToRefresh';
import EditModal from './EditModal';
import LoginView from './views/LoginView';
import server from '../api/gas';

// Lazy load view components
const TicketList = lazy(() => import('./views/TicketList'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const PackingList = lazy(() => import('./views/PackingList'));
const BudgetView = lazy(() => import('./views/BudgetView'));

// Helper: Determine event type from category
const getCategoryType = (category) => {
    if (category === 'hotel') return 'stay';
    if (['flight', 'train', 'bus'].includes(category)) return 'transport';
    return 'activity';
};

// Helper: Calculate duration between two events in minutes
const getDurationMinutes = (currentEvent, nextEvent) => {
    const currentEnd = currentEvent.endTime || currentEvent.time;
    const nextStart = nextEvent?.time;
    if (!currentEnd || !nextStart) return null;
    return toMinutes(nextStart) - toMinutes(currentEnd);
};

// Helper: Format duration for display
const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return null;
    if (minutes < 0) return null; // Overlap
    if (minutes === 0) return 'Next';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// TimeConnector component - shows travel margin between events
// Uses cached route API to calculate: 余裕 = イベント間時間 - 移動時間
const TimeConnector = ({ duration, isEditMode, onInsert, fromLocation, toLocation }) => {
    const [travelMinutes, setTravelMinutes] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch travel time (uses localStorage cache, won't hit API repeatedly)
    useEffect(() => {
        if (!fromLocation?.trim() || !toLocation?.trim()) {
            setTravelMinutes(null);
            return;
        }

        const fetchTravelTime = async () => {
            setLoading(true);
            try {
                const routeData = await server.getRouteMap(fromLocation, toLocation);
                if (routeData?.duration) {
                    // Parse Japanese duration (e.g., "1時間45分", "45分")
                    let minutes = 0;
                    const hourMatch = routeData.duration.match(/(\d+)\s*時間/);
                    const minMatch = routeData.duration.match(/(\d+)\s*分/);
                    if (hourMatch) minutes += parseInt(hourMatch[1], 10) * 60;
                    if (minMatch) minutes += parseInt(minMatch[1], 10);
                    // Fallback: try English format "45 mins"
                    if (minutes === 0) {
                        const numMatch = routeData.duration.match(/(\d+)/);
                        if (numMatch) minutes = parseInt(numMatch[1], 10);
                    }
                    setTravelMinutes(minutes > 0 ? minutes : null);
                }
            } catch (err) {
                console.error('Travel time fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTravelTime();
    }, [fromLocation, toLocation]);

    // Calculate margin: available time - travel time
    const margin = travelMinutes !== null && duration !== null ? duration - travelMinutes : null;

    // Determine status based on margin (or fallback to duration if no travel time)
    const getStatus = () => {
        if (duration === null || duration === undefined) return 'unknown';

        if (travelMinutes !== null && margin !== null) {
            // With travel time: check margin
            if (margin < 0) return 'overlap';   // Not enough time to travel
            if (margin < 10) return 'tight';    // Less than 10 min buffer
            return 'ok';
        }

        // Fallback: use duration directly
        if (duration < 0) return 'overlap';
        if (duration < 15) return 'tight';
        return 'ok';
    };

    const status = getStatus();

    // Display text - always show raw duration, color indicates margin status
    const getText = () => {
        if (loading) return '...';
        if (duration === null || duration === undefined) return null;

        // Always show raw duration format
        if (duration < 0) return `⛔ ${Math.abs(duration)}分 重複`;
        return formatDuration(duration);
    };

    // Color classes
    const getColorClasses = () => {
        switch (status) {
            case 'overlap':
                return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
            case 'tight':
                return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700';
            case 'ok':
                return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700';
            default:
                return 'text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700';
        }
    };

    const text = getText();

    return (
        <div className="flex items-center py-2 pl-6">
            <div className="w-0.5 h-10 bg-gray-200 dark:bg-slate-700 relative">
                {/* Insert button in edit mode */}
                <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isEditMode ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-0 pointer-events-none'}`}>
                    {onInsert && (
                        <button
                            onClick={onInsert}
                            className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 active:scale-95 transition-transform"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
                {/* Duration badge - no link, just display */}
                {text && (
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap transition-all duration-300 ${isEditMode ? 'opacity-0 translate-x-[-10px]' : 'opacity-100 translate-x-0'}`}>
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1 ${getColorClasses()}`}>
                            {text}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};


// DynamicSummary Component - Moved outside to prevent re-renders on parent updates
const DynamicSummary = ({ day, events, dayIdx, previousDayHotel, onEditPlanned, onDeleteDay, isEditMode }) => {
    if (!day || !events) return null;

    // Calculate from Events data only
    const spotCount = events.filter(e => e.type !== 'transport').length;
    const moveCount = events.filter(e => e.type === 'transport').length;
    const confirmedCount = events.filter(e => e.status === 'booked' || e.status === 'confirmed').length;
    const plannedCount = events.filter(e => e.status === 'planned' || e.status === 'suggested').length;
    const pendingBooking = events.filter(e => e.status === 'planned' && ['flight', 'train', 'hotel'].includes(e.category));

    // Calculate time warnings: count schedule gaps < 15 min or overlaps
    const sortedEvents = [...events].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
    let timeWarningCount = 0;
    for (let i = 0; i < sortedEvents.length - 1; i++) {
        const currentEnd = sortedEvents[i].endTime || sortedEvents[i].time;
        const nextStart = sortedEvents[i + 1].time;
        if (currentEnd && nextStart) {
            const gap = toMinutes(nextStart) - toMinutes(currentEnd);
            if (gap < 15) timeWarningCount++;
        }
    }

    // Determine trip phase and next action
    const today = new Date();
    const [month, dayNum] = day.date.split('/').map(Number);
    const tripDate = new Date(today.getFullYear(), month - 1, dayNum);
    const daysUntil = Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24));
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
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 mb-6 shadow-lg">
            {/* Day Header */}
            <div className="flex items-center justify-between mb-4">
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
                    {timeWarningCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-400/30 text-red-100 text-[10px] font-bold flex items-center gap-1">
                            ⚠️ {timeWarningCount}
                        </span>
                    )}
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
                className={`flex items-center gap-3 mb-3 ${nextAction.editable ? 'cursor-pointer hover:bg-white/10 -mx-2 px-2 py-2 rounded-xl transition-colors' : ''}`}
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
            {(() => {
                // Build route locations list
                const allLocations = [];

                // Add previous day hotel as starting point for Day 2+
                if (previousDayHotel) {
                    const hotelName = previousDayHotel.name || previousDayHotel.to;
                    if (hotelName) allLocations.push(hotelName);
                }

                events.forEach(e => {
                    if (e.type === 'transport') {
                        if (e.from) allLocations.push(e.from);
                        if (e.to) allLocations.push(e.to);
                    } else {
                        const loc = e.to || e.name;
                        if (loc) allLocations.push(loc);
                    }
                });

                // Remove consecutive duplicates
                const locations = allLocations.filter((loc, i, arr) =>
                    i === 0 || loc !== arr[i - 1]
                );

                if (locations.length >= 2) {
                    return (
                        <div className="mb-3 py-2 px-3 bg-white/10 rounded-xl">
                            <div className="flex items-center gap-1.5 text-xs text-white/90 flex-wrap">
                                {locations.slice(0, 6).map((loc, i) => (
                                    <React.Fragment key={i}>
                                        <span className="font-medium truncate max-w-[80px]" title={loc}>
                                            {loc.length > 10 ? loc.slice(0, 8) + '...' : loc}
                                        </span>
                                        {i < Math.min(locations.length - 1, 5) && (
                                            <span className="text-white/50">→</span>
                                        )}
                                    </React.Fragment>
                                ))}
                                {locations.length > 6 && (
                                    <span className="text-white/50">+{locations.length - 6}</span>
                                )}
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Stats + Route Button */}
            <div className="flex items-center justify-between">
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
                    href={(() => {
                        // Build locations list including previous day hotel
                        const allLocations = [];

                        // Add previous day hotel as starting point
                        if (previousDayHotel) {
                            const hotelName = previousDayHotel.name || previousDayHotel.to;
                            if (hotelName) allLocations.push(hotelName);
                        }

                        events.forEach(e => {
                            if (e.type === 'transport') {
                                if (e.from) allLocations.push(e.from);
                                if (e.to) allLocations.push(e.to);
                            } else {
                                const loc = e.to || e.name;
                                if (loc) allLocations.push(loc);
                            }
                        });

                        // Remove consecutive duplicates
                        const locations = allLocations.filter((loc, i, arr) =>
                            i === 0 || loc !== arr[i - 1]
                        );
                        if (locations.length === 0) return 'https://www.google.com/maps';
                        if (locations.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locations[0])}`;
                        const origin = encodeURIComponent(locations[0]);
                        const destination = encodeURIComponent(locations[locations.length - 1]);
                        const waypoints = locations.slice(1, -1).slice(0, 9).map(l => encodeURIComponent(l)).join('|');
                        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white text-xs font-bold transition-colors"
                >
                    <Navigation size={14} />
                    ルート
                </a>
            </div>
        </div>
    );
};

export default function TravelApp() {
    const [itinerary, setItinerary] = useState([]);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [activeTab, setActiveTab] = useState('timeline');
    const [isEditMode, setIsEditMode] = useState(false);
    const [expandedEventId, setExpandedEventId] = useState(null);
    const [scrollDirection, setScrollDirection] = useState('up');
    const [isScrolled, setIsScrolled] = useState(false);
    const [auth, setAuth] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const [lastUpdate, setLastUpdate] = useState(() => localStorage.getItem('lastUpdate') || null);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [mapModalQuery, setMapModalQuery] = useState(null);

    // Interactive swipe navigation for mobile day switching (page transition style)
    const [viewportOffset, setViewportOffset] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const isSwiping = useRef(false);
    const swipeContainerRef = useRef(null);

    // Scroll detection for immersive mode
    useEffect(() => {
        let lastScrollY = window.scrollY;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;
            const direction = scrollY > lastScrollY && scrollY > 50 ? "down" : "up";

            if (direction !== scrollDirection) {
                setScrollDirection(direction);
            }
            setIsScrolled(scrollY > 10);
            lastScrollY = scrollY > 0 ? scrollY : 0;
        };

        window.addEventListener("scroll", updateScrollDirection);
        return () => window.removeEventListener("scroll", updateScrollDirection);
    }, [scrollDirection]);



    const selectedDay = useMemo(() => itinerary.find(d => d.id === selectedDayId), [itinerary, selectedDayId]);
    const sortedEvents = useMemo(() => {
        if (!selectedDay) return [];
        return [...selectedDay.events].sort((a, b) => {
            const t1 = (a.time || '23:59').padStart(5, '0');
            const t2 = (b.time || '23:59').padStart(5, '0');
            return t1.localeCompare(t2);
        });
    }, [selectedDay]);
    const dayIndex = useMemo(() => itinerary.findIndex(d => d.id === selectedDayId), [itinerary, selectedDayId]);

    const handleTouchStart = (e) => {
        if (isTransitioning) return;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isSwiping.current = false;
    };

    const handleTouchMove = (e) => {
        if (isTransitioning) return;
        const deltaX = e.touches[0].clientX - touchStartX.current;
        const deltaY = e.touches[0].clientY - touchStartY.current;

        if (!isSwiping.current && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
            isSwiping.current = true;
        }

        if (isSwiping.current) {
            let offset = deltaX;
            if ((dayIndex === 0 && deltaX > 0) || (dayIndex === itinerary.length - 1 && deltaX < 0)) {
                offset = deltaX * 0.3;
            }
            setViewportOffset(offset);
        }
    };

    const handleTouchEnd = () => {
        if (!isSwiping.current || isTransitioning) {
            setViewportOffset(0);
            return;
        }

        const threshold = 75;
        const viewWidth = swipeContainerRef.current?.offsetWidth || window.innerWidth;

        if (viewportOffset < -threshold && dayIndex < itinerary.length - 1) {
            setIsTransitioning(true);
            setViewportOffset(-viewWidth);
            setTimeout(() => {
                setSelectedDayId(itinerary[dayIndex + 1].id);
                setViewportOffset(0);
                setIsTransitioning(false);
            }, 350);
        } else if (viewportOffset > threshold && dayIndex > 0) {
            setIsTransitioning(true);
            setViewportOffset(viewWidth);
            setTimeout(() => {
                setSelectedDayId(itinerary[dayIndex - 1].id);
                setViewportOffset(0);
                setIsTransitioning(false);
            }, 350);
        } else {
            setIsTransitioning(true);
            setViewportOffset(0);
            setTimeout(() => setIsTransitioning(false), 350);
        }

        isSwiping.current = false;
    };

    const yearRange = useMemo(() => {
        if (itinerary.length === 0) return '';
        const parseDate = (dateStr) => {
            const [month] = dateStr.split('/').map(Number);
            const baseYear = new Date().getFullYear();
            return month >= 10 ? baseYear : baseYear + 1;
        };
        const firstYear = parseDate(itinerary[0].date);
        const lastYear = parseDate(itinerary[itinerary.length - 1].date);
        return firstYear === lastYear ? `${firstYear}` : `${firstYear}-${lastYear}`;
    }, [itinerary]);

    useEffect(() => {
        // Check for persistent auth (localStorage)
        if (localStorage.getItem('tripapp_authenticated') === 'true') setAuth(true);
    }, []);

    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode);
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const fetchData = React.useCallback(async (showLoading = true) => {
        try {
            // Only show full loading screen for initial load, not for background refresh
            if (showLoading) setLoading(true);
            const data = await server.getData();
            let daysData = [];
            if (Array.isArray(data)) {
                daysData = data;
            } else if (data && data.days) {
                daysData = data.days;
            }

            if (daysData && daysData.length > 0) {
                setItinerary(daysData);
                setSelectedDayId(prev => {
                    // Keep same day selected if it still exists, otherwise select first
                    if (daysData.some(d => d.id === prev)) return prev;
                    return daysData[0].id;
                });
                setError(null);
                if (data.lastUpdate) {
                    setLastUpdate(data.lastUpdate);
                    localStorage.setItem('lastUpdate', data.lastUpdate);
                }
            } else {
                throw new Error('No data');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            // Only set fallback on initial load, not when refreshing existing data
            setItinerary(prev => {
                if (!prev || prev.length === 0) {
                    setSelectedDayId(initialItinerary[0].id);
                    return initialItinerary;
                }
                return prev;
            });
            setError(`Load error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []); // No external dependencies - fetchData is stable

    useEffect(() => {
        if (auth) {
            fetchData();
        }
    }, [auth, fetchData]); // Only depend on auth, not fetchData

    useEffect(() => {
        if (itinerary.length > 0) {
            sessionStorage.setItem('trip_data_v7', JSON.stringify(itinerary));
        }
    }, [itinerary]);

    const handleSaveEvent = async (newItem) => {
        // Save previous state for rollback
        const previousItinerary = [...itinerary];

        // Check if this is a move operation (date changed)
        const isMoving = newItem.newDate && newItem.newDate !== newItem.originalDate;
        let targetDay, isEdit = !!editItem;

        if (isMoving) {
            // Moving event to a different day
            setItinerary(prev => {
                return prev.map(day => {
                    // Remove from original day
                    if (day.date === newItem.originalDate) {
                        return { ...day, events: day.events.filter(e => e.id !== newItem.id) };
                    }
                    // Add to new day
                    if (day.date === newItem.newDate) {
                        targetDay = day;
                        // Remove move-related properties before adding
                        const cleanItem = { ...newItem };
                        delete cleanItem.newDate;
                        delete cleanItem.originalDate;
                        return { ...day, events: [...day.events, cleanItem] };
                    }
                    return day;
                });
            });
        } else {
            // Normal edit or add
            setItinerary(prev => {
                return prev.map(day => {
                    if (day.id === selectedDayId) {
                        targetDay = day;
                        let newEvents = isEdit
                            ? day.events.map(e => e.id === newItem.id ? newItem : e)
                            : [...day.events, { ...newItem, id: generateId(), type: getCategoryType(newItem.category) }];
                        return { ...day, events: newEvents };
                    }
                    return day;
                });
            });
        }
        setModalOpen(false);
        setEditItem(null);

        // Background save using optimized API
        try {
            setSaving(true);
            if (isMoving) {
                // Call moveEvent API - use original name for event lookup
                const originalDay = itinerary.find(d => d.date === newItem.originalDate);
                const originalEvent = originalDay?.events.find(e => e.id === newItem.id);
                const originalEventName = originalEvent?.name || newItem.name;

                await server.moveEvent({
                    originalDate: newItem.originalDate,
                    eventId: originalEventName,
                    newDate: newItem.newDate,
                    newStartTime: newItem.time,
                    newEndTime: newItem.endTime
                });
            } else if (isEdit) {
                // Update existing event using batch API (much faster than full save)
                await server.batchUpdateEvents([{
                    date: targetDay.date,
                    eventId: targetDay.events.find(e => e.id === newItem.id)?.name || newItem.name, // Use original name if available
                    eventData: newItem
                }]);
            } else {
                // Add new event using optimized API
                await server.addEvent({ ...newItem, date: targetDay.date });
            }

            // Cache invalidation: if location-related fields changed, invalidate old caches
            if (isEdit && editItem) {
                // Check if name/location changed
                if (editItem.name !== newItem.name) {
                    server.invalidateLocationCache(editItem.name);
                }
                if (editItem.to !== newItem.to) {
                    server.invalidateLocationCache(editItem.to);
                }
                if (editItem.from !== newItem.from) {
                    server.invalidateLocationCache(editItem.from);
                }
            }
        } catch (err) {
            console.error('Save error:', err);
            // Rollback UI on error
            setItinerary(previousItinerary);
            alert('保存に失敗しました。変更を元に戻しました。');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm("この予定を削除しますか？")) return;
        if (!window.confirm("本当に削除しますか？\nこの操作は取り消せません。")) return;

        // Save previous state for rollback
        const previousItinerary = [...itinerary];

        // Find the event to delete
        let eventToDelete, dayDate;
        for (const day of itinerary) {
            const event = day.events.find(e => e.id === id);
            if (event) {
                eventToDelete = event;
                dayDate = day.date;
                break;
            }
        }

        // Optimistically update UI immediately
        setItinerary(prev => prev.map(day => ({ ...day, events: day.events.filter(e => e.id !== id) })));
        setModalOpen(false);
        setEditItem(null);

        // Background delete using optimized API
        if (eventToDelete && dayDate) {
            try {
                setSaving(true);
                await server.deleteEvent(dayDate, eventToDelete.name);
            } catch (err) {
                console.error('Delete error:', err);
                // Rollback UI on error
                setItinerary(previousItinerary);
                alert('削除に失敗しました。変更を元に戻しました。');
            } finally {
                setSaving(false);
            }
        }
    };

    const handleDeleteDay = async (date, dayIdx) => {
        if (!window.confirm(`Day ${dayIdx + 1} (${date}) のすべての予定を削除しますか？`)) return;
        if (!window.confirm(`本当に削除しますか？\n${date}のすべてのイベントが削除されます。\nこの操作は取り消せません。`)) return;

        // Save previous state for rollback
        const previousItinerary = [...itinerary];

        // Optimistically remove the day from UI
        setItinerary(prev => prev.filter(day => day.date !== date));

        // Select the first remaining day or null
        const remainingDays = itinerary.filter(day => day.date !== date);
        if (remainingDays.length > 0) {
            setSelectedDayId(remainingDays[0].id);
        }

        // Background delete using API
        try {
            setSaving(true);
            await server.deleteEventsByDate(date);
        } catch (err) {
            console.error('Delete day error:', err);
            // Rollback UI on error
            setItinerary(previousItinerary);
            alert('日程の削除に失敗しました。変更を元に戻しました。');
        } finally {
            setSaving(false);
        }
    };

    const addNewDay = async () => {
        if (itinerary.length === 0) return;

        const lastDay = itinerary[itinerary.length - 1];
        const [month, day] = lastDay.date.split('/').map(Number);

        // Create date object for the last day
        const currentYear = new Date().getFullYear();
        const baseYear = month >= 10 ? currentYear : currentYear + 1;
        const lastDate = new Date(baseYear, month - 1, day);

        // Add one day
        const newDate = new Date(lastDate);
        newDate.setDate(newDate.getDate() + 1);

        // Get day of week
        const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = daysOfWeek[newDate.getDay()];

        const dateStr = `${newDate.getMonth() + 1}/${newDate.getDate()}`;

        // Create placeholder event for the new day
        const placeholderEvent = {
            id: generateId(),
            type: 'activity',
            category: 'sightseeing',
            name: 'New Event',
            time: '09:00',
            endTime: '',
            status: 'planned',
            details: ''
        };

        // Create new day object
        const newDay = {
            id: generateId(),
            date: dateStr,
            dayOfWeek,
            title: '',
            summary: '',
            theme: 'default',
            events: [placeholderEvent]
        };

        // Optimistically update UI immediately
        setItinerary(prev => [...prev, newDay]);
        setSelectedDayId(newDay.id);

        // Background save - add placeholder event to create the day
        try {
            setSaving(true);
            await server.addEvent({ ...placeholderEvent, date: dateStr });
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save. Please check your connection.');
        } finally {
            setSaving(false);
        }
    };

    if (!auth) {
        return (
            <LoginView
                onLogin={() => {
                    setAuth(true);
                    localStorage.setItem('tripapp_authenticated', 'true');
                }}
                validatePasscode={server.validatePasscode}
                yearRange={yearRange}
            />
        );
    }

    const SavingOverlay = saving ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-xl z-notification flex items-center gap-3 animate-pulse pointer-events-none">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="font-bold text-sm">スプレッドシートに保存中...</span>
        </div>
    ) : null;

    if (loading) {
        return (
            <div className="fixed inset-0 w-full h-[100dvh] bg-indigo-600 flex items-center justify-center z-max">
                <div className="text-center text-white">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="font-bold tracking-widest text-sm uppercase opacity-80">Loading...</p>
                </div>
            </div>
        );
    }



    // Note: Landscape mode is handled via CSS (landscape-hide-header/footer classes)

    return (
        <div className="w-full min-h-[100dvh] bg-gray-100 dark:bg-slate-900 flex overflow-x-clip font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <ReloadPrompt />
            {SavingOverlay}
            {error && (
                <div className="fixed top-20 left-4 right-4 z-overlay bg-red-100 border border-red-200 text-red-800 text-sm p-4 rounded-xl shadow-lg">
                    ⚠️ {error}
                </div>
            )}

            {/* Sidebar (Desktop) */}
            <aside
                className={`hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-fixed transition-transform duration-300 ${scrollDirection === 'down' ? '-translate-x-full' : 'translate-x-0'}`}
            >
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                            <Plane className="text-white transform -rotate-45" size={16} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">TripPlanner</h1>
                    </div>
                </div>

                <nav className="px-4 space-y-1">
                    {[
                        { id: 'timeline', icon: Calendar, label: 'Timeline' },
                        { id: 'packing', icon: Package, label: 'Lists' },
                        { id: 'budget', icon: Wallet, label: 'Budget' },
                        { id: 'tickets', icon: Ticket, label: 'Tickets' },
                        { id: 'settings', icon: SettingsIcon, label: 'Settings' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${activeTab === item.id
                                ? 'bg-gray-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* ========== MAIN CONTENT AREA ========== */}
            <div className="lg:pl-64 flex-1 min-h-screen pb-24 lg:pb-0">
                <div className="w-full h-full">

                    {/* Mobile Header (Fixed) - Hidden in landscape */}
                    <header
                        className={`lg:hidden landscape-hide-header fixed top-0 left-0 right-0 z-sticky transition-all duration-300 pt-[env(safe-area-inset-top)] ${isScrolled
                            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm'
                            : 'bg-transparent'
                            } ${scrollDirection === 'down' && isScrolled ? '-translate-y-full' : 'translate-y-0'}`}
                    >
                        <div className="flex items-center justify-center h-14 relative px-4 sm:px-6 pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] sm:pl-[calc(1.5rem+env(safe-area-inset-left))] sm:pr-[calc(1.5rem+env(safe-area-inset-right))]">
                            <div className={`flex items-center gap-2 transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm">
                                    <Plane className="text-white transform -rotate-45" size={12} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                    {activeTab === 'timeline' ? 'TripPlanner' :
                                        activeTab === 'tickets' ? 'Tickets' :
                                            activeTab === 'packing' ? 'Lists' :
                                                activeTab === 'budget' ? 'Budget' :
                                                    activeTab === 'settings' ? 'Settings' : ''}
                                </h2>
                            </div>
                        </div>
                    </header>

                    {/* ========== CONTENT BODY ========== */}
                    <Suspense fallback={<LoadingSpinner />}>

                        {activeTab === 'timeline' && (
                            <PullToRefresh onRefresh={() => fetchData(false)} disabled={isEditMode}>
                                <div className="pt-0 lg:pt-6 max-w-full mx-auto w-full pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">

                                    {/* ===== MOBILE VIEW (Single Day with Tabs) ===== */}
                                    <div className="lg:hidden">
                                        {/* Large Title Area */}
                                        <div className={`pt-[calc(4rem+env(safe-area-inset-top))] pb-2 px-4 sm:px-6 transition-all duration-300 ${isScrolled ? 'opacity-0 scale-95 translate-y-[-10px]' : 'opacity-100 scale-100 translate-y-0'}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                                                        TripPlanner
                                                    </h1>
                                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                        {yearRange} • {itinerary.length} Days
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                                    <Plane className="text-white transform -rotate-45" size={20} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sticky Date Tabs */}
                                        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-sticky-content bg-gray-100/95 dark:bg-slate-900/95 backdrop-blur-sm pt-2 pb-4 px-4 sm:px-6 border-b border-gray-200/50 dark:border-slate-800/50">
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-slate-700 transition-all duration-300 ease-out overflow-x-auto scrollbar-hide w-full">
                                                {itinerary.map((day, idx) => (
                                                    <button
                                                        key={day.id}
                                                        onClick={() => setSelectedDayId(day.id)}
                                                        className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-300 ease-out ${selectedDayId === day.id
                                                            ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-gray-100 dark:ring-slate-600"
                                                            : "text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700"
                                                            }`}
                                                    >
                                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                                                            Day {idx + 1}
                                                        </span>
                                                        <span className="text-sm font-black">
                                                            {day.date.split('/')[1]}
                                                            <span className="text-[10px] font-medium ml-0.5 opacity-60">
                                                                {day.dayOfWeek}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ))}

                                                {/* Add Day Button - Always rendered, animated with opacity and width */}
                                                <button
                                                    onClick={addNewDay}
                                                    disabled={!isEditMode}
                                                    className={`flex-shrink-0 h-10 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-all duration-300 ease-out active:scale-95 overflow-hidden ${isEditMode
                                                        ? 'opacity-100 scale-100 pointer-events-auto w-10'
                                                        : 'opacity-0 scale-90 pointer-events-none w-0'
                                                        }`}
                                                    aria-label="新しい日を追加"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mobile Events - Single day with swipe navigation */}
                                        <div
                                            ref={swipeContainerRef}
                                            className="overflow-hidden"
                                            onTouchStart={handleTouchStart}
                                            onTouchMove={handleTouchMove}
                                            onTouchEnd={handleTouchEnd}
                                        >
                                            <div
                                                className="px-4 sm:px-6 space-y-6 pb-24"
                                                style={{
                                                    transform: `translateX(${viewportOffset}px)`,
                                                    transition: isTransitioning ? 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none'
                                                }}
                                            >
                                                <DynamicSummary
                                                    day={selectedDay}
                                                    events={sortedEvents}
                                                    dayIdx={dayIndex}
                                                    previousDayHotel={(() => {
                                                        if (dayIndex <= 0) return null;
                                                        const prevDay = itinerary[dayIndex - 1];
                                                        return prevDay?.events.filter(e => e.category === 'hotel' || e.category === 'stay').pop();
                                                    })()}
                                                    onEditPlanned={(event) => {
                                                        setEditItem(event);
                                                        setModalOpen(true);
                                                    }}
                                                    onDeleteDay={handleDeleteDay}
                                                    isEditMode={isEditMode}
                                                />

                                                {/* Departure Indicator - Shows where today starts from */}
                                                {(() => {
                                                    if (dayIndex <= 0) return null;
                                                    const prevDay = itinerary[dayIndex - 1];
                                                    if (!prevDay || !prevDay.events) return null;
                                                    const prevHotel = prevDay.events.filter(e => e.type === 'stay' || e.category === 'hotel').pop();
                                                    if (!prevHotel) return null;
                                                    const firstEvent = sortedEvents[0];
                                                    if (!firstEvent) return null;
                                                    return (
                                                        <DepartureIndicator
                                                            prevHotel={prevHotel}
                                                            firstEvent={firstEvent}
                                                        />
                                                    );
                                                })()}

                                                {/* Event List */}
                                                <div className="relative pb-12">
                                                    {sortedEvents.map((event, index) => {
                                                        const prevEvent = index > 0 ? sortedEvents[index - 1] : null;
                                                        // For first event, use previous day hotel if exists
                                                        const getRouteOrigin = () => {
                                                            if (prevEvent) {
                                                                return prevEvent.to || prevEvent.address || prevEvent.name;
                                                            }
                                                            if (dayIndex > 0) {
                                                                const prevDay = itinerary[dayIndex - 1];
                                                                const prevHotel = prevDay?.events.filter(e => e.category === 'hotel' || e.category === 'stay').pop();
                                                                return prevHotel?.name || null;
                                                            }
                                                            return null;
                                                        };
                                                        const routeOrigin = getRouteOrigin();
                                                        const nextEvent = index < sortedEvents.length - 1 ? sortedEvents[index + 1] : null;
                                                        const durationToNext = getDurationMinutes(event, nextEvent);

                                                        return (
                                                            <div key={event.id} className="relative">
                                                                {/* Expandable Event Card */}
                                                                <ExpandableEventCard
                                                                    event={event}
                                                                    isExpanded={expandedEventId === event.id}
                                                                    onToggle={() => setExpandedEventId(
                                                                        expandedEventId === event.id ? null : event.id
                                                                    )}
                                                                    isEditMode={isEditMode}
                                                                    onEdit={(e) => {
                                                                        setEditItem(e);
                                                                        setModalOpen(true);
                                                                    }}
                                                                    onDelete={() => handleDeleteEvent(event.id)}
                                                                    routeOrigin={routeOrigin}
                                                                    previousDayHotel={(() => {
                                                                        if (dayIndex <= 0) return null;
                                                                        const prevDay = itinerary[dayIndex - 1];
                                                                        return prevDay?.events.filter(e => e.category === 'hotel' || e.category === 'stay').pop();
                                                                    })()}
                                                                />
                                                                {nextEvent && (
                                                                    <TimeConnector
                                                                        duration={durationToNext}
                                                                        isEditMode={isEditMode}
                                                                        onInsert={() => {
                                                                            const midTime = getMidTime(event.endTime || event.time, nextEvent.time);
                                                                            setEditItem({ type: 'activity', category: 'sightseeing', status: 'planned', time: midTime, name: '' });
                                                                            setModalOpen(true);
                                                                        }}
                                                                        fromLocation={event.to || event.address || event.name}
                                                                        toLocation={nextEvent.type === 'transport' ? nextEvent.from : (nextEvent.to || nextEvent.name)}
                                                                    />
                                                                )}
                                                            </div>
                                                        );
                                                    })}

                                                    {isEditMode && (
                                                        <button
                                                            onClick={() => {
                                                                const lastTime = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].time : '09:00';
                                                                const nextTime = toTimeStr(toMinutes(lastTime) + 60);
                                                                setEditItem({ type: 'activity', category: 'sightseeing', status: 'planned', time: nextTime, name: '' });
                                                                setModalOpen(true);
                                                            }}
                                                            className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl text-gray-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors flex items-center justify-center gap-2 font-bold"
                                                        >
                                                            <Plus size={20} /> 予定を追加
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ===== DESKTOP VIEW (Multi-Column Layout) ===== */}
                                    <div className="hidden lg:block">
                                        {/* Header */}
                                        <div className="px-8 pb-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                                                        TripPlanner
                                                    </h1>
                                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                        {yearRange} • {itinerary.length} Days
                                                    </p>
                                                </div>
                                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                                    <Plane className="text-white transform -rotate-45" size={20} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Multi-Column Container */}
                                        <div className="flex gap-4 px-6 overflow-x-auto pb-6 scrollbar-hide" style={{ height: 'calc(100vh - 140px)' }}>
                                            {itinerary.map((day, dayIdx) => {
                                                const daySortedEvents = [...(day.events || [])].sort((a, b) => {
                                                    const t1 = (a.time || '23:59').padStart(5, '0');
                                                    const t2 = (b.time || '23:59').padStart(5, '0');
                                                    return t1.localeCompare(t2);
                                                });

                                                return (
                                                    <div
                                                        key={day.id}
                                                        className="flex-none w-80 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden shadow-sm"
                                                    >
                                                        {/* Day Header */}
                                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 shrink-0">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                                                                        Day {dayIdx + 1}
                                                                    </span>
                                                                    <span className="font-bold text-gray-800 dark:text-white text-sm">
                                                                        {day.date}
                                                                    </span>
                                                                    <span className="text-xs text-gray-400">
                                                                        {day.dayOfWeek}
                                                                    </span>
                                                                </div>
                                                                <span className="text-xs text-gray-400">
                                                                    {daySortedEvents.length}件
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Scrollable Events */}
                                                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                                            {daySortedEvents.map((event) => (
                                                                <div
                                                                    key={event.id}
                                                                    onClick={() => {
                                                                        if (isEditMode) {
                                                                            setSelectedDayId(day.id);
                                                                            setEditItem(event);
                                                                            setModalOpen(true);
                                                                        } else {
                                                                            const query = event.type === 'transport'
                                                                                ? event.to
                                                                                : (event.address || event.name);
                                                                            setMapModalQuery(query);
                                                                            setMapModalOpen(true);
                                                                        }
                                                                    }}
                                                                    className={`bg-gray-50 dark:bg-slate-700/50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${isEditMode ? 'border-2 border-dashed border-gray-300 dark:border-slate-600' : ''}`}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                                            {event.time || '--:--'}{event.endTime ? ` → ${event.endTime}` : ''}
                                                                        </span>
                                                                        <StatusBadge status={event.status} />
                                                                    </div>
                                                                    <h4 className="font-bold text-sm text-gray-800 dark:text-white leading-tight">
                                                                        {event.name}
                                                                    </h4>
                                                                    {event.type === 'transport' && (event.from || event.to) && (
                                                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                                            <span>{event.from || '?'}</span>
                                                                            <ArrowRight size={10} />
                                                                            <span>{event.to || '?'}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}

                                                            {isEditMode && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedDayId(day.id);
                                                                        const lastTime = daySortedEvents.length > 0 ? daySortedEvents[daySortedEvents.length - 1].time : '09:00';
                                                                        const nextTime = toTimeStr(toMinutes(lastTime) + 60);
                                                                        setEditItem({ type: 'activity', category: 'sightseeing', status: 'planned', time: nextTime, name: '' });
                                                                        setModalOpen(true);
                                                                    }}
                                                                    className="w-full py-2 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl text-gray-400 hover:text-indigo-600 hover:border-indigo-400 transition-colors flex items-center justify-center gap-1 text-sm font-bold"
                                                                >
                                                                    <Plus size={14} /> 追加
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </PullToRefresh>
                        )}

                        {/* Standard Layout for Other Tabs */}
                        {activeTab !== 'timeline' && activeTab !== 'settings' && (
                            <PullToRefresh onRefresh={() => fetchData(false)}>
                                <main className="pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-8 pb-32 lg:pb-8 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] overflow-x-hidden">
                                    <div className="max-w-full lg:max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 overflow-x-hidden">
                                        {activeTab === 'tickets' && <TicketList itinerary={itinerary} onForceReload={fetchData} isScrolled={isScrolled} onEventClick={(event) => { setEditItem(event); setModalOpen(true); }} />}
                                        {activeTab === 'budget' && <BudgetView itinerary={itinerary} onForceReload={fetchData} isScrolled={isScrolled} />}
                                        {activeTab === 'packing' && <PackingList isScrolled={isScrolled} />}
                                    </div>
                                </main>
                            </PullToRefresh>
                        )}

                        {/* Settings Tab (No Pull-to-Refresh) */}
                        {activeTab === 'settings' && (
                            <main className="pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-8 pb-32 lg:pb-8 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] overflow-x-hidden">
                                <div className="max-w-full lg:max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:px-12 overflow-x-hidden">
                                    <SettingsView
                                        itinerary={itinerary}
                                        isDarkMode={isDarkMode}
                                        setIsDarkMode={setIsDarkMode}
                                        lastUpdate={lastUpdate}
                                        onDataRefresh={fetchData}
                                        onLogout={() => setAuth(false)}
                                        isScrolled={isScrolled}
                                    />
                                </div>
                            </main>
                        )}
                    </Suspense>

                    {/* ========== BOTTOM NAV (Mobile only) - Hidden in landscape ========== */}
                    <nav className={`lg:hidden landscape-hide-footer fixed bottom-0 left-0 right-0 z-fixed bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-transform duration-300 pb-[env(safe-area-inset-bottom)] ${scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'}`}>
                        <div className="flex justify-around items-center h-16 pt-1 pb-1 pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))]">
                            {[
                                { id: 'timeline', icon: Calendar },
                                { id: 'packing', icon: Package },
                                { id: 'budget', icon: Wallet },
                                { id: 'tickets', icon: Ticket },
                                { id: 'settings', icon: SettingsIcon },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full h-full flex flex-col items-center justify-center transition-all duration-200 ${activeTab === item.id
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-400 dark:text-slate-500'
                                        }`}
                                >
                                    <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} className="mb-1" />
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Flat Immersive Edit Button - Only show on Timeline tab */}
                    {activeTab === 'timeline' && (
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`fixed top-4 right-4 z-fixed bg-white dark:bg-slate-800 text-slate-500 dark:text-indigo-400 p-3 rounded-full shadow-lg border border-gray-100 dark:border-slate-700 transition-all duration-300 active:scale-95 ${isEditMode ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''} ${scrollDirection === 'down' ? '-translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}
                            aria-label="編集モード切り替え"
                        >
                            {isEditMode ? <Save size={20} className="text-indigo-600" /> : <Edit3 size={20} />}
                        </button>
                    )}

                    <Suspense fallback={null}>
                        {/* Map Modal - Shows MapView centered on event location */}
                        {mapModalOpen && mapModalQuery && (
                            <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
                                <div className="absolute inset-0 bg-black/50" onClick={() => setMapModalOpen(false)} />
                                <div className="relative w-full sm:max-w-lg h-[75vh] sm:h-[70vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up-spring">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 truncate">
                                            <MapPin size={16} className="text-indigo-600 shrink-0" />
                                            <span className="truncate">{mapModalQuery}</span>
                                        </h3>
                                        <button
                                            onClick={() => setMapModalOpen(false)}
                                            className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-600 hover:bg-gray-200 shrink-0"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    {/* Map iframe */}
                                    <div className="flex-1">
                                        <iframe
                                            src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(mapModalQuery)}&zoom=15`}
                                            className="w-full h-full border-0"
                                            allowFullScreen
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </Suspense>

                    <EditModal
                        isOpen={modalOpen}
                        onClose={() => { setModalOpen(false); setEditItem(null); }}
                        item={editItem}
                        onSave={handleSaveEvent}
                        onDelete={handleDeleteEvent}
                        previousEvent={(() => {
                            if (!editItem || !selectedDay) return null;
                            const idx = sortedEvents.findIndex(e => e.id === editItem.id);
                            return idx > 0 ? sortedEvents[idx - 1] : null;
                        })()}
                        currentDate={selectedDay?.date}
                        availableDates={itinerary.map(day => ({
                            value: day.date,
                            label: `${day.date} (${day.dayOfWeek})`
                        }))}
                    />
                </div>
            </div >
        </div >
    );
}

