import React, { useState, useEffect, useMemo } from 'react';
import {
    Plane, Train, Hotel, MapPin, Clock, Utensils, Camera, Mountain,
    CheckCircle, AlertCircle, Bus, Menu, CalendarDays, X, Moon, Sun,
    Share2, Printer, ChevronRight, Check, Copy, Edit2, Trash2, Plus,
    LayoutGrid, List, Settings, Save, RefreshCw, ArrowRight, Star
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

const eventColors = {
    flight: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800', icon: Plane },
    train: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', icon: Train },
    bus: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: Bus },
    hotel: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', icon: Hotel },
    meal: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', icon: Utensils },
    sightseeing: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', icon: Camera },
    default: { bg: 'bg-slate-50 dark:bg-slate-900/50', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800', icon: CheckCircle }
};

// ============================================================================
// COMPONENTS
// ============================================================================

const Card = ({ children, className = "", onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 ${onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-md' : ''} ${className}`}
    >
        {children}
    </div>
);

const Badge = ({ type, text }) => {
    const styles = {
        confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        planned: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        suggested: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${styles[type] || styles.planned}`}>
            {text || type}
        </span>
    );
};

const EditModal = ({ isOpen, onClose, item, onSave, onDelete }) => {
    const [formData, setFormData] = useState({});
    useEffect(() => {
        if (item) setFormData({ ...item });
        else setFormData({ type: 'activity', category: 'sightseeing', status: 'planned', time: '10:00' });
    }, [item, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10 duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 rounded-t-3xl">
                    <h3 className="font-bold text-lg dark:text-white">{item ? 'Edit Event' : 'New Event'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="space-y-4">
                        {/* Type & Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                >
                                    <option value="flight">Flight</option>
                                    <option value="train">Train</option>
                                    <option value="bus">Bus</option>
                                    <option value="hotel">Hotel</option>
                                    <option value="meal">Meal</option>
                                    <option value="sightseeing">Sightseeing</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                >
                                    <option value="planned">Planned</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="suggested">Suggested</option>
                                </select>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Title</label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Event Name"
                            />
                        </div>

                        {/* Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Start Time</label>
                                <input type="time" value={formData.time || ''} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">End Time</label>
                                <input type="time" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white outline-none" />
                            </div>
                        </div>

                        {/* Locations */}
                        {(formData.category === 'flight' || formData.category === 'train' || formData.category === 'bus') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Departure</label>
                                    <input type="text" value={formData.place || ''} onChange={e => setFormData({ ...formData, place: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white outline-none" placeholder="Origin" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Arrival</label>
                                    <input type="text" value={formData.to || ''} onChange={e => setFormData({ ...formData, to: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white outline-none" placeholder="Destination" />
                                </div>
                            </div>
                        )}

                        {/* Details */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Notes</label>
                            <textarea
                                value={formData.description || formData.details || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value, details: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 dark:text-white h-24 resize-none outline-none"
                                placeholder="Additional details..."
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-3xl">
                    {item && onDelete && (
                        <button onClick={() => onDelete(item.id)} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 transition-colors"><Trash2 size={20} /></button>
                    )}
                    <button onClick={() => onSave(formData)} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN APP
// ============================================================================

export default function TravelApp() {
    const [itinerary, setItinerary] = useState(() => {
        // Try to restore from session storage, else use initial
        const saved = sessionStorage.getItem('trip_data_v4');
        return saved ? JSON.parse(saved) : initialItinerary;
    });

    const [selectedDayId, setSelectedDayId] = useState(initialItinerary[0].id);
    const [isEditMode, setIsEditMode] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [auth, setAuth] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // Computed
    const selectedDay = useMemo(() => itinerary.find(d => d.id === selectedDayId), [itinerary, selectedDayId]);
    const dayIndex = useMemo(() => itinerary.findIndex(d => d.id === selectedDayId), [itinerary, selectedDayId]);

    // Effects
    useEffect(() => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
        if (sessionStorage.getItem('trip_auth') === 'true') setAuth(true);
    }, []);

    useEffect(() => {
        sessionStorage.setItem('trip_data_v4', JSON.stringify(itinerary));
    }, [itinerary]);

    const toggleDark = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    // Logic
    const handleSaveEvent = (newItem) => {
        setItinerary(prev => prev.map(day => {
            if (day.id === selectedDayId) {
                let newEvents = editItem
                    ? day.events.map(e => e.id === newItem.id ? newItem : e)
                    : [...day.events, { ...newItem, id: generateId() }];
                return { ...day, events: newEvents.sort((a, b) => a.time.localeCompare(b.time)) };
            }
            return day;
        }));
        setModalOpen(false);
    };

    const handleDeleteEvent = (id) => {
        if (!window.confirm("Are you sure?")) return;
        setItinerary(prev => prev.map(day => {
            if (day.id === selectedDayId) {
                return { ...day, events: day.events.filter(e => e.id !== id) };
            }
            return day;
        }));
        setModalOpen(false);
    };

    if (!auth) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950 p-6">
                <div className="w-full max-w-sm text-center space-y-8">
                    <div className="w-20 h-20 bg-indigo-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/50">
                        <Plane className="text-white -rotate-45" size={40} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Winter Trip</h1>
                        <p className="text-indigo-300 font-medium">Family Vacation 2025</p>
                    </div>
                    <input
                        type="password"
                        placeholder="••••"
                        onChange={e => e.target.value === '2025' && (setAuth(true), sessionStorage.setItem('trip_auth', 'true'))}
                        className="w-full bg-slate-900 border border-slate-800 text-center text-3xl tracking-[12px] py-6 rounded-2xl text-white outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors md:pl-80">

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-50">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            <Plane size={20} className="-rotate-45" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">Winter Trip</h1>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Family Plan</div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">Itinerary</div>
                        {itinerary.map((day, idx) => (
                            <button
                                key={day.id}
                                onClick={() => setSelectedDayId(day.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${selectedDayId === day.id
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/10'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex justify-between items-center relative z-10">
                                    <span className="font-bold text-sm">Day {idx + 1}</span>
                                    <span className="text-xs opacity-60 font-medium">{day.date}</span>
                                </div>
                                <div className="text-xs mt-1 truncate relative z-10 opacity-80">{day.title}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trip Progress</div>
                        <div className="flex gap-1 h-1.5 mb-2">
                            {itinerary.map((_, i) => (
                                <div key={i} className={`flex-1 rounded-full ${i <= dayIndex ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                            ))}
                        </div>
                        <div className="text-xs text-slate-500 text-right">{Math.round(((dayIndex + 1) / itinerary.length) * 100)}% Complete</div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-colors ${isEditMode ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
                        >
                            <Edit2 size={16} /> {isEditMode ? 'Editing' : 'Edit'}
                        </button>
                        <button onClick={toggleDark} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT Area */}
            <main className="max-w-4xl mx-auto p-4 md:p-10 pb-24 md:pb-10">

                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                            <Plane size={16} className="-rotate-45" />
                        </div>
                        <span className="font-black text-lg">Winter Trip</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditMode(!isEditMode)} className={`p-2 rounded-full transition-colors ${isEditMode ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                            <Edit2 size={20} />
                        </button>
                    </div>
                </header>

                {/* Mobile Day Tabs */}
                <div className="md:hidden flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide -mx-4 px-4">
                    {itinerary.map((day, idx) => (
                        <button
                            key={day.id}
                            onClick={() => setSelectedDayId(day.id)}
                            className={`shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border transition-all ${selectedDayId === day.id
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500'
                                }`}
                        >
                            <span className="text-[10px] font-bold uppercase">{day.dayOfWeek}</span>
                            <span className="text-lg font-black">{day.date.split('/')[1]}</span>
                        </button>
                    ))}
                </div>

                {/* Day Header */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Day {dayIndex + 1}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-indigo-500">
                            <MapPin size={12} /> {selectedDay.location}
                        </span>
                        {selectedDay.weather && (
                            <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                {selectedDay.weather.condition === 'Cloudy' ? '☁️' : selectedDay.weather.condition === 'Sunny' ? '☀️' : '❄️'} {selectedDay.weather.temp}
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] mb-4 dark:text-white">
                        {selectedDay.title}
                    </h2>
                    <Card className="p-4 md:p-6 bg-slate-50 border-none dark:bg-slate-900 shadow-none">
                        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {selectedDay.summary}
                        </p>
                    </Card>
                </div>

                {/* Timeline */}
                <div className="space-y-6 relative pl-6 md:pl-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">

                    {/* Line */}
                    <div className="absolute left-[35px] md:left-[108px] top-4 bottom-8 w-px bg-slate-200 dark:bg-slate-800" />

                    {selectedDay.events.map((event) => {
                        const styles = eventColors[event.category] || eventColors.default;
                        const Icon = styles.icon;

                        return (
                            <div key={event.id} className="relative z-10 flex gap-4 md:gap-8 group">

                                {/* Time (Desktop) */}
                                <div className="hidden md:flex w-20 flex-col items-end pt-5 shrink-0">
                                    <span className="font-black text-lg text-slate-900 dark:text-white">{event.time}</span>
                                    <span className="text-xs font-medium text-slate-400">{event.endTime}</span>
                                </div>

                                {/* Icon */}
                                <div className="pt-2 shrink-0">
                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-[3px] border-white dark:border-slate-950 shadow-sm ${styles.bg} ${styles.text}`}>
                                        <Icon size={20} className="md:w-6 md:h-6" />
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div className="flex-1">
                                    <Card
                                        onClick={isEditMode ? () => { setEditItem(event); setModalOpen(true); } : undefined}
                                        className={`p-5 md:p-6 relative overflow-hidden group-hover:border-indigo-200 dark:group-hover:border-indigo-900/50 ${isEditMode ? 'hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 dark:hover:ring-offset-slate-950' : ''}`}
                                    >
                                        {/* Top Row */}
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                                <span className="md:hidden text-xs font-black text-indigo-500">{event.time} {event.endTime && `- ${event.endTime}`}</span>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{event.name}</h3>
                                            </div>
                                            {isEditMode && <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-full"><Edit2 size={12} className="text-slate-400" /></div>}
                                        </div>

                                        {/* Detail Row (Transport) */}
                                        {(event.category === 'flight' || event.category === 'train' || event.category === 'bus') && event.place && event.to && (
                                            <div className="flex items-center gap-3 my-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                                                <div className="flex-1 text-center">
                                                    <div className="text-[10px] uppercase font-bold text-slate-400">Dep</div>
                                                    <div className="font-bold text-sm truncate">{event.place}</div>
                                                </div>
                                                <ArrowRight size={14} className="text-slate-300" />
                                                <div className="flex-1 text-center">
                                                    <div className="text-[10px] uppercase font-bold text-slate-400">Arr</div>
                                                    <div className="font-bold text-sm truncate">{event.to}</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Description */}
                                        {(event.description || event.details) && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                                                {event.description || event.details}
                                            </p>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center gap-2 mt-auto pt-2">
                                            <Badge type={event.status} text={event.status} />
                                            {event.category === 'hotel' && <Badge type="suggested" text="Check-in" />}
                                        </div>

                                    </Card>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Button */}
                    {isEditMode && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => { setEditItem(null); setModalOpen(true); }}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-100 dark:shadow-none dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400">
                                    <Plus size={24} />
                                </div>
                                <span className="text-xs font-bold text-indigo-500">Add Event</span>
                            </button>
                        </div>
                    )}

                    <div className="h-20" /> {/* Spacer */}
                </div>

            </main>

            {/* FAB Mobile */}
            {isEditMode && (
                <button
                    onClick={() => { setEditItem(null); setModalOpen(true); }}
                    className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/40 flex items-center justify-center z-40 active:scale-90 transition-transform"
                >
                    <Plus size={28} />
                </button>
            )}

            {/* Modals */}
            <EditModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                item={editItem}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
            />

        </div>
    );
}
