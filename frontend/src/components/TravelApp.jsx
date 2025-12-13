import { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import EventCard from './EventCard';
import DepartureIndicator from './DepartureIndicator';
import TimeConnector from './TimeConnector';
import DynamicSummary from './DynamicSummary';
import {
    Calendar, Settings as SettingsIcon,
    Plane, Ticket,
    Plus, Wallet,
    Edit3, Save, Package
} from 'lucide-react';
import { generateId, toMinutes, toTimeStr, getMidTime, getDurationMinutes, getTripDate, getTripYear } from '../utils';
import LoadingSpinner from './common/LoadingSpinner';
import ReloadPrompt from './common/ReloadPrompt';
import PullToRefresh from './common/PullToRefresh';
import EditModal from './EditModal';
import LoginView from './views/LoginView';
import server from '../api/gas';
import { useToast } from '../context/ToastContext';
import { useScrollState, useDayTabScroll, useAuth, useDarkMode, useSidebar } from '../hooks';
import { ChevronLeft, ChevronRight, X, MapPin } from 'lucide-react';

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

export default function TravelApp() {
    // Custom hooks for separated concerns
    const { scrollDirection, isScrolled } = useScrollState();
    const { auth, login, logout } = useAuth();
    const { isDarkMode, setIsDarkMode } = useDarkMode();
    const { showToast } = useToast();
    const { isCollapsed: isSidebarCollapsed, toggle: toggleSidebar } = useSidebar();

    // Itinerary state - kept in component for now to minimize risk
    const [itinerary, setItinerary] = useState([]);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(() => localStorage.getItem('lastUpdate') || null);

    // UI state
    const [activeTab, setActiveTab] = useState('timeline');
    const [isEditMode, setIsEditMode] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [mapModalQuery] = useState(null);
    const [expandedEventId, setExpandedEventId] = useState(null);

    // Day tab scroll management
    const { dayTabContainerRef, setDayTabRef } = useDayTabScroll(selectedDayId);

    // Memoized derived state
    const selectedDay = useMemo(
        () => itinerary.find(d => d.id === selectedDayId),
        [itinerary, selectedDayId]
    );

    const sortedEvents = useMemo(() => {
        if (!selectedDay) return [];
        return [...selectedDay.events].sort((a, b) => {
            const t1 = (a.time || '23:59').padStart(5, '0');
            const t2 = (b.time || '23:59').padStart(5, '0');
            return t1.localeCompare(t2);
        });
    }, [selectedDay]);

    const dayIndex = useMemo(
        () => itinerary.findIndex(d => d.id === selectedDayId),
        [itinerary, selectedDayId]
    );

    const yearRange = useMemo(() => {
        if (itinerary.length === 0) return '';
        const firstYear = getTripYear(itinerary[0].date);
        const lastYear = getTripYear(itinerary[itinerary.length - 1].date);
        return firstYear === lastYear ? `${firstYear}` : `${firstYear}-${lastYear}`;
    }, [itinerary]);

    // Fetch data callback - stable reference
    const fetchData = useCallback(async (showLoading = true) => {
        try {
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
            setItinerary(prev => {
                if (!prev || prev.length === 0) {
                    // Dynamic import to avoid circular dependency
                    import('../data/initialData').then(module => {
                        setItinerary(module.initialItinerary);
                        setSelectedDayId(module.initialItinerary[0].id);
                    });
                    return prev;
                }
                return prev;
            });
            setError(`Load error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on auth
    useEffect(() => {
        if (auth) {
            fetchData();
        }
    }, [auth, fetchData]);

    // Save to session storage
    useEffect(() => {
        if (itinerary.length > 0) {
            sessionStorage.setItem('trip_data_v7', JSON.stringify(itinerary));
        }
    }, [itinerary]);

    // Event handlers with structuredClone for deep copy
    const handleSaveEvent = useCallback(async (newItem) => {
        // Deep copy for rollback - use structuredClone instead of shallow copy
        const previousItinerary = structuredClone(itinerary);

        const isMoving = newItem.newDate && newItem.newDate !== newItem.originalDate;
        const isEdit = editItem?.id && itinerary.some(day => day.events.some(e => e.id === editItem.id));

        // Determine targetDay BEFORE state update
        const targetDay = isMoving
            ? itinerary.find(d => d.date === newItem.newDate)
            : itinerary.find(d => d.id === selectedDayId);

        if (!targetDay?.date) {
            console.error('targetDay not found', { isMoving, newDate: newItem.newDate, selectedDayId });
            showToast('error', '対象の日程が見つかりません');
            return;
        }

        // Cache targetDay.date for use in async operations (prevents stale reference issues)
        const targetDayDate = targetDay.date;

        // Optimistic UI update
        if (isMoving) {
            setItinerary(prev => prev.map(day => {
                if (day.date === newItem.originalDate) {
                    return { ...day, events: day.events.filter(e => e.id !== newItem.id) };
                }
                if (day.date === newItem.newDate) {
                    const cleanItem = { ...newItem };
                    delete cleanItem.newDate;
                    delete cleanItem.originalDate;
                    return { ...day, events: [...day.events, cleanItem] };
                }
                return day;
            }));
        } else {
            setItinerary(prev => prev.map(day => {
                if (day.id === selectedDayId) {
                    const newEvents = isEdit
                        ? day.events.map(e => e.id === newItem.id ? newItem : e)
                        : [...day.events, { ...newItem, id: generateId(), type: getCategoryType(newItem.category) }];
                    return { ...day, events: newEvents };
                }
                return day;
            }));
        }

        setModalOpen(false);
        setEditItem(null);

        // Background save
        try {
            setSaving(true);

            if (isMoving) {
                const originalDay = previousItinerary.find(d => d.date === newItem.originalDate);
                const originalEvent = originalDay?.events.find(e => e.id === newItem.id);
                const originalEventName = originalEvent?.name || newItem.name;

                await server.moveEvent({
                    originalDate: newItem.originalDate,
                    eventId: originalEventName,
                    newDate: newItem.newDate,
                    newStartTime: newItem.time,
                    newEndTime: newItem.endTime,
                });
            } else if (isEdit) {
                const originalEvent = previousItinerary.find(d => d.id === selectedDayId)?.events.find(e => e.id === newItem.id);
                await server.batchUpdateEvents([{
                    date: targetDayDate,
                    eventId: originalEvent?.name || newItem.name,
                    eventData: newItem,
                }]);
            } else {
                await server.addEvent({ ...newItem, date: targetDayDate });
            }

            // Cache invalidation for location changes
            if (isEdit && editItem) {
                if (editItem.name !== newItem.name) server.invalidateLocationCache(editItem.name);
                if (editItem.to !== newItem.to) server.invalidateLocationCache(editItem.to);
                if (editItem.from !== newItem.from) server.invalidateLocationCache(editItem.from);
            }
        } catch (err) {
            console.error('Save error:', err);
            setItinerary(previousItinerary);
            showToast('error', '保存に失敗しました。変更を元に戻しました。');
        } finally {
            setSaving(false);
        }
    }, [itinerary, editItem, selectedDayId, showToast]);

    const handleDeleteEvent = useCallback(async (id) => {
        if (!window.confirm("この予定を削除しますか？")) return;
        if (!window.confirm("本当に削除しますか？\nこの操作は取り消せません。")) return;

        const previousItinerary = structuredClone(itinerary);

        let eventToDelete, dayDate;
        for (const day of itinerary) {
            const event = day.events.find(e => e.id === id);
            if (event) {
                eventToDelete = event;
                dayDate = day.date;
                break;
            }
        }

        setItinerary(prev => prev.map(day => ({ ...day, events: day.events.filter(e => e.id !== id) })));
        setModalOpen(false);
        setEditItem(null);

        if (eventToDelete && dayDate) {
            try {
                setSaving(true);
                await server.deleteEvent(dayDate, eventToDelete.name);
            } catch (err) {
                console.error('Delete error:', err);
                setItinerary(previousItinerary);
                showToast('error', '削除に失敗しました。変更を元に戻しました。');
            } finally {
                setSaving(false);
            }
        }
    }, [itinerary, showToast]);

    const handleDeleteDay = useCallback(async (date, dayIdx) => {
        if (!window.confirm(`Day ${dayIdx + 1} (${date}) のすべての予定を削除しますか？`)) return;
        if (!window.confirm(`本当に削除しますか？\n${date}のすべてのイベントが削除されます。\nこの操作は取り消せません。`)) return;

        const previousItinerary = structuredClone(itinerary);

        setItinerary(prev => prev.filter(day => day.date !== date));

        const remainingDays = itinerary.filter(day => day.date !== date);
        if (remainingDays.length > 0) {
            setSelectedDayId(remainingDays[0].id);
        }

        try {
            setSaving(true);
            await server.deleteEventsByDate(date);
        } catch (err) {
            console.error('Delete day error:', err);
            setItinerary(previousItinerary);
            showToast('error', '日程の削除に失敗しました。変更を元に戻しました。');
        } finally {
            setSaving(false);
        }
    }, [itinerary, showToast]);

    const addNewDay = useCallback(async () => {
        if (itinerary.length === 0) return;

        const lastDay = itinerary[itinerary.length - 1];
        const lastDate = getTripDate(lastDay.date);
        const newDate = new Date(lastDate);
        newDate.setDate(newDate.getDate() + 1);

        const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = daysOfWeek[newDate.getDay()];
        const dateStr = `${newDate.getMonth() + 1}/${newDate.getDate()}`;

        const placeholderEvent = {
            id: generateId(),
            type: 'activity',
            category: 'sightseeing',
            name: 'New Event',
            time: '09:00',
            endTime: '',
            status: 'planned',
            details: '',
        };

        const newDay = {
            id: generateId(),
            date: dateStr,
            dayOfWeek,
            title: '',
            summary: '',
            theme: 'default',
            events: [placeholderEvent],
        };

        setItinerary(prev => [...prev, newDay]);
        setSelectedDayId(newDay.id);

        try {
            setSaving(true);
            await server.addEvent({ ...placeholderEvent, date: dateStr });
        } catch (err) {
            console.error('Save error:', err);
            showToast('error', '日程の追加に失敗しました。');
        } finally {
            setSaving(false);
        }
    }, [itinerary, showToast]);

    // Memoized callback for edit handler
    const handleEditEvent = useCallback((event) => {
        setEditItem(event);
        setModalOpen(true);
    }, []);

    // Memoized callback for modal close
    const handleModalClose = useCallback(() => {
        setModalOpen(false);
        setEditItem(null);
    }, []);

    // Memoized previous event for EditModal
    const previousEventForModal = useMemo(() => {
        if (!editItem || !selectedDay) return null;
        const idx = sortedEvents.findIndex(e => e.id === editItem.id);
        return idx > 0 ? sortedEvents[idx - 1] : null;
    }, [editItem, selectedDay, sortedEvents]);

    // Memoized available dates for EditModal
    const availableDates = useMemo(
        () => itinerary.map(day => ({ value: day.date, label: `${day.date} (${day.dayOfWeek})` })),
        [itinerary]
    );

    // Login view
    if (!auth) {
        return (
            <LoginView
                onLogin={login}
                validatePasscode={server.validatePasscode}
                yearRange={yearRange || undefined}
            />
        );
    }

    // Saving overlay
    const SavingOverlay = saving ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-xl z-notification flex items-center gap-3 animate-pulse pointer-events-none">
            <div className="w-4 h-4 min-w-4 min-h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="font-bold text-sm">スプレッドシートに保存中...</span>
        </div>
    ) : null;

    // Loading view
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

    return (
        <div className="w-full min-h-[100dvh] bg-gray-100 dark:bg-slate-900 flex overflow-x-clip font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            <ReloadPrompt />
            {SavingOverlay}
            {error && (
                <div className="fixed top-20 left-4 right-4 z-overlay bg-red-100 border border-red-200 text-red-800 text-sm p-4 rounded-xl shadow-lg">
                    ⚠️ {error}
                </div>
            )}

            {/* Sidebar (Desktop/Tablet) - Collapsible */}
            <aside
                className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-fixed transition-all duration-200 ease-out ${
                    isSidebarCollapsed ? 'w-16' : 'w-64'
                }`}
            >
                {/* Header with Toggle */}
                <div className={`flex items-center justify-between border-b border-gray-200 dark:border-slate-800 ${isSidebarCollapsed ? 'p-3' : 'p-4'}`}>
                    <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                            <Plane className="text-white transform -rotate-45" size={16} />
                        </div>
                        <h1 className={`text-xl font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200 ${
                            isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
                        }`}>
                            TripPlanner
                        </h1>
                    </div>
                    {/* Collapse Toggle Button - Top Position (Best Practice) */}
                    {!isSidebarCollapsed && (
                        <button
                            onClick={toggleSidebar}
                            title="サイドバーを折りたたむ"
                            className="p-2 rounded-lg text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-300 transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>

                {/* Expand Button (Collapsed State) */}
                {isSidebarCollapsed && (
                    <div className="px-2 py-2">
                        <button
                            onClick={toggleSidebar}
                            title="サイドバーを展開"
                            className="w-full flex items-center justify-center p-3 rounded-xl text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-300 transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <nav className={`flex-1 space-y-1 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
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
                            title={isSidebarCollapsed ? item.label : undefined}
                            className={`w-full flex items-center rounded-xl transition-all duration-200 font-medium text-sm ${
                                isSidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                            } ${activeTab === item.id
                                ? 'bg-gray-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                                : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className="flex-shrink-0" />
                            <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                                isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                            }`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Edit Mode Button (Timeline only) */}
                {activeTab === 'timeline' && (
                    <div className={`border-t border-gray-200 dark:border-slate-800 ${isSidebarCollapsed ? 'p-2' : 'p-3'}`}>
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            title={isSidebarCollapsed ? (isEditMode ? '編集を保存' : '編集モード') : undefined}
                            className={`w-full flex items-center rounded-xl font-bold text-sm transition-all ${
                                isSidebarCollapsed ? 'justify-center p-3' : 'justify-center gap-2 px-4 py-3'
                            } ${
                                isEditMode
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {isEditMode ? <Save size={18} /> : <Edit3 size={18} />}
                            <span className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${
                                isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
                            }`}>
                                {isEditMode ? '編集を保存' : '編集モード'}
                            </span>
                        </button>
                    </div>
                )}

            </aside>

            {/* Main Content */}
            <div className={`flex-1 min-h-screen pb-24 lg:pb-0 overflow-x-hidden transition-all duration-200 ease-out ${
                isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
            }`}>
                <div className="w-full h-full overflow-x-hidden">

                    {/* Mobile Header */}
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

                    {/* Content Body */}
                    <Suspense fallback={<LoadingSpinner />}>

                        {activeTab === 'timeline' && (
                            <PullToRefresh onRefresh={() => fetchData(false)} disabled={isEditMode}>
                                <div className="pt-0 lg:pt-6 max-w-full mx-auto w-full pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">

                                    {/* Mobile View */}
                                    <div className="lg:hidden">
                                        {/* Large Title */}
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

                                        {/* Day Tabs - z-header (10) to stay below mobile header (z-sticky: 20) */}
                                        <div className={`sticky z-header bg-gray-100/95 dark:bg-slate-900/95 backdrop-blur-sm pt-2 pb-4 px-4 sm:px-6 border-b border-gray-200/50 dark:border-slate-800/50 transition-all duration-300 ${scrollDirection === 'down' && isScrolled ? 'top-[env(safe-area-inset-top)]' : 'top-[calc(var(--header-height)+env(safe-area-inset-top))]'}`}>
                                            <div ref={dayTabContainerRef} className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-slate-700 transition-all duration-300 ease-out overflow-x-auto scrollbar-hide w-full">
                                                {itinerary.map((day, idx) => {
                                                    const isSelected = selectedDayId === day.id;
                                                    return (
                                                        <button
                                                            key={day.id}
                                                            ref={(el) => setDayTabRef(day.id, el)}
                                                            onClick={() => setSelectedDayId(day.id)}
                                                            className={`flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-300 ease-out ${isSelected
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
                                                    );
                                                })}

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

                                        {/* Mobile Events */}
                                        <div className="px-4 sm:px-6 space-y-6 pb-24">
                                            <DynamicSummary
                                                day={selectedDay}
                                                events={sortedEvents}
                                                dayIdx={dayIndex}
                                                previousDayHotel={(() => {
                                                    if (dayIndex <= 0) return null;
                                                    const prevDay = itinerary[dayIndex - 1];
                                                    return prevDay?.events.filter(e => e.category === 'hotel' || e.category === 'stay').pop();
                                                })()}
                                                onEditPlanned={handleEditEvent}
                                                onDeleteDay={handleDeleteDay}
                                                isEditMode={isEditMode}
                                            />

                                            {/* Departure Indicator */}
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
                                                            <EventCard
                                                                event={{ ...event, _routeOrigin: routeOrigin }}
                                                                isExpanded={expandedEventId === event.id}
                                                                onToggle={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                                                                isEditMode={isEditMode}
                                                                onEdit={handleEditEvent}
                                                                onDelete={() => handleDeleteEvent(event.id)}
                                                                routeOrigin={routeOrigin}
                                                            />
                                                            {nextEvent && (() => {
                                                                const skipRoute = event.category === 'flight' || nextEvent.category === 'flight';
                                                                return (
                                                                    <TimeConnector
                                                                        duration={durationToNext}
                                                                        isEditMode={isEditMode}
                                                                        onInsert={() => {
                                                                            const midTime = getMidTime(event.endTime || event.time, nextEvent.time);
                                                                            setEditItem({ type: 'activity', category: 'sightseeing', status: 'planned', time: midTime, name: '' });
                                                                            setModalOpen(true);
                                                                        }}
                                                                        fromLocation={skipRoute ? null : (event.to || event.address || event.name)}
                                                                        toLocation={skipRoute ? null : (nextEvent.type === 'transport' ? nextEvent.from : (nextEvent.to || nextEvent.name))}
                                                                    />
                                                                );
                                                            })()}
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

                                    {/* Desktop View */}
                                    <div className="hidden lg:block overflow-hidden">
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

                                        <div className="sticky top-0 z-sticky-content bg-gray-100/95 dark:bg-slate-900/95 backdrop-blur-sm px-6 py-2">
                                            <DynamicSummary
                                                day={selectedDay || itinerary[0]}
                                                events={(() => {
                                                    const targetDay = selectedDay || itinerary[0];
                                                    if (!targetDay) return [];
                                                    return [...(targetDay.events || [])].sort((a, b) => {
                                                        const t1 = (a.time || '23:59').padStart(5, '0');
                                                        const t2 = (b.time || '23:59').padStart(5, '0');
                                                        return t1.localeCompare(t2);
                                                    });
                                                })()}
                                                dayIdx={selectedDay ? itinerary.findIndex(d => d.id === selectedDay.id) : 0}
                                                previousDayHotel={(() => {
                                                    const targetDayIdx = selectedDay ? itinerary.findIndex(d => d.id === selectedDay.id) : 0;
                                                    if (targetDayIdx <= 0) return null;
                                                    const prevDay = itinerary[targetDayIdx - 1];
                                                    return prevDay?.events.filter(e => e.category === 'hotel' || e.category === 'stay').pop();
                                                })()}
                                                onEditPlanned={handleEditEvent}
                                                onDeleteDay={handleDeleteDay}
                                                isEditMode={isEditMode}
                                            />
                                        </div>

                                        <div className="flex gap-3 lg:gap-4 px-4 lg:px-6 overflow-x-auto pb-6 scrollbar-hide" style={{ height: 'calc(100vh - var(--desktop-header-offset))' }}>
                                            {itinerary.map((day, dayIdx) => {
                                                const daySortedEvents = [...(day.events || [])].sort((a, b) => {
                                                    const t1 = (a.time || '23:59').padStart(5, '0');
                                                    const t2 = (b.time || '23:59').padStart(5, '0');
                                                    return t1.localeCompare(t2);
                                                });

                                                return (
                                                    <div
                                                        key={day.id}
                                                        onClick={() => setSelectedDayId(day.id)}
                                                        className={`flex-none w-[240px] xl:w-[320px] 2xl:w-[380px] bg-white dark:bg-slate-800 rounded-2xl border flex flex-col overflow-hidden shadow-sm cursor-pointer transition-all ${
                                                            selectedDayId === day.id
                                                                ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900/50'
                                                                : 'border-gray-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                                                        }`}
                                                    >
                                                        <div className={`px-4 py-3 border-b shrink-0 ${
                                                            selectedDayId === day.id
                                                                ? 'border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-900/20'
                                                                : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80'
                                                        }`}>
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

                                                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                                            {daySortedEvents.map((event, index) => {
                                                                const prevEvent = index > 0 ? daySortedEvents[index - 1] : null;
                                                                const routeOrigin = prevEvent
                                                                    ? (prevEvent.to || prevEvent.address || prevEvent.name)
                                                                    : null;
                                                                return (
                                                                    <EventCard
                                                                        key={event.id}
                                                                        event={{ ...event, _routeOrigin: routeOrigin }}
                                                                        isExpanded={expandedEventId === event.id}
                                                                        onToggle={() => setExpandedEventId(
                                                                            expandedEventId === event.id ? null : event.id
                                                                        )}
                                                                        isEditMode={isEditMode}
                                                                        onEdit={(e) => {
                                                                            setSelectedDayId(day.id);
                                                                            handleEditEvent(e);
                                                                        }}
                                                                        onDelete={() => handleDeleteEvent(event.id)}
                                                                        routeOrigin={routeOrigin}
                                                                        compact
                                                                    />
                                                                );
                                                            })}

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

                        {activeTab !== 'timeline' && activeTab !== 'settings' && (
                            <PullToRefresh onRefresh={() => fetchData(false)}>
                                <main className="pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-8 pb-32 lg:pb-8 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] overflow-x-hidden">
                                    <div className="max-w-full lg:max-w-7xl 2xl:max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 overflow-x-hidden">
                                        {activeTab === 'tickets' && <TicketList itinerary={itinerary} isScrolled={isScrolled} onEventClick={handleEditEvent} />}
                                        {activeTab === 'budget' && <BudgetView itinerary={itinerary} onForceReload={fetchData} isScrolled={isScrolled} />}
                                        {activeTab === 'packing' && <PackingList isScrolled={isScrolled} />}
                                    </div>
                                </main>
                            </PullToRefresh>
                        )}

                        {activeTab === 'settings' && (
                            <main className="pt-[calc(4rem+env(safe-area-inset-top))] lg:pt-8 pb-32 lg:pb-8 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] overflow-x-hidden">
                                <div className="max-w-full lg:max-w-7xl 2xl:max-w-screen-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 2xl:px-12 overflow-x-hidden">
                                    <SettingsView
                                        itinerary={itinerary}
                                        isDarkMode={isDarkMode}
                                        setIsDarkMode={setIsDarkMode}
                                        lastUpdate={lastUpdate}
                                        onDataRefresh={fetchData}
                                        onLogout={logout}
                                        isScrolled={isScrolled}
                                    />
                                </div>
                            </main>
                        )}
                    </Suspense>

                    {/* Bottom Nav (Mobile) */}
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

                    {activeTab === 'timeline' && (
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`lg:hidden fixed top-4 right-4 z-fixed bg-white dark:bg-slate-800 text-slate-500 dark:text-indigo-400 p-3 rounded-full shadow-lg border border-gray-100 dark:border-slate-700 transition-all duration-300 active:scale-95 ${isEditMode ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''} ${scrollDirection === 'down' ? '-translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}`}
                            aria-label="編集モード切り替え"
                        >
                            {isEditMode ? <Save size={20} className="text-indigo-600" /> : <Edit3 size={20} />}
                        </button>
                    )}

                    <Suspense fallback={null}>
                        {mapModalOpen && mapModalQuery && (
                            <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4">
                                <div className="absolute inset-0 bg-black/50" onClick={() => setMapModalOpen(false)} />
                                <div className="relative w-full sm:max-w-lg h-[75vh] sm:h-[70vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up-spring">
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
                        onClose={handleModalClose}
                        item={editItem}
                        onSave={handleSaveEvent}
                        onDelete={handleDeleteEvent}
                        previousEvent={previousEventForModal}
                        currentDate={selectedDay?.date}
                        availableDates={availableDates}
                    />
                </div>
            </div>
        </div>
    );
}
