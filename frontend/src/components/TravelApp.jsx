import React, { useState, useEffect, useMemo } from 'react';
import {
    Plane, Train, Hotel, MapPin, Clock, Utensils, Camera, Mountain,
    CheckCircle, AlertCircle, Bus, Menu, CalendarDays, X, Moon, Sun,
    Share2, Printer, ChevronRight, Check, Copy, Edit2, Trash2, Plus,
    LayoutGrid, List, Settings, Save, RefreshCw
} from 'lucide-react';

// ============================================================================
// INITIAL DATA (PRESERVED)
// ============================================================================

const initialItinerary = [
    {
        id: 'day-1',
        date: '12/28', dayOfWeek: '日', title: '沖縄から飛騨高山への大移動',
        location: '那覇 → 名古屋 → 高山',
        weather: { temp: '8°C', condition: 'Cloudy' },
        summary: '日本を縦断する移動日。那覇から名古屋を経て、雪の飛騨高山へ。',
        events: [
            { id: 'e1-1', type: 'transport', category: 'flight', name: 'SKY 552便', time: '10:05', endTime: '12:00', place: '那覇空港', to: '中部国際空港', status: 'confirmed', details: '座席: 1C, 2F / 予約番号: 1140' },
            { id: 'e1-2', type: 'transport', category: 'train', name: '名鉄ミュースカイ', time: '13:17', endTime: '13:54', place: '中部国際空港', to: '名鉄名古屋', status: 'planned', details: '昼食（駅弁推奨）' },
            { id: 'e1-3', type: 'transport', category: 'train', name: '特急ひだ 13号', time: '14:48', endTime: '17:13', place: '名古屋', to: '高山', status: 'confirmed', details: '7番A-D席 / 予約番号: 49798' },
            { id: 'e1-4', type: 'activity', category: 'meal', name: '高山到着・夕食', time: '17:30', description: 'ホテルチェックイン後、飛騨牛ディナーへ', status: 'planned' },
            { id: 'e1-5', type: 'stay', category: 'hotel', name: '力車イン', time: '15:00', checkIn: '15:00-18:00', status: 'confirmed', bookingRef: '6321591551', details: '和室 ファミリールーム 101 BAMBOO' },
        ]
    },
    {
        id: 'day-2',
        date: '12/29', dayOfWeek: '月', title: '世界遺産・白川郷の雪景色',
        location: '高山 ⇔ 白川郷',
        weather: { temp: '-2°C', condition: 'Snow' },
        summary: '白銀の世界遺産、白川郷へ。合掌造りの集落と雪景色を堪能。',
        events: [
            { id: 'e2-1', type: 'activity', category: 'transfer', name: '宿移動', time: '08:30', description: 'チェックアウト、荷物を次のホテルへ', status: 'planned' },
            { id: 'e2-2', type: 'transport', category: 'bus', name: '濃飛バス（往路）', time: '08:50', endTime: '09:40', place: '高山BC', to: '白川郷', status: 'suggested', details: '要Web予約確認' },
            { id: 'e2-3', type: 'activity', category: 'sightseeing', name: '白川郷 散策', time: '10:00', description: '展望台からの景色、合掌造り民家園', status: 'planned' },
            { id: 'e2-4', type: 'transport', category: 'bus', name: '濃飛バス（復路）', time: '13:15', endTime: '14:05', place: '白川郷', to: '高山', status: 'suggested', details: '' },
            { id: 'e2-5', type: 'activity', category: 'sightseeing', name: '古い町並み散策', time: '15:00', description: 'さんまち通りで食べ歩き・お土産', status: 'planned' },
            { id: 'e2-6', type: 'stay', category: 'hotel', name: 'ホテル ウッド 高山', time: '15:00', checkIn: '15:00', status: 'confirmed', bookingRef: '5444724807', details: 'ツインルーム 2部屋' },
        ]
    },
    {
        id: 'day-3',
        date: '12/30', dayOfWeek: '火', title: '北アルプスの絶景と下呂温泉',
        location: '高山 → 新穂高 → 下呂',
        weather: { temp: '-5°C', condition: 'Clear' },
        summary: '新穂高ロープウェイで雲上の絶景へ。下呂温泉で旅の疲れを癒す。',
        events: [
            { id: 'e3-1', type: 'activity', category: 'sightseeing', name: '宮川朝市', time: '07:30', description: '出発前に朝市を覗く', status: 'suggested' },
            { id: 'e3-2', type: 'transport', category: 'bus', name: '濃飛バス', time: '08:40', endTime: '10:16', place: '高山BC', to: '新穂高RW', status: 'suggested' },
            { id: 'e3-3', type: 'transport', category: 'other', name: '新穂高ロープウェイ', time: '10:30', endTime: '12:00', place: '山麓', to: '山頂', status: 'suggested', details: '標高2,156m' },
            { id: 'e3-4', type: 'transport', category: 'bus', name: '濃飛バス', time: '12:55', endTime: '14:31', place: '新穂高RW', to: '高山BC', status: 'suggested' },
            { id: 'e3-5', type: 'transport', category: 'train', name: '特急ひだ 14号', time: '15:34', endTime: '16:17', place: '高山', to: '下呂', status: 'suggested' },
            { id: 'e3-6', type: 'stay', category: 'hotel', name: '温泉宿廣司', time: '17:00', checkIn: '17:00', status: 'confirmed', bookingRef: '6178769046', details: '飛騨牛朴葉味噌定食' },
        ]
    },
    {
        id: 'day-4',
        date: '12/31', dayOfWeek: '水', title: '日本三名泉と名古屋の年越し',
        location: '下呂 → 名古屋',
        weather: { temp: '5°C', condition: 'Sunny' },
        summary: '温泉街を散策後、名古屋へ。大晦日の夜を楽しむ。',
        events: [
            { id: 'e4-1', type: 'activity', category: 'sightseeing', name: '下呂温泉街 散策', time: '10:00', description: '下呂プリン、足湯めぐり', status: 'planned' },
            { id: 'e4-2', type: 'transport', category: 'train', name: '特急ひだ 8号', time: '12:22', endTime: '14:02', place: '下呂', to: '名古屋', status: 'planned', details: '指定席推奨' },
            { id: 'e4-3', type: 'activity', category: 'sightseeing', name: '名古屋城', time: '15:30', description: '※年末休園の可能性あり', status: 'planned' },
            { id: 'e4-4', type: 'activity', category: 'meal', name: '年越しそば', time: '19:00', description: '名古屋駅周辺で夕食', status: 'planned' },
            { id: 'e4-5', type: 'stay', category: 'hotel', name: 'ホテルリブマックス名古屋', time: '15:00', checkIn: '15:00', status: 'confirmed', bookingRef: '5704883964', details: 'ファミリールーム' },
        ]
    },
    {
        id: 'day-5',
        date: '1/1', dayOfWeek: '木', title: '初詣と帰路',
        location: '名古屋 → 那覇',
        weather: { temp: '7°C', condition: 'Sunny' },
        summary: '熱田神宮で初詣。名古屋めしを堪能し、沖縄へ帰還。',
        events: [
            { id: 'e5-1', type: 'activity', category: 'sightseeing', name: '熱田神宮 初詣', time: '09:00', description: '三種の神器を祀る神社', status: 'planned' },
            { id: 'e5-2', type: 'activity', category: 'meal', name: '名古屋めしランチ', time: '12:00', description: 'ひつまぶし or 味噌カツ', status: 'planned' },
            { id: 'e5-3', type: 'transport', category: 'train', name: '名鉄ミュースカイ', time: '15:00', endTime: '15:30', place: '名鉄名古屋', to: '中部空港', status: 'planned' },
            { id: 'e5-4', type: 'transport', category: 'flight', name: 'SKY 557便', time: '16:50', endTime: '19:20', place: '中部', to: '那覇', status: 'confirmed', details: '座席: 2F / 予約番号: 0753' },
        ]
    },
];

