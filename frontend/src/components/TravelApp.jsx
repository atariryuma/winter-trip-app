import React, { useState, useEffect } from 'react';
import {
    Plane, Train, Hotel, MapPin, Clock, Utensils, Camera, Mountain,
    CheckCircle, AlertCircle, Bus, Menu, CalendarDays, X, Moon, Sun,
    Share2, Printer, ChevronLeft, ChevronRight, Check, Copy
} from 'lucide-react';

// ============================================================================
// DATA (PRESERVED)
// ============================================================================

const initialItinerary = [
    {
        date: '12/28', dayOfWeek: '日', title: '沖縄から飛騨高山への大移動',
        location: '那覇 → 名古屋 → 高山',
        summary: '日本を縦断する移動日。那覇から名古屋を経て、雪の飛騨高山へ。',
        transports: [
            { type: 'flight', name: 'SKY 552便', departureTime: '10:05', departurePlace: '那覇空港', arrivalTime: '12:00', arrivalPlace: '中部国際空港', status: 'confirmed', details: '座席: 1C, 2F / 予約番号: 1140' },
            { type: 'train', name: '名鉄ミュースカイ', departureTime: '13:17', departurePlace: '中部国際空港', arrivalTime: '13:54', arrivalPlace: '名鉄名古屋', status: 'planned', details: '昼食（駅弁推奨）' },
            { type: 'train', name: '特急ひだ 13号', departureTime: '14:48', departurePlace: '名古屋', arrivalTime: '17:13', arrivalPlace: '高山', status: 'confirmed', details: '7番A-D席 / 予約番号: 49798' },
        ],
        activities: [
            { title: '高山到着・夕食', time: '17:30', description: 'ホテルチェックイン後、飛騨牛ディナーへ', icon: <Utensils size={18} />, status: 'planned' },
        ],
        stay: { name: '力車イン', checkIn: '15:00-18:00', status: 'confirmed', bookingRef: '6321591551', details: '和室 ファミリールーム 101 BAMBOO' },
    },
    {
        date: '12/29', dayOfWeek: '月', title: '世界遺産・白川郷の雪景色',
        location: '高山 ⇔ 白川郷',
        summary: '白銀の世界遺産、白川郷へ。合掌造りの集落と雪景色を堪能。',
        transports: [
            { type: 'bus', name: '濃飛バス（往路）', departureTime: '08:50', departurePlace: '高山BC', arrivalTime: '09:40', arrivalPlace: '白川郷', status: 'suggested', details: '※要Web予約確認' },
            { type: 'bus', name: '濃飛バス（復路）', departureTime: '13:15', departurePlace: '白川郷', arrivalTime: '14:05', arrivalPlace: '高山', status: 'suggested', details: '' },
        ],
        activities: [
            { title: '宿移動', time: '08:30', description: '力車インをチェックアウト、荷物を次のホテルへ', icon: <Hotel size={18} />, status: 'planned' },
            { title: '白川郷 散策', time: '10:00', description: '展望台からの景色、合掌造り民家園', icon: <Camera size={18} />, status: 'planned' },
            { title: '古い町並み散策', time: '15:00', description: 'さんまち通りで食べ歩き・お土産', icon: <MapPin size={18} />, status: 'planned' },
        ],
        stay: { name: 'ホテル ウッド 高山', checkIn: '15:00', status: 'confirmed', bookingRef: '5444724807', details: 'ツインルーム 2部屋' },
    },
    {
        date: '12/30', dayOfWeek: '火', title: '北アルプスの絶景と下呂温泉',
        location: '高山 → 新穂高 → 下呂',
        summary: '新穂高ロープウェイで雲上の絶景へ。下呂温泉で旅の疲れを癒す。',
        transports: [
            { type: 'bus', name: '濃飛バス', departureTime: '08:40', departurePlace: '高山BC', arrivalTime: '10:16', arrivalPlace: '新穂高RW', status: 'suggested', details: '' },
            { type: 'other', name: '新穂高ロープウェイ', departureTime: '10:30', departurePlace: '山麓', arrivalTime: '12:00', arrivalPlace: '山頂', status: 'suggested', details: '標高2,156m' },
            { type: 'bus', name: '濃飛バス', departureTime: '12:55', departurePlace: '新穂高RW', arrivalTime: '14:31', arrivalPlace: '高山BC', status: 'suggested', details: '' },
            { type: 'train', name: '特急ひだ 14号', departureTime: '15:34', departurePlace: '高山', arrivalTime: '16:17', arrivalPlace: '下呂', status: 'suggested', details: '' },
        ],
        activities: [
            { title: '宮川朝市', time: '07:30', description: '出発前に朝市を覗く', icon: <Utensils size={18} />, status: 'suggested' },
        ],
        stay: { name: '温泉宿廣司', checkIn: '17:00', status: 'confirmed', bookingRef: '6178769046', details: '飛騨牛朴葉味噌定食 / 和室' },
    },
    {
        date: '12/31', dayOfWeek: '水', title: '日本三名泉と名古屋の年越し',
        location: '下呂 → 名古屋',
        summary: '温泉街を散策後、名古屋へ。大晦日の夜を楽しむ。',
        transports: [
            { type: 'train', name: '特急ひだ 8号', departureTime: '12:22', departurePlace: '下呂', arrivalTime: '14:02', arrivalPlace: '名古屋', status: 'planned', details: '指定席推奨' },
        ],
        activities: [
            { title: '下呂温泉街 散策', time: '10:00', description: '下呂プリン、足湯めぐり', icon: <MapPin size={18} />, status: 'planned' },
            { title: '名古屋城', time: '15:30', description: '※年末休園の可能性あり', icon: <Camera size={18} />, status: 'planned' },
            { title: '年越しそば', time: '19:00', description: '名古屋駅周辺で夕食', icon: <Utensils size={18} />, status: 'planned' },
        ],
        stay: { name: 'ホテルリブマックス名古屋', checkIn: '15:00', status: 'confirmed', bookingRef: '5704883964', details: 'ファミリールーム' },
    },
    {
        date: '1/1', dayOfWeek: '木', title: '初詣と帰路',
        location: '名古屋 → 那覇',
        summary: '熱田神宮で初詣。名古屋めしを堪能し、沖縄へ帰還。',
        transports: [
            { type: 'train', name: '名鉄ミュースカイ', departureTime: '15:00', departurePlace: '名鉄名古屋', arrivalTime: '15:30', arrivalPlace: '中部空港', status: 'planned', details: '' },
            { type: 'flight', name: 'SKY 557便', departureTime: '16:50', departurePlace: '中部', arrivalTime: '19:20', arrivalPlace: '那覇', status: 'confirmed', details: '座席: 2F / 予約番号: 0753' },
        ],
        activities: [
            { title: '熱田神宮 初詣', time: '09:00', description: '三種の神器を祀る神社', icon: <MapPin size={18} />, status: 'planned' },
            { title: '名古屋めしランチ', time: '12:00', description: 'ひつまぶし or 味噌カツ', icon: <Utensils size={18} />, status: 'planned' },
        ],
        stay: undefined,
    },
];

