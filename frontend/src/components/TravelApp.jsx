import React, { useState, useEffect } from 'react';
import {
    Plane,
    Train,
    Hotel,
    MapPin,
    Clock,
    ChevronDown,
    ChevronRight,
    Utensils,
    Camera,
    Mountain,
    CheckCircle,
    AlertCircle,
    Bus,
    ArrowRight,
    Menu,
    CalendarDays,
    X,
    Moon,
    Sun,
    Wind,
    Droplets,
    Thermometer
} from 'lucide-react';

// --- Data (Preserved) ---
const initialItinerary = [
    {
        date: '12/28',
        dayOfWeek: '日',
        title: '沖縄から飛騨高山への大移動',
        location: '那覇 → 名古屋 → 高山',
        weather: { temp: '8°C', condition: 'Cloudy' },
        summary: '日本を縦断する移動日。那覇から名古屋を経て、雪の飛騨高山へ。移動そのものを楽しむ一日。',
        transports: [
            {
                type: 'flight',
                name: 'SKY 552便',
                departureTime: '10:05',
                departurePlace: '那覇空港',
                arrivalTime: '12:00',
                arrivalPlace: '中部国際空港',
                status: 'confirmed',
                details: '座席: 1C, 2F (フォワードシート) / 予約番号: 1140',
            },
            {
                type: 'train',
                name: '名鉄ミュースカイ',
                departureTime: '13:17',
                departurePlace: '中部国際空港',
                arrivalTime: '13:54',
                arrivalPlace: '名鉄名古屋',
                status: 'planned',
                details: '移動・昼食（駅弁推奨）',
            },
            {
                type: 'train',
                name: '特急ひだ 13号',
                departureTime: '14:48',
                departurePlace: '名古屋',
                arrivalTime: '17:13',
                arrivalPlace: '高山',
                status: 'confirmed',
                details: '1号車(グリーン/禁煙) 7番A-D席 / 予約番号: 49798',
            },
        ],
        activities: [
            {
                title: '高山到着・夕食',
                time: '17:30',
                description: 'ホテルチェックイン後、飛騨牛ディナーへ',
                icon: <Utensils size={18} />,
                status: 'planned',
            },
        ],
        stay: {
            name: '力車イン',
            checkIn: '15:00-18:00',
            status: 'confirmed',
            bookingRef: '予約番号: 6321591551',
            details: '和室 ファミリールーム 101 BAMBOO',
        },
    },
    {
        date: '12/29',
        dayOfWeek: '月',
        title: '世界遺産・白川郷の雪景色',
        location: '高山 ⇔ 白川郷',
        weather: { temp: '-2°C', condition: 'Snow' },
        summary: '白銀の世界遺産、白川郷へ。合掌造りの集落と雪景色を堪能し、高山の古い町並みで食べ歩き。',
        transports: [
            {
                type: 'bus',
                name: '濃飛バス（往路）',
                departureTime: '08:50',
                departurePlace: '高山濃飛バスセンター',
                arrivalTime: '09:40',
                arrivalPlace: '白川郷',
                status: 'suggested',
                details: '※要Web予約確認',
            },
            {
                type: 'bus',
                name: '濃飛バス（復路）',
                departureTime: '13:15',
                departurePlace: '白川郷',
                arrivalTime: '14:05',
                arrivalPlace: '高山',
                status: 'suggested',
                details: '明るいうちに高山へ戻る',
            },
        ],
        activities: [
            {
                title: '宿移動',
                time: '08:30',
                description: '力車インをチェックアウトし、荷物を次のホテルへ預ける',
                icon: <Hotel size={18} />,
                status: 'planned',
            },
            {
                title: '白川郷 散策',
                time: '10:00',
                description: '展望台からの景色、合掌造り民家園など',
                icon: <Camera size={18} />,
                status: 'planned',
            },
            {
                title: '古い町並み散策',
                time: '15:00',
                description: 'さんまち通りで食べ歩き・お土産購入',
                icon: <MapPin size={18} />,
                status: 'planned',
            },
        ],
        stay: {
            name: 'ホテル ウッド 高山',
            checkIn: '15:00',
            status: 'confirmed',
            bookingRef: '予約番号: 5444724807',
            details: 'スタンダード ツインルーム 2部屋',
        },
    },
    {
        date: '12/30',
        dayOfWeek: '火',
        title: '北アルプスの絶景と下呂温泉',
        location: '高山 → 新穂高 → 下呂',
        weather: { temp: '-5°C', condition: 'Clear' },
        summary: '新穂高ロープウェイで雲上の絶景へ。その後、日本三名泉の一つ、下呂温泉で旅の疲れを癒やす。',
        transports: [
            {
                type: 'bus',
                name: '濃飛バス（新穂高線）',
                departureTime: '08:40',
                departurePlace: '高山BC',
                arrivalTime: '10:16',
                arrivalPlace: '新穂高ロープウェイ',
                status: 'suggested',
                details: '2日券などのお得な切符を検討',
            },
            {
                type: 'other',
                name: '新穂高ロープウェイ',
                departureTime: '10:30',
                departurePlace: '山麓',
                arrivalTime: '12:00',
                arrivalPlace: '山頂展望台',
                status: 'suggested',
                details: '標高2,156mの雲上の世界へ',
            },
            {
                type: 'bus',
                name: '濃飛バス（戻り）',
                departureTime: '12:55',
                departurePlace: '新穂高ロープウェイ',
                arrivalTime: '14:31',
                arrivalPlace: '高山BC',
                status: 'suggested',
                details: '',
            },
            {
                type: 'train',
                name: '特急ひだ 14号',
                departureTime: '15:34',
                departurePlace: '高山',
                arrivalTime: '16:17',
                arrivalPlace: '下呂',
                status: 'suggested',
                details: '※当初予定(12:35)より変更してロープウェイ時間を確保',
            },
        ],
        activities: [
            {
                title: '宮川朝市（早朝）',
                time: '07:30',
                description: '出発前に少しだけ朝市を覗く',
                icon: <Utensils size={18} />,
                status: 'suggested',
            },
        ],
        stay: {
            name: '温泉宿廣司',
            checkIn: '17:00予定',
            status: 'confirmed',
            bookingRef: '予約番号: 6178769046',
            details: '飛騨牛朴葉味噌定食セット / 和室',
        },
    },
    {
        date: '12/31',
        dayOfWeek: '水',
        title: '日本三名泉と名古屋の年越し',
        location: '下呂 → 名古屋',
        weather: { temp: '5°C', condition: 'Sunny' },
        summary: '温泉地ならではの朝を迎え、名古屋へ移動。大晦日の名古屋で年越しそばを楽しみ、新年を迎える準備。',
        transports: [
            {
                type: 'train',
                name: '特急ひだ 8号',
                departureTime: '12:22',
                departurePlace: '下呂',
                arrivalTime: '14:02',
                arrivalPlace: '名古屋',
                status: 'planned',
                details: '指定席の予約推奨',
            },
        ],
        activities: [
            {
                title: '下呂温泉街 散策',
                time: '10:00',
                description: '下呂プリン、足湯めぐり、温泉寺',
                icon: <MapPin size={18} />,
                status: 'planned',
            },
            {
                title: '名古屋城（外観）',
                time: '15:30',
                description: '※年末休園の可能性あり。名城公園散策。',
                icon: <Camera size={18} />,
                status: 'planned',
            },
            {
                title: '年越しそば（きしめん）',
                time: '19:00',
                description: '名古屋駅周辺で夕食',
                icon: <Utensils size={18} />,
                status: 'planned',
            },
        ],
        stay: {
            name: 'ホテルリブマックスBUDGET名古屋太閤通口',
            checkIn: '15:00-22:00',
            status: 'confirmed',
            bookingRef: '予約番号: 5704883964',
            details: 'ファミリールーム 禁煙',
        },
    },
    {
        date: '1/1',
        dayOfWeek: '木',
        title: '初詣と帰路',
        location: '名古屋 → 那覇',
        weather: { temp: '7°C', condition: 'Sunny' },
        summary: '新年の幕開けは熱田神宮で。名古屋めしを最後に味わい、思い出と共に沖縄へ帰還。',
        transports: [
            {
                type: 'train',
                name: '名鉄ミュースカイ',
                departureTime: '15:00',
                departurePlace: '名鉄名古屋',
                arrivalTime: '15:30',
                arrivalPlace: '中部国際空港',
                status: 'planned',
                details: '余裕を持って空港へ',
            },
            {
                type: 'flight',
                name: 'SKY 557便',
                departureTime: '16:50',
                departurePlace: '中部',
                arrivalTime: '19:20',
                arrivalPlace: '那覇',
                status: 'confirmed',
                details: '座席: 2F (フォワードシート) / 予約番号: 0753',
            },
        ],
        activities: [
            {
                title: '熱田神宮 初詣',
                time: '09:00',
                description: '三種の神器を祀る神社。混雑必至のため早めに。',
                icon: <MapPin size={18} />,
                status: 'planned',
            },
            {
                title: '名古屋めしランチ',
                time: '12:00',
                description: 'ひつまぶし または 味噌カツ',
                icon: <Utensils size={18} />,
                status: 'planned',
            },
        ],
        stay: undefined,
    },
];

