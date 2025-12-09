import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import {
    Calendar, MapPin, Settings, Plus, Ticket, Plane, Edit2, ArrowRight, Copy
} from 'lucide-react';
import { initialItinerary } from '../data/initialData';
import { generateId, toMinutes, toTimeStr, getMidTime } from '../utils';
import { getIcon, getWeatherIcon } from './common/IconHelper';
import StatusBadge from './common/StatusBadge';
import LoadingSpinner from './common/LoadingSpinner';
import PortraitLock from './common/PortraitLock';
import ReloadPrompt from './common/ReloadPrompt';
import EditModal from './EditModal';

// Lazy load view components
const TicketList = lazy(() => import('./views/TicketList'));
const MapView = lazy(() => import('./views/MapView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const PackingList = lazy(() => import('./views/PackingList'));
const EmergencyContacts = lazy(() => import('./views/EmergencyContacts'));
import LoginView from './views/LoginView';

// ============================================================================
// SERVER ADAPTER
// ============================================================================
const server = {
    getData: () => new Promise((resolve, reject) => {
        if (typeof google === 'object' && google.script && google.script.run) {
            console.log('Using google.script.run');
            google.script.run
                .withSuccessHandler(resolve)
                .withFailureHandler((error) => {
                    console.error('GAS Server Error:', error);
                    reject(new Error('GAS Error: ' + (error.message || error)));
                })
                .getItineraryData();
        } else {
            console.log('Using local fetch fallback');
            // Production URL (Stable v33)
            const API_URL = 'https://script.google.com/macros/s/AKfycbyg-jI_lRSXsDeejEVdhPlT5W1gj3mYUkJwqDSXoFXyQThjnLVsBj4odCGYb7wqbX7vSA/exec';

            // Use simple GET request which mimics browser navigation to follow 302 redirects
            // Note: If GAS script permissions are set to ANYONE, this works.
            fetch(`${API_URL}?action=getData`, {
                method: 'GET',
                redirect: 'follow'
            })
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                    return res.json();
                })
                .then(resolve)
                .catch(e => reject(new Error('Fetch Error: ' + e.message)));
        }
    }),
    saveData: (data) => new Promise((resolve, reject) => {
        if (typeof google === 'object' && google.script && google.script.run) {
            google.script.run
                .withSuccessHandler(resolve)
                .withFailureHandler(reject)
                .saveItineraryData(data); // Call backend directly
        } else {
            // Production URL (Stable v33)
            const API_URL = 'https://script.google.com/macros/s/AKfycbyg-jI_lRSXsDeejEVdhPlT5W1gj3mYUkJwqDSXoFXyQThjnLVsBj4odCGYb7wqbX7vSA/exec';

            // Use URLSearchParams to send data as 'application/x-www-form-urlencoded'
            // This ensures GAS receives it in e.parameter.data, which is more reliable than raw body in no-cors.
            const params = new URLSearchParams();
            params.append('data', JSON.stringify(data));

            fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: params
            })
                .then(() => resolve({ status: 'success' }))
                .catch(reject);
        }
    }),
    validatePasscode: (code) => new Promise((resolve) => {
        const API_URL = 'https://script.google.com/macros/s/AKfycbyg-jI_lRSXsDeejEVdhPlT5W1gj3mYUkJwqDSXoFXyQThjnLVsBj4odCGYb7wqbX7vSA/exec';
        fetch(`${API_URL}?action=validatePasscode&code=${encodeURIComponent(code)}`, { method: 'GET' })
            .then(res => res.json())
            .then(data => resolve(data.valid === true))
            .catch(() => resolve(code === '2025')); // Fallback to default if API fails
    })
};