// ============================================================================
// UTILITIES
// ============================================================================

function getTimelineEvents(day) {
    const events = [];
    day.transports.forEach(t => events.push({ type: 'transport', time: t.departureTime, data: t }));
    day.activities.forEach(a => events.push({ type: 'activity', time: a.time, data: a }));
    if (day.stay) {
        const timeMatch = day.stay.checkIn.match(/(\d{1,2}:\d{2})/);
        events.push({ type: 'stay', time: timeMatch ? timeMatch[0] : '17:00', data: day.stay });
    }
    return events.sort((a, b) => a.time.localeCompare(b.time));
}

const transportIcons = { flight: Plane, train: Train, bus: Bus, other: Mountain };
const transportColors = { flight: 'text-sky-600', train: 'text-rose-600', bus: 'text-amber-600', other: 'text-slate-600' };

// ============================================================================
// COMPONENTS - Cards (Unified Design)
// ============================================================================

const StatusPill = ({ status }) => {
    if (status === 'confirmed') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">確定</span>;
    if (status === 'suggested') return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">要確認</span>;
    return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">予定</span>;
};

const TransportCard = ({ item }) => {
    const Icon = transportIcons[item.type] || Plane;
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon size={18} className={transportColors[item.type]} />
                    <span className="font-bold text-slate-800 dark:text-white">{item.name}</span>
                </div>
                <StatusPill status={item.status} />
            </div>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                <div className="text-center">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{item.departureTime}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.departurePlace}</div>
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="w-12 border-t-2 border-dashed border-slate-300 dark:border-slate-600 relative">
                        <ChevronRight size={14} className="absolute -right-2 -top-[7px] text-slate-400" />
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{item.arrivalTime}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.arrivalPlace}</div>
                </div>
            </div>
            {item.details && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{item.details}</p>}
        </div>
    );
};

