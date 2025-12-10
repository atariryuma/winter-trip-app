import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
const PlaceDetailModal = React.lazy(() => import('./views/PlaceDetailModal'));
const RouteModal = React.lazy(() => import('./views/RouteModal'));
import {
    Calendar, Map, Settings as SettingsIcon,
    Plane, Train, Bus, Hotel, MapPin, Utensils, Ticket,
    Plus, ArrowRight, Wallet, CheckCircle, Search,
    Copy, Menu, X, Edit3, Save, Navigation, Phone, Sun, Cloud, Moon, Wind
} from 'lucide-react';
import { initialItinerary } from '../data/initialData';
import { generateId, toMinutes, toTimeStr, getMidTime } from '../utils';
import { getIcon, getWeatherIcon } from './common/IconHelper';
import StatusBadge from './common/StatusBadge';
import LoadingSpinner from './common/LoadingSpinner';
import PortraitLock from './common/PortraitLock';
import ReloadPrompt from './common/ReloadPrompt';
import EditModal from './EditModal';
import LoginView from './views/LoginView';
import server from '../api/gas';

// Lazy load view components
const TicketList = lazy(() => import('./views/TicketList'));
const MapView = lazy(() => import('./views/MapView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const PackingList = lazy(() => import('./views/PackingList'));
const EmergencyContacts = lazy(() => import('./views/EmergencyContacts'));
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
    if (minutes === 0) return '直後';
    if (minutes < 60) return `${minutes}分`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
};

// TimeConnector component - shows line between cards with duration and insert button
const TimeConnector = ({ duration, isEditMode, onInsert }) => {
    const durationText = formatDuration(duration);

    return (
        <div className="flex items-center py-2 pl-6">
            {/* Vertical line with insert button */}
            <div className="w-0.5 h-10 bg-gray-200 dark:bg-slate-700 relative">
                {/* Insert button in edit mode */}
                {isEditMode && onInsert && (
                    <button
                        onClick={onInsert}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-all z-10"
                    >
                        <Plus size={14} />
                    </button>
                )}
                {/* Duration badge - shown when not in edit mode */}
                {!isEditMode && durationText && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap">
                        <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
                            {durationText}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TravelApp() {
    const [itinerary, setItinerary] = useState([]);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [activeTab, setActiveTab] = useState('timeline');
    const [mapUrl, setMapUrl] = useState(null);
    const [mapError, setMapError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedPlaceEvent, setSelectedPlaceEvent] = useState(null);

    // Route Modal State
    const [routeModalOpen, setRouteModalOpen] = useState(false);
    const [routeConfig, setRouteConfig] = useState(null); // { origin, destination }

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
    const [isLandscape, setIsLandscape] = useState(false);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [mapModalQuery, setMapModalQuery] = useState(null);

    const longPressTimer = useRef(null);

    // Scroll detection for immersive mode
    useEffect(() => {
        let lastScrollY = window.scrollY;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;
            const direction = scrollY > lastScrollY && scrollY > 50 ? "down" : "up";

            if (direction !== scrollDirection) {
                setScrollDirection(direction);
            }
            setIsScrolled(scrollY > 20);
            lastScrollY = scrollY > 0 ? scrollY : 0;
        };

        window.addEventListener("scroll", updateScrollDirection);
        return () => window.removeEventListener("scroll", updateScrollDirection);
    }, [scrollDirection]);

    // Landscape mode detection
    useEffect(() => {
        const checkOrientation = () => {
            const isLandscapeMode = window.innerWidth > window.innerHeight && window.innerWidth < 1024;
            setIsLandscape(isLandscapeMode);
        };
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        checkOrientation();
        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    const handleTouchStart = (eventData) => {
        longPressTimer.current = setTimeout(() => {
            setEditItem(eventData);
            setModalOpen(true);
            navigator.vibrate?.(50);
        }, 500);
    };
    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

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

    const yearRange = useMemo(() => {
        if (itinerary.length === 0) return '';
        const parseDate = (dateStr) => {
            const [month, day] = dateStr.split('/').map(Number);
            const baseYear = new Date().getFullYear();
            return month >= 10 ? baseYear : baseYear + 1;
        };
        const firstYear = parseDate(itinerary[0].date);
        const lastYear = parseDate(itinerary[itinerary.length - 1].date);
        return firstYear === lastYear ? `${firstYear}` : `${firstYear}-${lastYear}`;
    }, [itinerary]);

    useEffect(() => {
        if (sessionStorage.getItem('trip_auth') === 'true') setAuth(true);
    }, []);

    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode);
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await server.getData();
            let daysData = [];
            if (Array.isArray(data)) {
                daysData = data;
            } else if (data && data.days) {
                daysData = data.days;
                if (data.mapUrl) setMapUrl(data.mapUrl);
                if (data.mapError) setMapError(data.mapError);
            }

            if (daysData && daysData.length > 0) {
                setItinerary(daysData);
                setSelectedDayId(daysData[0].id);
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
            setItinerary(initialItinerary);
            setSelectedDayId(initialItinerary[0].id);
            setError(`読込エラー: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (auth) fetchData();
    }, [auth, fetchData]);

    useEffect(() => {
        if (itinerary.length > 0) {
            sessionStorage.setItem('trip_data_v7', JSON.stringify(itinerary));
        }
    }, [itinerary]);

    const handleCopy = (text) => { navigator.clipboard.writeText(text); alert(`コピーしました: ${text}`); };

    const openRouteModal = (toEvent, fromEvent) => {
        let origin = '現在地';
        if (fromEvent) {
            origin = fromEvent.place || fromEvent.name || fromEvent.address;
        }
        const destination = toEvent.placeAddress || toEvent.address || toEvent.name;

        setRouteConfig({ origin, destination });
        setRouteModalOpen(true);
    };

    const saveToSpreadsheet = async (newItinerary) => {
        try {
            setSaving(true);
            await server.saveData(newItinerary);
        } catch (err) {
            console.error('Save error:', err);
            alert('保存に失敗しました。ネット接続を確認してください。');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEvent = (newItem) => {
        let updatedItinerary;
        setItinerary(prev => {
            updatedItinerary = prev.map(day => {
                if (day.id === selectedDayId) {
                    let newEvents = editItem
                        ? day.events.map(e => e.id === newItem.id ? newItem : e)
                        : [...day.events, { ...newItem, id: generateId(), type: getCategoryType(newItem.category) }];
                    return { ...day, events: newEvents };
                }
                return day;
            });
            return updatedItinerary;
        });
        setModalOpen(false);
        setEditItem(null);
        if (updatedItinerary) saveToSpreadsheet(updatedItinerary);
    };

    const handleDeleteEvent = (id) => {
        if (!window.confirm("この予定を削除しますか？")) return;
        if (!window.confirm("本当に削除しますか？\nこの操作は取り消せません。")) return;
        let updatedItinerary;
        setItinerary(prev => {
            updatedItinerary = prev.map(day => ({ ...day, events: day.events.filter(e => e.id !== id) }));
            return updatedItinerary;
        });
        setModalOpen(false);
        setEditItem(null);
        if (updatedItinerary) saveToSpreadsheet(updatedItinerary);
    };

    if (!auth) {
        return (
            <LoginView
                onLogin={() => {
                    setAuth(true);
                    sessionStorage.setItem('trip_auth', 'true');
                }}
                validatePasscode={server.validatePasscode}
                yearRange={yearRange}
            />
        );
    }

    const SavingOverlay = saving ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-xl z-[100] flex items-center gap-3 animate-pulse">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="font-bold text-sm">スプレッドシートに保存中...</span>
        </div>
    ) : null;

    if (loading) {
        return (
            <div className="fixed inset-0 w-full h-[100dvh] bg-blue-600 flex items-center justify-center z-[9999]">
                <div className="text-center text-white">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="font-bold tracking-widest text-sm uppercase opacity-80">Loading...</p>
                </div>
            </div>
        );
    }

    const DynamicSummary = ({ day, events, dayIdx }) => {
        if (!day || !events) return null;

        // Calculate from Events data only
        const spotCount = events.filter(e => e.type !== 'transport').length;
        const moveCount = events.filter(e => e.type === 'transport').length;
        const confirmedCount = events.filter(e => e.status === 'booked' || e.status === 'confirmed').length;
        const plannedCount = events.filter(e => e.status === 'planned' || e.status === 'suggested').length;
        const pendingBooking = events.filter(e => e.status === 'planned' && ['flight', 'train', 'hotel'].includes(e.category));

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
                return { icon: <Edit3 size={18} />, text: `${plannedCount}件の計画を確認`, sub: '' };
            }

            return { icon: <CheckCircle size={18} />, text: '準備完了', sub: `${daysUntil}日後に出発` };
        };

        const nextAction = getNextAction();

        return (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 mb-6 shadow-lg">
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
                    {/* Status indicator */}
                    <div className="flex items-center gap-1">
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
                    </div>
                </div>

                {/* Next Action - Main focus */}
                <div className="flex items-center gap-3 mb-3">
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
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-white/90">
                        <span className="text-xl font-black">{spotCount}</span>
                        <span className="text-xs text-white/70">スポット</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90">
                        <span className="text-xl font-black">{moveCount}</span>
                        <span className="text-xs text-white/70">移動</span>
                    </div>
                </div>
            </div>
        );
    };

    // Landscape Mode - Full horizontal scroll view with ALL event data
    if (isLandscape && activeTab === 'timeline' && sortedEvents.length > 0) {
        return (
            <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-[200] flex flex-col">
                {/* Minimal header */}
                <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-lg">
                            DAY {dayIndex + 1}
                        </span>
                        <span className="text-gray-600 dark:text-white/70 font-bold">{selectedDay?.date}</span>
                    </div>
                    <button
                        onClick={() => setIsLandscape(false)}
                        className="text-gray-500 text-xs px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200"
                    >
                        ✕ 閉じる
                    </button>
                </div>

                {/* Horizontal scroll container */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden py-4">
                    <div className="flex h-full gap-3 px-4" style={{ minWidth: 'max-content' }}>
                        {sortedEvents.map((event, index) => (
                            <div
                                key={event.id}
                                className="w-80 h-full bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col shrink-0 border border-gray-200 dark:border-slate-700 overflow-y-auto"
                            >
                                {/* Header: Time + Category + Status */}
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black text-blue-600">
                                            {event.time || '--:--'}
                                        </span>
                                        {event.endTime && (
                                            <span className="text-sm text-gray-400">→ {event.endTime}</span>
                                        )}
                                    </div>
                                    <StatusBadge status={event.status} />
                                </div>

                                {/* Category Badge */}
                                <div className="mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${event.type === 'transport' ? 'bg-blue-100 text-blue-700' :
                                        event.type === 'stay' ? 'bg-indigo-100 text-indigo-700' :
                                            event.category === 'meal' ? 'bg-orange-100 text-orange-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {event.category}
                                    </span>
                                </div>

                                {/* Name */}
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                                    {event.name}
                                </h3>

                                {/* Data Grid */}
                                <div className="space-y-2 text-sm flex-1">
                                    {/* From/To */}
                                    {(event.from || event.to) && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-gray-400 w-16 shrink-0">区間</span>
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {event.from || '?'} → {event.to || '?'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Booking Ref */}
                                    {event.bookingRef && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-gray-400 w-16 shrink-0">予約番号</span>
                                            <span className="text-gray-700 dark:text-gray-300 font-mono text-xs bg-gray-50 dark:bg-slate-700 px-2 py-0.5 rounded">
                                                {event.bookingRef}
                                            </span>
                                        </div>
                                    )}

                                    {/* Memo/Details */}
                                    {(event.memo || event.details) && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-gray-400 w-16 shrink-0">メモ</span>
                                            <span className="text-gray-600 dark:text-gray-400 text-xs">
                                                {event.memo || event.details}
                                            </span>
                                        </div>
                                    )}

                                    {/* Budget */}
                                    {(event.budget || event.budgetAmount) && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-gray-400 w-16 shrink-0">予算</span>
                                            <span className="text-gray-700 dark:text-gray-300 font-bold">
                                                ¥{(event.budget || event.budgetAmount).toLocaleString()}
                                                {event.budgetPaidBy && <span className="text-xs text-gray-400 ml-1">({event.budgetPaidBy})</span>}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Index indicator */}
                                <div className="mt-auto pt-2 text-right">
                                    <span className="text-xs text-gray-300 dark:text-slate-600">{index + 1}/{sortedEvents.length}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[100dvh] bg-[#F2F4F7] dark:bg-slate-900 flex overflow-x-clip font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            <PortraitLock />
            <ReloadPrompt />
            {SavingOverlay}
            {error && (
                <div className="fixed top-20 left-4 right-4 z-[999] bg-red-100 border border-red-200 text-red-800 text-sm p-4 rounded-xl shadow-lg">
                    ⚠️ {error}
                </div>
            )}

            {/* Flat Immersive Edit Button - Only show on Timeline tab */}
            {activeTab === 'timeline' && (
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`fixed top-4 right-4 z-[100] bg-white dark:bg-slate-800 text-slate-500 dark:text-blue-400 p-3 rounded-full shadow-lg border border-gray-100 dark:border-slate-700 transition-all duration-300 active:scale-95 ${isEditMode ? 'ring-2 ring-blue-500 bg-blue-50' : ''} ${scrollDirection === 'down' ? '-translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}
                    aria-label="編集モード切り替え"
                >
                    {isEditMode ? <Save size={20} className="text-blue-600" /> : <Edit3 size={20} />}
                </button>
            )}

            {/* Sidebar (Desktop) */}
            <aside
                className={`hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-40 transition-transform duration-300 ${scrollDirection === 'down' ? '-translate-x-full' : 'translate-x-0'}`}
            >
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                            <Plane className="text-white transform -rotate-45" size={16} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Winter Trip</h1>
                    </div>
                </div>

                <nav className="px-4 space-y-1">
                    {[
                        { id: 'timeline', icon: Calendar, label: 'Timeline' },
                        { id: 'tickets', icon: Ticket, label: 'Tickets' },
                        { id: 'map', icon: MapPin, label: 'Places' },
                        { id: 'budget', icon: Wallet, label: 'Budget' },
                        { id: 'settings', icon: SettingsIcon, label: 'Other' },
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

                    {/* Mobile Header (Fixed) */}
                    <header
                        className={`lg:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top)] ${isScrolled
                            ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 shadow-sm'
                            : 'bg-transparent'
                            } ${scrollDirection === 'down' && isScrolled ? '-translate-y-full' : 'translate-y-0'}`}
                    >
                        <div className="flex items-center justify-center h-14 relative px-2 pl-[calc(0.5rem+env(safe-area-inset-left))] pr-[calc(0.5rem+env(safe-area-inset-right))]">
                            <div className={`flex items-center gap-2 transition-opacity duration-300 ${isScrolled || activeTab !== 'timeline' ? 'opacity-100' : 'opacity-0'}`}>
                                {activeTab !== 'timeline' && (
                                    <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
                                        <Plane className="text-white transform -rotate-45" size={12} />
                                    </div>
                                )}
                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                                    {activeTab === 'timeline' ? 'Winter Trip' :
                                        activeTab === 'tickets' ? 'Tickets' :
                                            activeTab === 'map' ? 'Places' :
                                                activeTab === 'budget' ? 'Budget' :
                                                    activeTab === 'settings' ? 'Other' : ''}
                                </h2>
                            </div>
                        </div>
                    </header>

                    {/* ========== CONTENT BODY ========== */}
                    <Suspense fallback={<LoadingSpinner />}>

                        {activeTab === 'timeline' && (
                            <div className="pt-0 lg:pt-8 max-w-5xl mx-auto w-full pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
                                {/* Large Title Area */}
                                <div className={`pt-[calc(4rem+env(safe-area-inset-top))] pb-2 px-2 transition-all duration-300 ${isScrolled ? 'opacity-0 scale-95 translate-y-[-10px]' : 'opacity-100 scale-100 translate-y-0'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                                                Winter Trip
                                            </h1>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                                {yearRange} • {itinerary.length} Days
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                            <Plane className="text-white transform -rotate-45" size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky Date Tabs */}
                                <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] lg:top-0 z-40 bg-[#F2F4F7]/95 dark:bg-slate-900/95 backdrop-blur-sm pt-2 pb-4 px-2 border-b border-gray-200/50 dark:border-slate-800/50 lg:border-none lg:bg-transparent lg:backdrop-blur-none">
                                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-slate-700 max-w-5xl mx-auto">
                                        {itinerary.map((day, idx) => (
                                            <button
                                                key={day.id}
                                                onClick={() => setSelectedDayId(day.id)}
                                                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 ${selectedDayId === day.id
                                                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm ring-1 ring-gray-100 dark:ring-slate-600"
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
                                    </div>
                                </div>

                                {/* Events List */}
                                <div className="px-2 space-y-6 pb-24 lg:px-0">
                                    {/* Error State */}
                                    {mapError && (
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-4 rounded-xl flex items-center gap-2">
                                            <span>⚠️ マップの読み込みに失敗しました</span>
                                        </div>
                                    )}                 <DynamicSummary day={selectedDay} events={sortedEvents} dayIdx={dayIndex} />

                                    {/* Event List */}
                                    <div className="relative pb-12">
                                        {sortedEvents.map((event, index) => {
                                            const prevEvent = index > 0 ? sortedEvents[index - 1] : null;
                                            const nextEvent = index < sortedEvents.length - 1 ? sortedEvents[index + 1] : null;
                                            const durationToNext = getDurationMinutes(event, nextEvent);

                                            return (
                                                <div key={event.id} className="relative">
                                                    {/* Event Card */}
                                                    <div
                                                        className={`relative bg-white dark:bg-slate-800 rounded-2xl p-4 transition-all duration-200 ${isEditMode ? 'border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-blue-400 cursor-pointer' : 'border border-gray-200 dark:border-slate-700 shadow-sm'}`}
                                                        onClick={() => {
                                                            if (isEditMode) {
                                                                setEditItem(event);
                                                                setModalOpen(true);
                                                            } else {
                                                                // Open MapModal with route from prev event or single pin
                                                                const query = event.type === 'transport'
                                                                    ? event.to
                                                                    : (event.address || event.name);
                                                                setMapModalQuery(query);
                                                                setMapModalOpen(true);
                                                            }
                                                        }}
                                                        onTouchStart={() => handleTouchStart(event)}
                                                        onTouchEnd={handleTouchEnd}
                                                        onTouchMove={handleTouchEnd}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                {/* Time with vertical line indicator */}
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1 h-6 rounded-full bg-blue-500"></div>
                                                                    <span className="font-mono font-bold text-base text-slate-700 dark:text-slate-200">
                                                                        {event.time || '未定'}
                                                                    </span>
                                                                </div>

                                                                <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${event.type === 'stay' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : event.type === 'transport' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                                    {getIcon(event.category, event.type, { size: 10 })}
                                                                    <span>{event.category}</span>
                                                                </div>
                                                            </div>

                                                            <div onClick={(e) => { e.stopPropagation(); setEditItem(event); setModalOpen(true); }} className="cursor-pointer hover:opacity-80 active:scale-95 transition-transform">
                                                                <StatusBadge status={event.status} />
                                                            </div>
                                                        </div>

                                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-1">
                                                            {event.name}
                                                        </h3>

                                                        {/* From/To for transport */}
                                                        {event.type === 'transport' && (event.from || event.to) && (
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mb-2">
                                                                <span>{event.from || '?'}</span>
                                                                <ArrowRight size={12} className="shrink-0" />
                                                                <span>{event.to || '?'}</span>
                                                            </div>
                                                        )}

                                                        {/* Memo display */}
                                                        {event.details && (
                                                            <p className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-2 py-1.5 mb-2">
                                                                {event.details}
                                                            </p>
                                                        )}

                                                        {/* Action Buttons Row */}
                                                        <div className="flex items-center gap-2 mt-2 justify-end">
                                                            {!isEditMode && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedPlaceEvent(event);
                                                                    }}
                                                                    className="h-8 w-8 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                                                    title="詳しく調べる"
                                                                >
                                                                    <Search size={16} />
                                                                </button>
                                                            )}


                                                        </div>
                                                    </div>

                                                    {/* Time Connector - show duration to next event */}
                                                    {nextEvent && (
                                                        <TimeConnector
                                                            duration={durationToNext}
                                                            isEditMode={isEditMode}
                                                            onInsert={() => {
                                                                const midTime = getMidTime(event.endTime || event.time, nextEvent.time);
                                                                setEditItem({ type: 'activity', category: 'sightseeing', status: 'planned', time: midTime, name: '' });
                                                                setModalOpen(true);
                                                            }}
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
                                                className="w-full mt-6 py-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-400 transition-colors flex items-center justify-center gap-2 font-bold"
                                            >
                                                <Plus size={20} /> 予定を追加
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Standard Layout for Other Tabs */}
                        {activeTab !== 'timeline' && (
                            <main className="pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-8 pb-32 lg:pb-0 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
                                <div className="max-w-5xl mx-auto w-full px-2 lg:px-0">
                                    {activeTab === 'tickets' && <TicketList itinerary={itinerary} onForceReload={fetchData} />}
                                    {activeTab === 'map' && <MapView mapUrl={mapUrl} itinerary={itinerary} mapError={mapError} />}
                                    {activeTab === 'budget' && <BudgetView itinerary={itinerary} onForceReload={fetchData} />}
                                    {activeTab === 'packing' && <PackingList />}
                                    {activeTab === 'emergency' && <EmergencyContacts />}
                                    {activeTab === 'settings' && (
                                        <SettingsView
                                            itinerary={itinerary}
                                            setItinerary={setItinerary}
                                            setSelectedDayId={setSelectedDayId}
                                            isDarkMode={isDarkMode}
                                            setIsDarkMode={setIsDarkMode}
                                            lastUpdate={lastUpdate}
                                            setActiveTab={setActiveTab}
                                            onDataRefresh={fetchData}
                                        />
                                    )}
                                </div>
                            </main>
                        )}
                    </Suspense>

                    {/* ========== BOTTOM NAV (Mobile only) ========== */}
                    <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 transition-transform duration-300 pb-[env(safe-area-inset-bottom)] ${scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'}`}>
                        <div className="flex justify-around items-center h-[4.5rem] pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))]">
                            {[
                                { id: 'timeline', icon: Calendar },
                                { id: 'tickets', icon: Ticket },
                                { id: 'map', icon: MapPin },
                                { id: 'budget', icon: Wallet },
                                { id: 'settings', icon: SettingsIcon },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full h-full flex flex-col items-center justify-center transition-all duration-200 ${activeTab === item.id
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-slate-500'
                                        }`}
                                >
                                    <item.icon size={24} strokeWidth={activeTab === item.id ? 2.5 : 2} className="mb-1" />
                                </button>
                            ))}
                        </div>
                    </nav>

                    <Suspense fallback={null}>
                        {selectedPlaceEvent && (
                            <PlaceDetailModal
                                event={selectedPlaceEvent}
                                onClose={() => setSelectedPlaceEvent(null)}
                            />
                        )}
                        {routeModalOpen && routeConfig && (
                            <RouteModal
                                origin={routeConfig.origin}
                                destination={routeConfig.destination}
                                onClose={() => setRouteModalOpen(false)}
                            />
                        )}

                        {/* Map Modal - Shows MapView centered on event location */}
                        {mapModalOpen && mapModalQuery && (
                            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                                <div className="absolute inset-0 bg-black/50" onClick={() => setMapModalOpen(false)} />
                                <div className="relative w-full sm:max-w-lg h-[75vh] sm:h-[70vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 truncate">
                                            <MapPin size={16} className="text-blue-600 shrink-0" />
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
                                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(mapModalQuery)}&zoom=15`}
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
                    />
                </div>
            </div >
        </div >
    );
}