// ============================================================================
// UTILITIES
// ============================================================================

const generateId = () => Math.random().toString(36).substr(2, 9);

const categoryIcons = {
    flight: Plane, train: Train, bus: Bus, other: Mountain,
    hotel: Hotel, meal: Utensils, sightseeing: Camera, transfer: MapPin,
    default: CheckCircle
};

const categoryColors = {
    flight: 'text-sky-600 bg-sky-50 dark:bg-sky-900/20',
    train: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
    bus: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    hotel: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
    sightseeing: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
    default: 'text-slate-600 bg-slate-50 dark:bg-slate-800'
};

// ============================================================================
// COMPONENTS - EDITOR MODAL
// ============================================================================

const EditModal = ({ isOpen, onClose, item, onSave, onDelete }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (item) setFormData({ ...item });
        else setFormData({ type: 'activity', category: 'sightseeing', status: 'planned', time: '10:00' });
    }, [item, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">{item ? '予定を編集' : '新しい予定'}</h3>
                    <button onClick={onClose}><X size={24} className="text-slate-400" /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">種類</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 dark:text-white"
                            >
                                <option value="transport">移動 (Transport)</option>
                                <option value="activity">活動 (Activity)</option>
                                <option value="stay">宿泊 (Stay)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">カテゴリー</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 dark:text-white"
                            >
                                <option value="flight">飛行機</option>
                                <option value="train">電車</option>
                                <option value="bus">バス</option>
                                <option value="sightseeing">観光</option>
                                <option value="meal">食事</option>
                                <option value="hotel">ホテル</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">タイトル</label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 dark:text-white font-bold"
                            placeholder="例: 那覇空港へ移動"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">開始時間</label>
                            <input
                                type="time"
                                value={formData.time || ''}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">終了時間 (任意)</label>
                            <input
                                type="time"
                                value={formData.endTime || ''}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">詳細・メモ</label>
                        <textarea
                            value={formData.details || (formData.description || '')}
                            onChange={e => setFormData({ ...formData, details: e.target.value, description: e.target.value })}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 dark:text-white h-24 text-sm"
                            placeholder="予約番号や注意事項など"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">ステータス:</span>
                        <div className="flex gap-2">
                            {['planned', 'confirmed', 'suggested'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFormData({ ...formData, status: s })}
                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${formData.status === s
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                        }`}
                                >
                                    {s === 'confirmed' ? '確定' : s === 'suggested' ? '提案' : '予定'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                    {item && onDelete && (
                        <button
                            onClick={() => onDelete(item.id)}
                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        onClick={() => onSave(formData)}
                        className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        <Save size={18} /> 保存する
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function TravelApp() {
    // State
    const [itinerary, setItinerary] = useState(initialItinerary);
    const [selectedDayId, setSelectedDayId] = useState(initialItinerary[0].id);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'dashboard'
    const [isEditMode, setIsEditMode] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [auth, setAuth] = useState(false);

    // Editor State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [targetDayId, setTargetDayId] = useState(null);

    // Initialization
    useEffect(() => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
        if (sessionStorage.getItem('trip_auth') === 'true') setAuth(true);
    }, []);

    const toggleDark = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    // CRUD Operations
    const handleSave = (itemData) => {
        setItinerary(prev => prev.map(day => {
            if (day.id === (targetDayId || selectedDayId)) {
                let newEvents;
                if (editingItem) {
                    // Update existing
                    newEvents = day.events.map(e => e.id === itemData.id ? { ...itemData } : e);
                } else {
                    // Add new
                    newEvents = [...day.events, { ...itemData, id: generateId() }];
                }
                // Sort by time
                newEvents.sort((a, b) => a.time.localeCompare(b.time));
                return { ...day, events: newEvents };
            }
            return day;
        }));
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleDelete = (itemId) => {
        if (!window.confirm('本当に削除しますか？')) return;
        setItinerary(prev => prev.map(day => ({
            ...day,
            events: day.events.filter(e => e.id !== itemId)
        })));
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const openAddModal = (dayId) => {
        setTargetDayId(dayId);
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEditModal = (dayId, item) => {
        setTargetDayId(dayId);
        setEditingItem(item);
        setIsModalOpen(true);
    };

    // Login Screen
    if (!auth) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-8 text-center">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Winter Trip</h1>
                    <p className="text-slate-500 mb-6">Enter Passcode</p>
                    <input
                        type="password"
                        autoFocus
                        className="w-full p-4 text-center text-2xl tracking-[0.5em] bg-slate-100 dark:bg-slate-700 rounded-xl mb-4"
                        onChange={e => {
                            if (e.target.value === '2025') {
                                setAuth(true);
                                sessionStorage.setItem('trip_auth', 'true');
                            }
                        }}
                    />
                </div>
            </div>
        );
    }

    // Selected Day Data
    const selectedDay = itinerary.find(d => d.id === selectedDayId);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors pb-24 md:pb-0 md:pl-72">

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50">
                <div className="p-6">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">Winter Trip</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">2024-2025 Family Plan</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-2">
                    <div className="text-xs font-bold text-slate-400 px-2 mb-2">ITINERARY</div>
                    {itinerary.map(day => (
                        <button
                            key={day.id}
                            onClick={() => { setSelectedDayId(day.id); setViewMode('list'); }}
                            className={`w-full text-left p-3 rounded-xl transition-all group ${selectedDayId === day.id && viewMode === 'list'
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold">{day.date}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedDayId === day.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}>{day.dayOfWeek}</span>
                            </div>
                            <div className="text-xs opacity-70 truncate">{day.title}</div>
                        </button>
                    ))}

                    <div className="mt-8 text-xs font-bold text-slate-400 px-2 mb-2">OVERVIEW</div>
                    <button
                        onClick={() => setViewMode('dashboard')}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${viewMode === 'dashboard'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <LayoutGrid size={18} />
                        <span className="font-bold">Dashboard/Stats</span>
                    </button>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <button onClick={() => setIsEditMode(!isEditMode)} className={`flex-1 p-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors ${isEditMode ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        <Edit2 size={14} /> {isEditMode ? '編集モード' : '閲覧モード'}
                    </button>
                    <button onClick={toggleDark} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </aside>

            {/* MOBILE HEADER */}
            <header className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-4 py-3">
                    <h1 className="font-black text-lg dark:text-white">Winter Trip</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`p-2 rounded-full ${isEditMode ? 'bg-amber-100 text-amber-600' : 'text-slate-400'}`}
                        >
                            <Edit2 size={20} />
                        </button>
                    </div>
                </div>
                {/* Horizontal Scroll Days */}
                <div className="flex overflow-x-auto pb-3 px-4 gap-2 scrollbar-none">
                    <button
                        onClick={() => setViewMode('dashboard')}
                        className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'dashboard' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}
                    >
                        <LayoutGrid size={16} />
                    </button>
                    {itinerary.map(day => (
                        <button
                            key={day.id}
                            onClick={() => { setSelectedDayId(day.id); setViewMode('list'); }}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${selectedDayId === day.id && viewMode === 'list'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700'
                                }`}
                        >
                            {day.date} <span className="text-[10px] opacity-70 ml-1">{day.dayOfWeek}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* CONTENT AREA */}
            <main className="max-w-3xl mx-auto p-4 md:p-8">

                {viewMode === 'dashboard' ? (
                    /* DASHBOARD VIEW */
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="text-indigo-200 text-sm font-bold mb-1">TOTAL TRIP</div>
                                    <div className="text-4xl font-black mb-2">5 Days</div>
                                    <div className="flex gap-2 text-sm opacity-80">
                                        <span className="bg-white/20 px-2 py-1 rounded">沖縄</span>
                                        <span className="bg-white/20 px-2 py-1 rounded">愛知</span>
                                        <span className="bg-white/20 px-2 py-1 rounded">岐阜</span>
                                    </div>
                                </div>
                                <div className="absolute right-[-20px] bottom-[-20px] opacity-20">
                                    <Plane size={140} />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="text-slate-400 text-xs font-bold mb-2">EVENTS</div>
                                <div className="text-3xl font-black dark:text-white">
                                    {itinerary.reduce((acc, day) => acc + day.events.length, 0)}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Total Activities</div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="text-slate-400 text-xs font-bold mb-2">STATUS</div>
                                <div className="flex gap-1 mt-1">
                                    <div className="h-2 flex-1 bg-emerald-500 rounded-full" />
                                    <div className="h-2 flex-1 bg-emerald-500 rounded-full" />
                                    <div className="h-2 flex-1 bg-emerald-500 rounded-full" />
                                    <div className="h-2 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                </div>
                                <div className="text-xs text-slate-500 mt-2">60% Completed</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-500 px-2">QUICK ACCESS</h3>
                            {itinerary.map(day => (
                                <div key={day.id} onClick={() => { setSelectedDayId(day.id); setViewMode('list'); }} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:scale-[1.01] transition-transform">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400 font-bold leading-none">
                                        <span className="text-sm">{day.date}</span>
                                        <span className="text-[10px]">{day.dayOfWeek}</span>
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm dark:text-white">{day.title}</div>
                                        <div className="text-xs text-slate-400">{day.location}</div>
                                    </div>
                                    <ChevronRight className="ml-auto text-slate-300" size={18} />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Header Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <MapPin size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded-full text-xs font-bold mb-3">
                                    <CalendarDays size={12} /> Day {itinerary.findIndex(d => d.id === selectedDayId) + 1}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black mb-2 dark:text-white leading-tight">{selectedDay.title}</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg">{selectedDay.summary}</p>

                                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-xs">
                                        <span className="block text-slate-400 font-bold">AREA</span>
                                        <span className="font-bold dark:text-white">{selectedDay.location}</span>
                                    </div>
                                    {selectedDay.weather && (
                                        <div className="text-xs">
                                            <span className="block text-slate-400 font-bold">WEATHER</span>
                                            <span className="font-bold dark:text-white">{selectedDay.weather.temp} {selectedDay.weather.condition}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timeline Events */}
                        <div className="space-y-4 relative pl-4 md:pl-0">
                            {/* Vertical Line */}
                            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-slate-800 md:hidden" />

                            {selectedDay.events.map((event, index) => {
                                const Icon = categoryIcons[event.category] || CheckCircle;
                                const colorClass = categoryColors[event.category] || categoryColors.default;

                                return (
                                    <div key={event.id} className="relative group">
                                        <div className="flex gap-4">
                                            {/* Time Column (Desktop) */}
                                            <div className="hidden md:block w-24 text-right pt-4 shrink-0">
                                                <div className="font-black text-lg dark:text-white">{event.time}</div>
                                                {event.endTime && <div className="text-xs text-slate-400">{event.endTime}</div>}
                                            </div>

                                            {/* Icon Bubble */}
                                            <div className="relative z-10 pt-2 shrink-0">
                                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-sm border-2 border-white dark:border-slate-950 ${colorClass}`}>
                                                    <Icon size={18} />
                                                </div>
                                            </div>

                                            {/* Card */}
                                            <div
                                                onClick={() => isEditMode && openEditModal(selectedDay.id, event)}
                                                className={`flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-all ${isEditMode ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md' : ''
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                                        <span className="md:hidden font-bold text-indigo-600 dark:text-indigo-400 text-xs">{event.time}</span>
                                                        <h4 className="font-bold text-base md:text-lg dark:text-white">{event.name}</h4>
                                                    </div>
                                                    {isEditMode && <Edit2 size={14} className="text-slate-300" />}
                                                </div>

                                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-2">{event.description || ((event.place && event.to) ? `${event.place} ➔ ${event.to}` : event.place)}</p>

                                                {event.details && (
                                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                                                        {event.details}
                                                    </div>
                                                )}

                                                {/* Status Tag */}
                                                <div className="mt-3 flex gap-2">
                                                    {event.status === 'confirmed' && <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full dark:bg-emerald-900/30 dark:text-emerald-300">確定</span>}
                                                    {event.status === 'suggested' && <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full dark:bg-amber-900/30 dark:text-amber-300">提案</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Add Button Gap */}
                                        {isEditMode && (
                                            <div className="flex justify-center py-2 -ml-12 md:ml-0">
                                                <button
                                                    onClick={() => openAddModal(selectedDay.id)}
                                                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Empty State / Add at end */}
                            {selectedDay.events.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <p>予定がありません</p>
                                </div>
                            )}
                            {isEditMode && selectedDay.events.length === 0 && (
                                <button
                                    onClick={() => openAddModal(selectedDay.id)}
                                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} /> 予定を追加
                                </button>
                            )}
                        </div>

                        <div className="h-24" /> {/* Bottom spacer */}
                    </div>
                )}
            </main>

            {/* MOBILE FLOATING ACTION BUTTON */}
            {isEditMode && viewMode === 'list' && (
                <button
                    onClick={() => openAddModal(selectedDayId)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-500/40 flex items-center justify-center z-40 active:scale-95 transition-transform"
                >
                    <Plus size={28} />
                </button>
            )}

            {/* EDITOR MODAL */}
            <EditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={editingItem}
                onSave={handleSave}
                onDelete={handleDelete}
            />

        </div>
    );
}