// --- Utilities & Logic ---

function getTimelineEvents(day) {
    const events = [];

    day.transports.forEach(t => {
        events.push({ type: 'transport', time: t.departureTime, data: t, sortTime: t.departureTime });
    });

    day.activities.forEach(a => {
        events.push({ type: 'activity', time: a.time, data: a, sortTime: a.time });
    });

    if (day.stay) {
        const timeMatch = day.stay.checkIn.match(/(\d{1,2}:\d{2})/);
        const checkInTime = timeMatch ? timeMatch[0] : '17:00';
        events.push({
            type: 'stay',
            time: checkInTime,
            data: day.stay,
            sortTime: checkInTime
        });
    }

    return events.sort((a, b) => a.sortTime.localeCompare(b.sortTime));
}

// --- Components ---

const TimelineNode = ({ type, isLast }) => {
    let icon;
    let colorClass = 'bg-gray-200 text-gray-500';

    if (type === 'transport') {
        icon = <ArrowRight size={14} />;
        colorClass = 'bg-blue-100 text-blue-600 ring-4 ring-white dark:ring-slate-900';
    } else if (type === 'activity') {
        icon = <MapPin size={14} />;
        colorClass = 'bg-emerald-100 text-emerald-600 ring-4 ring-white dark:ring-slate-900';
    } else if (type === 'stay') {
        icon = <Hotel size={14} />;
        colorClass = 'bg-indigo-100 text-indigo-600 ring-4 ring-white dark:ring-slate-900';
    }

    return (
        <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center w-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${colorClass} transition-colors duration-300`}>
                {icon}
            </div>
            {!isLast && <div className="w-0.5 bg-gray-200 dark:bg-slate-700 flex-1 my-1"></div>}
        </div>
    );
};

const TransportItem = ({ item }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:scale-[1.01] hover:shadow-lg transition-all relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-1 h-full ${item.type === 'flight' ? 'bg-sky-500' :
                item.type === 'train' ? 'bg-red-500' :
                    item.type === 'bus' ? 'bg-orange-500' : 'bg-gray-500'}`}
        />

        <div className="flex justify-between items-start mb-3 pl-3">
            <div className="flex items-center gap-2">
                {item.type === 'flight' && <Plane size={18} className="text-gray-400 dark:text-gray-500" />}
                {item.type === 'train' && <Train size={18} className="text-gray-400 dark:text-gray-500" />}
                {item.type === 'bus' && <Bus size={18} className="text-gray-400 dark:text-gray-500" />}
                {item.type === 'other' && <Mountain size={18} className="text-gray-400 dark:text-gray-500" />}
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
                {item.status === 'confirmed' && <CheckCircle size={16} className="text-emerald-500" />}
                {item.status === 'suggested' && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">提案</span>}
            </div>
        </div>

        <div className="flex items-center gap-4 pl-3">
            <div className="text-center min-w-[60px]">
                <div className="text-2xl font-display font-bold text-gray-900 dark:text-white leading-none">{item.departureTime}</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-1">{item.departurePlace}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
                <div className="w-full h-px bg-gray-200 dark:bg-slate-700 relative">
                    <div className="absolute right-0 top-[-3px] w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-500"></div>
                </div>
                <span className="text-[10px] text-gray-300 dark:text-slate-600 mt-1 font-mono">---</span>
            </div>
            <div className="text-center min-w-[60px]">
                <div className="text-2xl font-display font-bold text-gray-900 dark:text-white leading-none">{item.arrivalTime}</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-1">{item.arrivalPlace}</div>
            </div>
        </div>

        {item.bookingRef && (
            <div className="mt-4 pl-3 pt-3 border-t border-dashed border-gray-100 dark:border-slate-700 flex justify-between items-center text-xs">
                <span className="font-mono text-gray-400 dark:text-gray-500 select-all">Ref: {item.bookingRef}</span>
            </div>
        )}
    </div>
);

const ActivityCard = ({ item }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:scale-[1.01] hover:shadow-lg transition-all flex gap-4 items-start">
        <div className="mt-1 p-2 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 rounded-lg">
            {item.icon}
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-baseline">
                <span className="font-display font-bold text-gray-900 dark:text-white text-lg">{item.title}</span>
                <span className="text-sm font-display text-gray-400 font-medium">{item.time}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{item.description}</p>
        </div>
    </div>
);

const StayCard = ({ item }) => (
    <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] dark:from-[#020617] dark:to-[#1e293b] rounded-xl p-6 shadow-xl text-white relative overflow-hidden group hover:scale-[1.01] transition-all">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Hotel size={100} />
        </div>
        <div className="relative z-10">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Accommodation</div>
            <div className="text-2xl font-display font-bold mb-4">{item.name}</div>

            <div className="grid grid-cols-2 gap-6 text-sm opacity-90">
                <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Check-in</div>
                    <div className="font-mono text-lg">{item.checkIn}</div>
                </div>
                {item.bookingRef && (
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Reference</div>
                        <div className="font-mono text-lg select-all">{item.bookingRef}</div>
                    </div>
                )}
            </div>
            {item.details && <div className="mt-4 text-xs text-xs text-gray-400 pt-3 border-t border-gray-700/50">{item.details}</div>}
        </div>
    </div>
);

// --- Auth & Security ---
const PASSCODE = "2025";
const LoginScreen = ({ onLogin }) => {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input === PASSCODE) {
            onLogin();
        } else {
            setError(true);
            setInput('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-sky-500/30">
                    <Plane className="text-white transform -rotate-45" size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Winter Trip</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Enter passcode to view itinerary</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setError(false); }}
                        className="w-full text-center text-3xl font-display font-bold tracking-widest py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-transparent focus:border-sky-500 focus:outline-none dark:text-white placeholder-slate-300 transition-colors"
                        placeholder="••••"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm font-bold animate-pulse">Incorrect passcode</p>}
                    <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg">
                        Unlock Journey
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Main App ---
export default function TravelApp() {
    const [selectedDay, setSelectedDay] = useState(initialItinerary[0]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
        if (sessionStorage.getItem('trip_auth') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
        sessionStorage.setItem('trip_auth', 'true');
    };

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    };

    if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

    return (
        <div className="flex h-[100dvh] bg-[#F8FAFC] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 overflow-hidden text-sm md:text-base">

            {/* Mobile Sidebar & Header Logic is tricky with full scren, so we keep a drawer for mobile */}

            {/* Sidebar (Desktop: Fixed Left, Mobile: Drawer) */}
            <aside className={`
         fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col pt-16 md:pt-0
         ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} // Hidden on mobile by default
      `}>
                {/* Close button for mobile */}
                <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-slate-600 dark:text-slate-300"><X size={24} /></button>

                <div className="p-8 hidden md:block">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-slate-900">
                            <Plane size={18} className="-rotate-45" />
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight dark:text-white">Tabi Log</span>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-11">2025-2026</div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="space-y-1">
                        {initialItinerary.map((day) => (
                            <button
                                key={day.date}
                                onClick={() => { setSelectedDay(day); setSidebarOpen(false); }}
                                className={`w-full text-left p-4 rounded-xl transition-all border flex flex-col gap-1 group ${selectedDay.date === day.date
                                        ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600 shadow-lg scale-[1.02]'
                                        : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-display font-bold text-lg">{day.date}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${selectedDay.date === day.date ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                                        }`}>{day.dayOfWeek}</span>
                                </div>
                                <span className={`text-xs font-medium truncate ${selectedDay.date === day.date ? 'text-slate-300 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'
                                    }`}>
                                    {day.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={toggleDarkMode}
                        className="flex items-center justify-center gap-3 w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors font-bold"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Dashboard Area */}
            <main className="flex-1 md:ml-72 flex flex-col md:flex-row overflow-hidden relative">

                {/* Mobile Header (Only visible on small screens) */}
                <div className="md:hidden flex justify-between items-center p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-40">
                    <div className="font-display font-bold text-xl text-slate-900 dark:text-white">Winter Trip</div>
                    <button onClick={() => setSidebarOpen(true)} className="text-slate-900 dark:text-white">
                        <Menu size={24} />
                    </button>
                </div>

                {/* Left Panel: Dashboard / Info (Scrollable on mobile, Fixed on Desktop) */}
                <div className="w-full md:w-5/12 xl:w-1/3 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto md:overflow-hidden relative">

                    {/* Hero Image Background for Left Panel */}
                    <div className="absolute inset-x-0 top-0 h-64 opacity-100">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542640244-7e67286feb8f?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/80 to-slate-50 dark:via-slate-900/80 dark:to-slate-900"></div>
                    </div>

                    <div className="relative z-10 p-6 md:p-8 flex-1 flex flex-col">
                        {/* Date & Title */}
                        <div className="mt-8 md:mt-12 mb-8">
                            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold uppercase tracking-widest text-xs mb-3">
                                <MapPin size={14} />
                                {selectedDay.location}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-4">
                                {selectedDay.title}
                            </h1>
                            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-medium">
                                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700">
                                    <CalendarDays size={16} />
                                    {selectedDay.date} <span className="text-slate-400">/</span> {selectedDay.dayOfWeek}
                                </div>
                            </div>
                        </div>

                        {/* Widgets Grid */}
                        <div className="grid grid-cols-1 gap-4 mb-8">
                            {/* Weather Widget */}
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Weather Forecast</div>
                                    <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{selectedDay.weather?.temp || '--'} / {selectedDay.weather?.condition || 'Unknown'}</div>
                                </div>
                                <div className="w-10 h-10 bg-sky-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-sky-600 dark:text-sky-400">
                                    <Thermometer size={20} />
                                </div>
                            </div>

                            {/* Note Widget */}
                            <div className="bg-orange-50 dark:bg-orange-950/20 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={20} className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-orange-900 dark:text-orange-200 mb-2">Traveler Notes</h4>
                                        <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed">
                                            {selectedDay.summary}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Decorative / Spacer */}
                        <div className="hidden md:flex flex-1 items-end opacity-20 dark:opacity-10 justify-center pb-8">
                            <Mountain size={120} className="text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* Right Panel: Scrollable Timeline */}
                <div className="flex-1 bg-white dark:bg-slate-950 overflow-y-auto relative scroll-smooth px-4 py-8 md:p-12">
                    <div className="max-w-3xl mx-auto pb-20">
                        <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-8 flex items-center gap-2">
                            <Clock size={20} className="text-sky-500" />
                            Timeline
                        </h3>

                        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 md:ml-3 space-y-12">
                            {getTimelineEvents(selectedDay).map((event, i, arr) => (
                                <div key={i} className="relative pl-8 md:pl-12 group">
                                    {/* Absolute Timeline Dot */}
                                    <div className="absolute -left-[9px] top-0 bg-white dark:bg-slate-950 py-1">
                                        <div className={`w-4 h-4 rounded-full border-4 ${event.type === 'transport' ? 'border-blue-500 bg-white' :
                                                event.type === 'activity' ? 'border-emerald-500 bg-white' :
                                                    'border-indigo-500 bg-white'
                                            }`}></div>
                                    </div>

                                    {/* Content */}
                                    <div className="transform transition-all duration-300 hover:translate-x-2">
                                        {event.type === 'transport' && <TransportItem item={event.data} />}
                                        {event.type === 'activity' && <ActivityCard item={event.data} />}
                                        {event.type === 'stay' && <StayCard item={event.data} />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-20 text-center">
                            <div className="inline-block px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                End of Day
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