export default function TravelApp() {
    const [itinerary, setItinerary] = useState([]);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [activeTab, setActiveTab] = useState('timeline');
    const [mapUrl, setMapUrl] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [auth, setAuth] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    // const [sidebarOpen, setSidebarOpen] = useState(false); // Unused
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const [lastUpdate, setLastUpdate] = useState(() => localStorage.getItem('lastUpdate') || null);
    const longPressTimer = useRef(null);

    // Long-press handlers
    const handleTouchStart = (eventData) => {
        longPressTimer.current = setTimeout(() => {
            setEditItem(eventData);
            setModalOpen(true);
            navigator.vibrate?.(50); // Haptic feedback if supported
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

    // Calculate year range from itinerary dates
    const yearRange = useMemo(() => {
        if (itinerary.length === 0) return '';
        const parseDate = (dateStr) => {
            // Format: "12/28" or "1/1"
            const [month, day] = dateStr.split('/').map(Number);
            // Assume year based on month: 12 = current year end, 1 = next year start
            const baseYear = new Date().getFullYear();
            return month >= 10 ? baseYear : baseYear + 1;
        };
        const firstYear = parseDate(itinerary[0].date);
        const lastYear = parseDate(itinerary[itinerary.length - 1].date);
        return firstYear === lastYear ? `${firstYear}` : `${firstYear}-${lastYear}`;
    }, [itinerary]);

    // Auth check
    useEffect(() => {
        if (sessionStorage.getItem('trip_auth') === 'true') setAuth(true);
    }, []);

    // Dark mode persistence and class toggle
    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode);
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Fetch data from Spreadsheet via GAS API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await server.getData();
                // Handle new API structure { days, mapUrl } or fallback to array
                let daysData = [];
                if (Array.isArray(data)) {
                    daysData = data;
                } else if (data && data.days) {
                    daysData = data.days;
                    if (data.mapUrl) setMapUrl(data.mapUrl);
                }

                if (daysData && daysData.length > 0) {
                    setItinerary(daysData);
                    setSelectedDayId(daysData[0].id);
                    setError(null);
                    // Update lastUpdate from API
                    if (data.lastUpdate) {
                        setLastUpdate(data.lastUpdate);
                        localStorage.setItem('lastUpdate', data.lastUpdate);
                    }
                } else {
                    throw new Error('No data');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                // Fallback to hardcoded data
                setItinerary(initialItinerary);
                setSelectedDayId(initialItinerary[0].id);
                // Show detailed error
                setError(`読込エラー: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        if (auth) fetchData();
    }, [auth]);

    // Save to session (local edits)
    useEffect(() => {
        if (itinerary.length > 0) {
            sessionStorage.setItem('trip_data_v7', JSON.stringify(itinerary));
        }
    }, [itinerary]);

    const handleCopy = (text) => { navigator.clipboard.writeText(text); alert(`コピーしました: ${text}`); };

    // Save entire itinerary to Spreadsheet
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
                        : [...day.events, { ...newItem, id: generateId(), type: newItem.category === 'hotel' ? 'stay' : (newItem.category === 'flight' || newItem.category === 'train' || newItem.category === 'bus' ? 'transport' : 'activity') }];
                    return { ...day, events: newEvents };
                }
                return day;
            });
            return updatedItinerary;
        });
        setModalOpen(false);
        setEditItem(null);

        // Trigger save
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

        // Trigger save
        if (updatedItinerary) saveToSpreadsheet(updatedItinerary);
    };

    // Login
    // Login
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

    // Creating Saving Overlay
    const SavingOverlay = saving ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full shadow-xl z-[100] flex items-center gap-3 animate-pulse">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="font-bold text-sm">スプレッドシートに保存中...</span>
        </div>
    ) : null;

    // Loading
    if (loading) {
        return (
            <div className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center z-[9999]">
                <div className="text-center text-white">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="font-bold tracking-widest text-sm uppercase opacity-80">Loading...</p>
                </div>
            </div>
        );
    }

    // Error banner (optional - show above main content)
    const ErrorBanner = error ? (
        <div className="bg-yellow-100 border-b border-yellow-200 text-yellow-800 text-sm p-3 text-center">
            ⚠️ {error}
        </div>
    ) : null;

    return (
        <div className="min-h-[100dvh] bg-[#F0F2F5] dark:bg-slate-900 flex">
            <PortraitLock />
            <ReloadPrompt />
            {SavingOverlay}
            {ErrorBanner}

            {/* ========== DESKTOP SIDEBAR (lg+) ========== */}
            <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 min-h-[100dvh] fixed left-0 top-0 z-40">
                <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Plane size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Winter Journey</h1>
                            <p className="text-xs opacity-80">{yearRange}</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {[
                        { id: 'timeline', icon: Calendar, label: '旅程' },
                        { id: 'tickets', icon: Ticket, label: 'チケット' },
                        { id: 'map', icon: MapPin, label: 'マップ' },
                        { id: 'settings', icon: Settings, label: '設定' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isEditMode ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                    >
                        <Edit2 size={20} />
                        <span>{isEditMode ? '編集モード ON' : '編集モード'}</span>
                    </button>
                </div>
            </aside>

            {/* ========== MAIN CONTENT AREA ========== */}
            <div className="w-full lg:ml-64 min-h-[100dvh] flex flex-col">

                {/* ========== HEADER (Mobile/Tablet) ========== */}
                <div className="lg:hidden bg-gradient-to-br from-blue-600 to-indigo-800 p-6 text-white pt-10 pb-16 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Plane size={140} className="transform rotate-[-10deg] translate-x-4 translate-y-4" />
                    </div>
                    <div className="relative z-10 max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">{yearRange}</span>
                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className={`p-2 rounded-full transition-colors ${isEditMode ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>
                        <h1 className="text-2xl font-bold mb-1 tracking-tight">Winter Journey</h1>
                        <p className="opacity-90 text-sm font-medium">Okinawa <span className="opacity-60 mx-1">✈</span> Takayama</p>
                    </div>
                </div>

                {/* ========== DESKTOP HEADER ========== */}
                <div className="hidden lg:block bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-8 py-6">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                                {activeTab === 'timeline' && '旅程'}
                                {activeTab === 'tickets' && 'チケット一覧'}
                                {activeTab === 'map' && 'マップ'}
                                {activeTab === 'settings' && '設定'}
                                {activeTab === 'packing' && 'パッキングリスト'}
                                {activeTab === 'emergency' && '緊急連絡先'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">沖縄 → 飛騨高山・下呂温泉・名古屋</p>
                        </div>
                        {activeTab === 'timeline' && selectedDay && (
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-700 px-4 py-2 rounded-xl">
                                {getWeatherIcon(selectedDay.weather?.condition, { size: 24 })}
                                <span className="text-lg font-bold text-gray-700 dark:text-slate-200">{selectedDay.weather?.temp}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ========== DATE TABS (Only for Timeline) ========== */}
                {activeTab === 'timeline' && (
                    <div className="px-4 lg:px-8 -mt-6 lg:mt-0 relative z-20 mb-2 lg:mb-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex flex-wrap gap-2 lg:gap-3 pb-2 pt-1 lg:pt-4">
                                {itinerary.map(day => (
                                    <button
                                        key={day.id}
                                        onClick={() => setSelectedDayId(day.id)}
                                        className={`flex-shrink-0 snap-center flex flex-col items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl shadow-sm transition-all duration-300 border border-gray-100/50 dark:border-slate-600 ${selectedDayId === day.id
                                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30 shadow-md"
                                            : "bg-white/90 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md"
                                            }`}
                                    >
                                        <span className="text-[10px] lg:text-xs font-bold uppercase tracking-wider">{day.dayOfWeek}</span>
                                        <span className="text-lg lg:text-xl font-black leading-none mt-0.5">{day.date.split('/')[1]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========== MAIN CONTENT ========== */}
                <main className="flex-1 px-4 lg:px-8 pb-24 lg:pb-8 bg-[#F0F2F5] dark:bg-slate-900">
                    <div className="max-w-6xl mx-auto">
                        <Suspense fallback={<LoadingSpinner />}>
                            {/* Content Area */}
                            {activeTab === 'timeline' && selectedDay && (
                                <div className="pt-4 overflow-hidden">

                                    {/* Summary Card */}
                                    <div className="bg-white dark:bg-slate-700 rounded-2xl p-4 shadow-sm mb-4 border border-gray-100 dark:border-slate-600">
                                        <div className="flex justify-between items-start mb-3 gap-4">
                                            <div className="flex-1">
                                                <div className="lg:hidden text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">Day {dayIndex + 1}</div>
                                                <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">{selectedDay.title}</h2>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                    <MapPin size={14} /> {selectedDay.location}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-center pl-4 border-l border-gray-100 dark:border-slate-600">
                                                {getWeatherIcon(selectedDay.weather?.condition)}
                                                <span className="text-sm font-bold text-gray-700 dark:text-slate-200 mt-1">{selectedDay.weather?.temp}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-600 p-3 rounded-xl border border-gray-100 dark:border-slate-500">
                                            {selectedDay.summary}
                                        </p>
                                    </div>

                                    {/* Timeline - Vertical layout with time axis for desktop */}
                                    <div className="relative">
                                        {/* Time axis line (desktop only) */}
                                        <div className="hidden lg:block absolute left-[52px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 dark:from-blue-800 dark:via-blue-700 dark:to-blue-800"></div>

                                        <div className="space-y-4 lg:space-y-0">
                                            {sortedEvents.map((event, index) => {
                                                // Calculate duration to next event
                                                const nextEvent = sortedEvents[index + 1];
                                                let durationMinutes = 0;
                                                if (nextEvent) {
                                                    const currentEnd = event.endTime || event.time;
                                                    durationMinutes = toMinutes(nextEvent.time) - toMinutes(currentEnd);
                                                    if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight
                                                }
                                                const durationHours = Math.floor(durationMinutes / 60);
                                                const durationMins = durationMinutes % 60;

                                                return (
                                                    <div key={event.id} className="relative">
                                                        {/* Insert Between Divider (Only in Edit Mode) */}
                                                        {isEditMode && (
                                                            <div
                                                                className="h-6 -my-3 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group z-10 relative lg:ml-[72px]"
                                                                onClick={() => {
                                                                    const prevTime = index > 0 ? sortedEvents[index - 1].time : null;
                                                                    const nextTime = event.time;
                                                                    const midTime = getMidTime(prevTime, nextTime);
                                                                    setEditItem({ type: 'activity', category: 'sightseeing', status: 'planned', time: midTime, name: '' });
                                                                    setModalOpen(true);
                                                                }}
                                                            >
                                                                <div className="w-full h-0.5 bg-blue-300 transform scale-x-90 group-hover:scale-x-100 transition-transform"></div>
                                                                <div className="absolute bg-blue-500 text-white rounded-full p-1 shadow-sm transform scale-0 group-hover:scale-100 transition-transform">
                                                                    <Plus size={14} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Event Row */}
                                                        <div className="flex lg:items-start gap-4">
                                                            {/* Time Column (desktop) */}
                                                            <div className="hidden lg:flex flex-col items-center w-[72px] shrink-0 pt-5">
                                                                <span className="text-sm font-bold text-gray-700 dark:text-slate-200 font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                                                                    {event.time}
                                                                </span>
                                                                {/* Timeline dot */}
                                                                <div className={`w-4 h-4 rounded-full border-4 mt-2 ${event.type === 'stay' ? 'bg-indigo-500 border-indigo-200 dark:border-indigo-800' :
                                                                    event.category === 'flight' ? 'bg-blue-500 border-blue-200 dark:border-blue-800' :
                                                                        event.type === 'transport' ? 'bg-green-500 border-green-200 dark:border-green-800' :
                                                                            'bg-gray-400 border-gray-200 dark:border-gray-700'
                                                                    }`}></div>
                                                            </div>

                                                            {/* Event Card */}
                                                            <div
                                                                onClick={isEditMode ? () => { setEditItem(event); setModalOpen(true); } : undefined}
                                                                onTouchStart={() => handleTouchStart(event)}
                                                                onTouchEnd={handleTouchEnd}
                                                                onTouchMove={handleTouchEnd}
                                                                className={`flex-1 rounded-2xl p-5 shadow-sm border transition relative overflow-hidden ${event.type === 'stay' ? 'bg-indigo-50/50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800' : 'bg-white dark:bg-slate-700 border-gray-100 dark:border-slate-600'} ${isEditMode ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`}
                                                            >
                                                                {/* Icon Background Decoration */}
                                                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                                                    {getIcon(event.category, event.type)}
                                                                </div>

                                                                <div className="flex justify-between items-start mb-2 flex-wrap gap-2 relative z-10">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${event.type === 'stay' ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300' : (event.category === 'flight' ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' : 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300')}`}>
                                                                            {getIcon(event.category, event.type)}
                                                                        </div>
                                                                        <div className="flex items-baseline gap-2">
                                                                            {/* Mobile: show time here */}
                                                                            <span className="lg:hidden text-lg font-bold text-gray-800 dark:text-slate-100 font-mono">{event.time}</span>
                                                                            {event.endTime && (
                                                                                <>
                                                                                    <ArrowRight size={12} className="text-gray-400 dark:text-slate-500" />
                                                                                    <span className="text-sm text-gray-500 dark:text-slate-400 font-mono">{event.endTime}</span>
                                                                                </>
                                                                            )}
                                                                            {/* Desktop: show end time if exists */}
                                                                            {event.endTime && (
                                                                                <span className="hidden lg:inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                                                                                    <span className="font-mono">→ {event.endTime}</span>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <StatusBadge status={event.status} />
                                                                </div>

                                                                <h3 className="font-bold text-gray-800 dark:text-slate-100 text-lg mb-1 mt-1">{event.name}</h3>

                                                                {event.type === 'transport' && event.place && event.to && (
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 mb-2 flex-wrap">
                                                                        <span>{event.place}</span>
                                                                        <ArrowRight size={14} />
                                                                        <span>{event.to}</span>
                                                                    </div>
                                                                )}

                                                                {(event.description || event.details) && (
                                                                    <div className="mt-2 text-sm text-gray-600 dark:text-slate-300 space-y-1">
                                                                        {event.description && <p>{event.description}</p>}
                                                                        {event.details && <p>{event.details}</p>}
                                                                    </div>
                                                                )}

                                                                {event.bookingRef && (
                                                                    <div
                                                                        onClick={(e) => { e.stopPropagation(); handleCopy(event.bookingRef); }}
                                                                        className="mt-3 bg-white/80 dark:bg-slate-600 backdrop-blur-sm border border-gray-200 dark:border-slate-500 rounded-lg p-2 flex items-center justify-between cursor-pointer active:bg-gray-100 dark:active:bg-slate-500 group"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Ticket size={14} className="text-blue-500" />
                                                                            <span className="text-xs text-gray-500 dark:text-slate-400">予約番号:</span>
                                                                            <span className="font-mono font-bold text-gray-700 dark:text-slate-200">{event.bookingRef}</span>
                                                                        </div>
                                                                        <Copy size={14} className="text-gray-400 dark:text-slate-500 group-hover:text-blue-500" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Duration Indicator (between events, desktop only) */}
                                                        {nextEvent && durationMinutes > 0 && (
                                                            <div className="hidden lg:flex items-center ml-[72px] py-3">
                                                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                                                                    <span className="opacity-70">⏱</span>
                                                                    <span>
                                                                        {durationHours > 0 && `${durationHours}時間`}
                                                                        {durationMins > 0 && `${durationMins}分`}
                                                                        後
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {isEditMode && (
                                                <div className="pt-4 lg:ml-[72px]">
                                                    {/* Final Append Button with Smart Time */}
                                                    <button
                                                        onClick={() => {
                                                            const lastTime = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].time : '09:00';
                                                            const nextTime = toTimeStr(toMinutes(lastTime) + 60);
                                                            setEditItem({ type: 'activity', category: 'sightseeing', status: 'planned', time: nextTime, name: '' });
                                                            setModalOpen(true);
                                                        }}
                                                        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-2xl text-gray-400 dark:text-slate-500 hover:text-blue-500 hover:border-blue-300 transition flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={20} /> 予定を追加
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* NEW: Ticket View */}
                            {activeTab === 'tickets' && <TicketList itinerary={itinerary} />}

                            {/* NEW: Map View */}
                            {activeTab === 'map' && <MapView mapUrl={mapUrl} itinerary={itinerary} />}

                            {/* NEW: Settings View */}
                            {activeTab === 'settings' && <SettingsView itinerary={itinerary} setItinerary={setItinerary} setSelectedDayId={setSelectedDayId} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} lastUpdate={lastUpdate} setActiveTab={setActiveTab} />}

                            {/* NEW: Packing List View */}
                            {activeTab === 'packing' && <PackingList />}

                            {/* NEW: Emergency Contacts View */}
                            {activeTab === 'emergency' && <EmergencyContacts />}
                        </Suspense>
                    </div>
                </main>

                {/* ========== BOTTOM NAV (Mobile only) ========== */}
                <nav role="navigation" aria-label="メインナビゲーション" className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 px-6 py-1 flex justify-around items-center z-30 pb-[calc(0.25rem+env(safe-area-inset-bottom))] print:hidden">
                    <button
                        onClick={() => setActiveTab('timeline')}
                        aria-label="旅程タブ"
                        aria-current={activeTab === 'timeline' ? 'page' : undefined}
                        className={`flex flex-col items-center gap-0.5 p-2 min-w-12 min-h-12 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg ${activeTab === 'timeline' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}
                    >
                        <Calendar size={24} strokeWidth={activeTab === 'timeline' ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">旅程</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('tickets')}
                        aria-label="チケットタブ"
                        aria-current={activeTab === 'tickets' ? 'page' : undefined}
                        className={`flex flex-col items-center gap-0.5 p-2 min-w-12 min-h-12 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg ${activeTab === 'tickets' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}
                    >
                        <Ticket size={24} strokeWidth={activeTab === 'tickets' ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">チケット</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        aria-label="マップタブ"
                        aria-current={activeTab === 'map' ? 'page' : undefined}
                        className={`flex flex-col items-center gap-0.5 p-2 min-w-12 min-h-12 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg ${activeTab === 'map' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}
                    >
                        <MapPin size={24} strokeWidth={activeTab === 'map' ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">マップ</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        aria-label="設定タブ"
                        aria-current={activeTab === 'settings' ? 'page' : undefined}
                        className={`flex flex-col items-center gap-0.5 p-2 min-w-12 min-h-12 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg ${activeTab === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'}`}
                    >
                        <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">設定</span>
                    </button>
                </nav>

            </div>

            {/* Edit Modal */}
            <EditModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditItem(null); }}
                item={editItem}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
            />
        </div>
    );
}