const ActivityCard = ({ item }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            {item.icon || <MapPin size={18} />}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-white truncate">{item.title}</span>
                <span className="text-sm font-bold text-slate-400 shrink-0">{item.time}</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.description}</p>
            {item.status === 'suggested' && <div className="mt-2"><StatusPill status="suggested" /></div>}
        </div>
    </div>
);

const StayCard = ({ item }) => (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                <Hotel size={18} />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">宿泊</span>
            </div>
            <StatusPill status={item.status} />
        </div>
        <h3 className="text-xl font-black mb-3">{item.name}</h3>
        <div className="flex gap-6 text-sm">
            <div>
                <div className="text-[10px] text-indigo-300 uppercase">チェックイン</div>
                <div className="font-bold">{item.checkIn}</div>
            </div>
            <div>
                <div className="text-[10px] text-indigo-300 uppercase">予約番号</div>
                <div className="font-mono">{item.bookingRef}</div>
            </div>
        </div>
        {item.details && <p className="mt-3 pt-3 border-t border-indigo-500/30 text-sm text-indigo-200">{item.details}</p>}
    </div>
);

// ============================================================================
// COMPONENTS - Navigation
// ============================================================================

const DayTabs = ({ days, selectedDay, onSelect }) => (
    <div className="flex gap-1 overflow-x-auto pb-2 px-4 -mx-4 scrollbar-hide">
        {days.map((day, i) => (
            <button
                key={day.date}
                onClick={() => onSelect(day)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedDay.date === day.date
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
            >
                {day.date}
            </button>
        ))}
    </div>
);

const BottomNav = ({ onShare, onPrint, darkMode, onToggleDarkMode }) => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-area-pb">
        <div className="flex justify-around py-3">
            {[
                { icon: CalendarDays, label: '日程', active: true },
                { icon: Share2, label: '共有', onClick: onShare },
                { icon: Printer, label: '印刷', onClick: onPrint },
                { icon: darkMode ? Sun : Moon, label: darkMode ? 'ライト' : 'ダーク', onClick: onToggleDarkMode },
            ].map((item, i) => (
                <button
                    key={i}
                    onClick={item.onClick}
                    className={`flex flex-col items-center gap-1 min-w-[60px] ${item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
                >
                    <item.icon size={24} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}
        </div>
    </nav>
);

// ============================================================================
// COMPONENTS - Dialogs
// ============================================================================

const ShareDialog = ({ isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const url = typeof window !== 'undefined' ? window.location.href : '';

    const copy = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4 dark:text-white">旅程を共有</h3>
                <p className="text-sm text-slate-500 mb-4">このリンクを家族に送信してください。</p>
                <div className="flex gap-2">
                    <input type="text" value={url} readOnly className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm truncate" />
                    <button onClick={copy} className={`px-4 py-2 rounded-lg font-bold text-white ${copied ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// LOGIN
// ============================================================================

const PASSCODE = "2025";

const LoginScreen = ({ onLogin }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        if (input === PASSCODE) onLogin();
        else { setError(true); setInput(''); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-xs bg-white dark:bg-slate-800 rounded-3xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Plane className="text-white -rotate-45" size={28} />
                </div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white mb-1">Winter Trip</h1>
                <p className="text-sm text-slate-400 mb-6">2024-2025 家族旅行</p>
                <form onSubmit={submit}>
                    <input
                        type="password"
                        inputMode="numeric"
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setError(false); }}
                        className="w-full text-center text-2xl font-black tracking-[0.3em] py-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-transparent focus:border-indigo-500 focus:outline-none dark:text-white mb-4"
                        placeholder="••••"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm font-bold mb-4">パスコードが違います</p>}
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-colors">
                        旅を始める
                    </button>
                </form>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN APP
// ============================================================================

export default function TravelApp() {
    const [selectedDay, setSelectedDay] = useState(initialItinerary[0]);
    const [darkMode, setDarkMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
        if (sessionStorage.getItem('trip_auth') === 'true') setIsAuthenticated(true);
    }, []);

    const login = () => { setIsAuthenticated(true); sessionStorage.setItem('trip_auth', 'true'); };
    const toggleDark = () => { setDarkMode(!darkMode); document.documentElement.classList.toggle('dark'); };
    const selectDay = (day) => { setSelectedDay(day); setSidebarOpen(false); };

    if (!isAuthenticated) return <LoginScreen onLogin={login} />;

    const events = getTimelineEvents(selectedDay);
    const dayIndex = initialItinerary.findIndex(d => d.date === selectedDay.date);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
            {/* Sidebar (Desktop) */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl flex items-center justify-center text-white">
                            <Plane size={18} className="-rotate-45" />
                        </div>
                        <div>
                            <h1 className="font-black text-slate-900 dark:text-white">Winter Trip</h1>
                            <p className="text-xs text-slate-400">2024-2025</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-160px)]">
                    {initialItinerary.map((day, i) => (
                        <button
                            key={day.date}
                            onClick={() => selectDay(day)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${selectedDay.date === day.date
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold">{day.date} ({day.dayOfWeek})</span>
                            </div>
                            <p className={`text-xs mt-1 truncate ${selectedDay.date === day.date ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {day.title}
                            </p>
                        </button>
                    ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                    <button onClick={() => setShowShare(true)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300"><Share2 size={16} className="inline mr-1" />共有</button>
                    <button onClick={() => window.print()} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300"><Printer size={16} className="inline mr-1" />印刷</button>
                    <button onClick={toggleDark} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 p-2"><X size={24} className="text-slate-500" /></button>
            </aside>

            {/* Main */}
            <main className="md:ml-64 pb-20 md:pb-8">
                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-1"><Menu size={24} className="text-slate-700 dark:text-white" /></button>
                        <h1 className="font-black text-slate-900 dark:text-white">Winter Trip</h1>
                        <div className="w-8" />
                    </div>
                    <DayTabs days={initialItinerary} selectedDay={selectedDay} onSelect={selectDay} />
                </header>

                {/* Hero */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white px-4 md:px-8 py-8 md:py-12">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-2 text-indigo-200 text-sm font-bold mb-2">
                            <MapPin size={14} />
                            <span>{selectedDay.location}</span>
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black mb-2">{selectedDay.title}</h2>
                        <div className="flex items-center gap-3 text-indigo-200 text-sm">
                            <span className="bg-white/20 px-3 py-1 rounded-full">Day {dayIndex + 1} / {initialItinerary.length}</span>
                            <span>{selectedDay.date} ({selectedDay.dayOfWeek})</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-4">
                    {/* Summary */}
                    {selectedDay.summary && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 flex gap-3">
                            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 dark:text-amber-200">{selectedDay.summary}</p>
                        </div>
                    )}

                    {/* Timeline */}
                    {events.map((event, i) => (
                        <div key={i}>
                            {event.type === 'transport' && <TransportCard item={event.data} />}
                            {event.type === 'activity' && <ActivityCard item={event.data} />}
                            {event.type === 'stay' && <StayCard item={event.data} />}
                        </div>
                    ))}

                    {/* End */}
                    <div className="text-center pt-8">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-bold text-slate-400">
                            <CheckCircle size={16} /> Day {dayIndex + 1} Complete
                        </span>
                    </div>
                </div>
            </main>

            <BottomNav onShare={() => setShowShare(true)} onPrint={() => window.print()} darkMode={darkMode} onToggleDarkMode={toggleDark} />
            <ShareDialog isOpen={showShare} onClose={() => setShowShare(false)} />

            <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }
        @media print { .md\\:hidden, nav { display: none !important; } }
      `}</style>
        </div>
    );
}
