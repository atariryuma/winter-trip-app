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
    Sun
} from 'lucide-react';

// --- Data (Preserved) ---
const initialItinerary = [
    {
        date: '12/28',
        dayOfWeek: '日',
        title: '沖縄から飛騨高山への大移動',
        location: '那覇 → 名古屋 → 高山',
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

// --- Improved Components ---

// Combined function to get merged list of transport and activities for a true chronological timeline
function getTimelineEvents(day) {
    const events = [];

    day.transports.forEach(t => {
        events.push({ type: 'transport', time: t.departureTime, data: t, sortTime: t.departureTime });
    });

    day.activities.forEach(a => {
        events.push({ type: 'activity', time: a.time, data: a, sortTime: a.time });
    });

    if (day.stay) {
        events.push({ type: 'stay', time: '17:00 (Check-in)', data: day.stay, sortTime: '24:00' }); // End of day typically
    }

    // Simple string sort works for "HH:MM"
    return events.sort((a, b) => a.sortTime.localeCompare(b.sortTime));
}

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
            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${colorClass}`}>
                {icon}
            </div>
            {!isLast && <div className="w-0.5 bg-gray-200 dark:bg-slate-700 flex-1 my-1"></div>}
        </div>
    );
};

// --- New Cards ---

const TransportItem = ({ item }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow relative overflow-hidden group">
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
            {item.status === 'confirmed' && <CheckCircle size={16} className="text-emerald-500" />}
            {item.status === 'suggested' && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full font-bold">提案</span>}
            {item.status === 'planned' && <Clock size={16} className="text-blue-400" />}
        </div>

        <div className="flex items-center gap-4 pl-3">
            <div className="text-center min-w-[60px]">
                <div className="text-xl font-display font-bold text-gray-900 dark:text-white">{item.departureTime}</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-1">{item.departurePlace}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
                <div className="w-full h-px bg-gray-200 dark:bg-slate-700 relative">
                    <div className="absolute right-0 top-[-3px] w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-500"></div>
                </div>
                <span className="text-[10px] text-gray-300 dark:text-slate-600 mt-1 font-mono">---</span>
            </div>
            <div className="text-center min-w-[60px]">
                <div className="text-xl font-display font-bold text-gray-900 dark:text-white">{item.arrivalTime}</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-1">{item.arrivalPlace}</div>
            </div>
        </div>

        {item.bookingRef && (
            <div className="mt-4 pl-3 pt-3 border-t border-dashed border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500">Ref: {item.bookingRef}</span>
                {item.details && <span className="text-xs text-gray-500 dark:text-gray-400">{item.details}</span>}
            </div>
        )}
    </div>
);

const ActivityCard = ({ item }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow flex gap-4 items-start">
        <div className="mt-1 p-2 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-gray-300 rounded-lg">
            {item.icon}
        </div>
        <div className="flex-1">
            <div className="flex justify-between">
                <span className="font-display font-bold text-gray-900 dark:text-white">{item.title}</span>
                <span className="text-sm font-display text-gray-400">{item.time}</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{item.description}</p>
            {item.status === 'suggested' && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">
                    <AlertCircle size={12} />
                    <span>Suggested Activity</span>
                </div>
            )}
        </div>
    </div>
);

const StayCard = ({ item }) => (
    <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] dark:from-[#020617] dark:to-[#1e293b] rounded-xl p-5 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
            <Hotel size={80} />
        </div>
        <div className="relative z-10">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Accommodation</div>
            <div className="text-xl font-display font-bold mb-4">{item.name}</div>

            <div className="grid grid-cols-2 gap-4 text-sm opacity-90">
                <div>
                    <div className="text-[10px] text-gray-400 uppercase">Check-in</div>
                    <div className="font-mono">{item.checkIn}</div>
                </div>
                {item.bookingRef && (
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase">Res #</div>
                        <div className="font-mono">{item.bookingRef}</div>
                    </div>
                )}
            </div>
            {item.details && <div className="mt-4 text-xs text-gray-400 pt-3 border-t border-gray-700/50">{item.details}</div>}
        </div>
    </div>
);

// --- Main App ---

export default function TravelApp() {
    const [selectedDay, setSelectedDay] = useState(initialItinerary[0]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Initialize Dark Mode based on system preference
    useEffect(() => {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-[#F8FAFC] dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300">

            {/* Mobile Nav Top */}
            <div className="md:hidden flex justify-between items-center p-4 bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-50">
                <div className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">Winter Trip</div>
                <div className="flex gap-4">
                    <button onClick={toggleDarkMode} className="text-slate-600 dark:text-slate-300">
                        {darkMode ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className="text-slate-600 dark:text-slate-300">
                        <Menu size={24} />
                    </button>
                </div>
            </div>

            {/* Sidebar Navigation */}
            <aside className={`
         fixed md:static inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 w-72 z-50 transform transition-transform duration-300 ease-in-out
         ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                <div className="p-8 hidden md:flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black">
                                <Plane size={18} className="-rotate-45" />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight dark:text-white">Tabi Log</span>
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-11">2025-2026</div>
                    </div>
                </div>

                <div className="px-4 py-2 md:py-0">
                    <div className="flex justify-between items-center px-4 mb-4 md:hidden">
                        <span className="font-bold text-lg dark:text-white">Menu</span>
                        <button onClick={() => setSidebarOpen(false)} className="dark:text-white"><X size={24} /></button>
                    </div>

                    <div className="space-y-1">
                        {initialItinerary.map((day) => (
                            <button
                                key={day.date}
                                onClick={() => { setSelectedDay(day); setSidebarOpen(false); }}
                                className={`w-full text-left p-4 rounded-xl transition-all border flex flex-col gap-1 group ${selectedDay.date === day.date
                                        ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600 shadow-lg scale-[1.02]'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-display font-bold text-lg">{day.date}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${selectedDay.date === day.date ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-700'
                                        }`}>{day.dayOfWeek}</span>
                                </div>
                                <span className={`text-xs font-medium truncate ${selectedDay.date === day.date ? 'text-slate-300 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                    {day.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Dark Mode Toggle at bottom */}
                <div className="absolute bottom-0 w-full p-4 hidden md:block border-t border-gray-100 dark:border-slate-800">
                    <button
                        onClick={toggleDarkMode}
                        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        <span className="text-sm font-bold">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[#F8FAFC] dark:bg-slate-950">

                {/* Hero Header for Day */}
                <div className="h-48 md:h-64 bg-slate-900 relative flex items-end p-6 md:p-10 shrink-0">
                    <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1542640244-7e67286feb8f?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

                    <div className="relative z-10 w-full max-w-2xl">
                        <div className="flex items-center gap-2 text-sky-400 font-bold uppercase tracking-widest text-xs mb-2">
                            <MapPin size={14} />
                            {selectedDay.location}
                        </div>
                        <h1 className="text-2xl md:text-4xl font-display font-bold text-white mb-2 leading-tight">{selectedDay.title}</h1>
                        <div className="flex gap-4 text-slate-300 text-sm">
                            <div className="flex items-center gap-1"><CalendarDays size={16} /> {selectedDay.date} ({selectedDay.dayOfWeek})</div>
                        </div>
                    </div>
                </div>

                {/* Timeline Container */}
                <div className="max-w-3xl mx-auto px-4 md:px-10 py-10 relative">

                    <div className="absolute left-4 md:left-10 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 hidden md:block ml-[19px]"></div> {/* Vertical Line visual helper just in case */}

                    {/* Note Box */}
                    <div className="mb-10 p-5 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-100 dark:border-orange-900/50 flex gap-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-lg h-fit">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-orange-900 dark:text-orange-200 mb-1">Traveler Notes</h4>
                            <ul className="text-sm text-orange-800 dark:text-orange-300 space-y-1 list-disc list-inside">
                                <li>Check weather forecast for snow.</li>
                                <li>Ensure all bookings are saved offline.</li>
                                {selectedDay.date === '12/29' && <li>Shirakawa-go bus requires reservation verification!</li>}
                                {selectedDay.date === '12/30' && <li>Ropeway ticket changed to 10:30.</li>}
                            </ul>
                        </div>
                    </div>

                    {/* Event Stream */}
                    <div className="space-y-8 pl-4 md:pl-0">
                        {getTimelineEvents(selectedDay).map((event, i, arr) => (
                            <div key={i} className="relative pl-12 md:pl-16 group">
                                {/* Timeline Node */}
                                <TimelineNode type={event.type} isLast={i === arr.length - 1} />

                                <div className="transform transition-all group-hover:translate-x-1">
                                    {event.type === 'transport' && <TransportItem item={event.data} />}
                                    {event.type === 'activity' && <ActivityCard item={event.data} />}
                                    {event.type === 'stay' && <StayCard item={event.data} />}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="h-20"></div>
                </div>

            </main>
        </div>
    );
}
