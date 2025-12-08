import React, { useState } from 'react';
import {
    Plane,
    Train,
    Hotel,
    MapPin,
    Clock,
    Calendar,
    ChevronDown,
    ChevronUp,
    Utensils,
    Camera,
    Mountain,
    CheckCircle,
    AlertCircle,
    Bus,
    ArrowRight,
    Menu
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

// --- Modern UI Components ---

const StatusBadge = ({ status }) => {
    const styles = {
        confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-emerald-500/20',
        planned: 'bg-indigo-100 text-indigo-700 border-indigo-200 ring-indigo-500/20',
        suggested: 'bg-amber-100 text-amber-700 border-amber-200 ring-amber-500/20',
    };

    const labels = {
        confirmed: '予約確定',
        planned: '計画中',
        suggested: '提案',
    };

    const icons = {
        confirmed: <CheckCircle size={10} className="mr-1 stroke-[2.5]" />,
        planned: <Clock size={10} className="mr-1 stroke-[2.5]" />,
        suggested: <Mountain size={10} className="mr-1 stroke-[2.5]" />,
    };

    return (
        <span className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ring-1 ${styles[status]}`}>
            {icons[status]}
            {labels[status]}
        </span>
    );
};

const TransportCard = ({ segment }) => {
    const getIcon = () => {
        switch (segment.type) {
            case 'flight': return <Plane size={24} className="text-sky-500" />;
            case 'train': return <Train size={24} className="text-rose-500" />;
            case 'bus': return <Bus size={24} className="text-amber-500" />;
            case 'other': return <Mountain size={24} className="text-purple-500" />;
        }
    };

    return (
        <div className="group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 mb-4 overflow-hidden">
            {/* Decorative side bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${segment.type === 'flight' ? 'bg-sky-400' :
                    segment.type === 'train' ? 'bg-rose-400' :
                        segment.type === 'bus' ? 'bg-amber-400' : 'bg-purple-400'
                }`} />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pl-3 gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform">
                        {getIcon()}
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 text-lg leading-tight">{segment.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">交通手段</div>
                    </div>
                </div>
                <StatusBadge status={segment.status} />
            </div>

            <div className="flex items-center gap-6 pl-3 relative">
                <div className="flex-1 text-center sm:text-left">
                    <div className="text-2xl font-black text-gray-800 tracking-tight">{segment.departureTime}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">{segment.departurePlace}</div>
                </div>

                <div className="flex flex-col items-center justify-center w-8 text-gray-300">
                    <ArrowRight size={20} className="sm:rotate-0 rotate-90" />
                </div>

                <div className="flex-1 text-center sm:text-right">
                    <div className="text-2xl font-black text-gray-800 tracking-tight">{segment.arrivalTime}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">{segment.arrivalPlace}</div>
                </div>
            </div>

            {segment.details && (
                <div className="mt-5 ml-2 p-3 bg-gray-50/80 rounded-xl text-sm text-gray-600 border border-gray-100 flex items-start gap-2">
                    <AlertCircle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{segment.details}</span>
                </div>
            )}
        </div>
    );
};

const StayCard = ({ stay }) => {
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-sm mb-4">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Hotel size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <span className="block text-xs font-bold text-indigo-400 uppercase tracking-wide">宿泊先</span>
                        <span className="font-bold text-lg text-gray-800">{stay.name}</span>
                    </div>
                </div>
                <StatusBadge status={stay.status} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                <div className="bg-white/60 p-2.5 rounded-lg border border-indigo-50">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Check-in</span>
                    <span className="font-semibold text-gray-700">{stay.checkIn}</span>
                </div>
                {stay.bookingRef && (
                    <div className="bg-white/60 p-2.5 rounded-lg border border-indigo-50">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase">予約番号</span>
                        <span className="font-semibold text-gray-700 font-mono">{stay.bookingRef}</span>
                    </div>
                )}
            </div>
            {stay.details && <div className="mt-3 text-sm text-indigo-900/70 pl-1">{stay.details}</div>}
        </div>
    );
};

const ActivityItem = ({ activity, isLast }) => {
    const getIconColor = (status) => {
        if (status === 'suggested') return 'text-amber-500 bg-amber-50';
        return 'text-teal-600 bg-teal-50';
    }

    return (
        <div className="relative pl-8 pb-8 group">
            {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-gray-100 group-hover:bg-gray-200 transition-colors" />}
            <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 ${getIconColor(activity.status)}`}>
                {activity.icon}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-sm font-bold text-teal-600">{activity.time}</span>
                        <h4 className="font-bold text-gray-800 mt-0.5">{activity.title}</h4>
                    </div>
                    {activity.status === 'suggested' && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">提案</span>
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{activity.description}</p>
            </div>
        </div>
    );
};

export default function TravelApp() {
    const [activeTab, setActiveTab] = useState('timeline');
    // デフォルトですべて展開または今日の日付を展開するロジックに変更も可能
    const [expandedDay, setExpandedDay] = useState(initialItinerary[0].date);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleDay = (date) => {
        setExpandedDay(expandedDay === date ? null : date);
    };

    const scrollToDay = (date) => {
        const element = document.getElementById(`day-${date}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setExpandedDay(date);
            setSidebarOpen(false); // Mobile: close menu on jump
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-gray-900 overflow-hidden">
            {/* Desktop Sidebar (Left) */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 z-20 shadow-xl shadow-gray-200/50">
                <div className="p-6">
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2 tracking-tight">
                        <Plane className="text-teal-600 rotate-[-45deg]" size={28} />
                        Tabi Log
                    </h1>
                    <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-wider">Winter Trip 2025-2026</p>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 space-y-2">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Itinerary</div>
                    {initialItinerary.map((day) => (
                        <button
                            key={day.date}
                            onClick={() => scrollToDay(day.date)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${expandedDay === day.date
                                    ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-100'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                }`}
                        >
                            <span className="block font-bold">{day.date} <span className="text-xs opacity-70 ml-1">({day.dayOfWeek})</span></span>
                            <span className="block text-xs truncate opacity-80 mt-0.5">{day.location}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="bg-indigo-50 p-4 rounded-xl">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase">Status</h3>
                        <div className="mt-2 flex items-center gap-2 text-indigo-900 font-bold">
                            <CheckCircle size={16} />
                            <span>All Systems Go</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full relative">
                {/* Mobile Header */}
                <header className="md:hidden bg-white/80 backdrop-blur-md p-4 sticky top-0 z-30 border-b border-gray-200 flex justify-between items-center">
                    <div className="font-bold text-lg flex items-center gap-2">
                        <Plane className="text-teal-600 rotate-[-45deg]" size={20} />
                        Tabi Log
                    </div>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-100 rounded-lg">
                        <Menu size={20} />
                    </button>
                </header>

                {/* View Toggle (Tabs) */}
                <div className="max-w-3xl w-full mx-auto px-4 md:px-8 py-6 flex-shrink-0">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('timeline')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'timeline' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            Timeline
                        </button>
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-teal-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            Bookings
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-20 scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-8">

                        {activeTab === 'timeline' ? (
                            <>
                                {/* Planner Advice */}
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
                                    <div className="flex items-center gap-2 font-bold text-amber-900 mb-3">
                                        <div className="p-1.5 bg-amber-200 rounded-full text-amber-800">
                                            <AlertCircle size={16} />
                                        </div>
                                        <span className="text-sm uppercase tracking-wide">Planner's Note</span>
                                    </div>
                                    <ul className="space-y-2 text-sm text-amber-900/80 font-medium">
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2" />
                                            12/30に新穂高ロープウェイを組み込みました。そのため、下呂への移動は夕方になります。
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2" />
                                            白川郷のバス（12/29）は非常に混雑します。Webでの早めの予約を強く推奨します。
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2" />
                                            特急ひだ（12/30, 12/31）の指定席手配をお忘れなく。
                                        </li>
                                    </ul>
                                </div>

                                {/* Days */}
                                {initialItinerary.map((day) => (
                                    <div id={`day-${day.date}`} key={day.date} className="relative transition-all duration-500">
                                        {/* Day Header - Sticky on Desktop inside the scroll area if wanted, but simpler to keep clean */}
                                        <button
                                            onClick={() => toggleDay(day.date)}
                                            className="w-full text-left group"
                                        >
                                            <div className="flex items-end gap-3 mb-4 pl-2">
                                                <span className="text-4xl font-black text-gray-800 tabular-nums tracking-tighter group-hover:text-teal-600 transition-colors">
                                                    {day.date}
                                                </span>
                                                <span className="text-xl font-bold text-gray-400 pb-1.5 group-hover:text-teal-400 transition-colors">
                                                    {day.dayOfWeek}
                                                </span>
                                                <div className="h-px bg-gray-200 flex-1 mb-3 ml-2 group-hover:bg-teal-100" />
                                            </div>
                                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-md transition-all">
                                                <div>
                                                    <h2 className="font-bold text-lg text-gray-800">{day.title}</h2>
                                                    <div className="text-sm font-medium text-gray-400 flex items-center gap-1 mt-1">
                                                        <MapPin size={14} />
                                                        {day.location}
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-full bg-gray-50 text-gray-400 transition-transform duration-300 ${expandedDay === day.date ? 'rotate-180 bg-teal-50 text-teal-600' : ''}`}>
                                                    <ChevronDown size={20} />
                                                </div>
                                            </div>
                                        </button>

                                        {/* Expanded Content */}
                                        <div className={`grid transition-all duration-500 ease-in-out ${expandedDay === day.date ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                                            <div className="overflow-hidden">
                                                <div className="md:flex gap-6">
                                                    {/* Timeline/Activities Column */}
                                                    <div className="flex-1 order-2 md:order-1">
                                                        {day.activities.length > 0 && (
                                                            <div className="mb-6">
                                                                {day.activities.map((a, i) => (
                                                                    <ActivityItem key={i} activity={a} isLast={i === day.activities.length - 1} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Logistics Column */}
                                                    <div className="w-full md:w-80 order-1 md:order-2 space-y-4">
                                                        {day.transports.length > 0 && (
                                                            <div>
                                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">Transport</h3>
                                                                {day.transports.map((t, i) => (
                                                                    <TransportCard key={i} segment={t} />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {day.stay && (
                                                            <div>
                                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pl-1">Accommodation</h3>
                                                                <StayCard stay={day.stay} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            // Summary View
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><CheckCircle size={20} /></div>
                                        Confirmed Bookings
                                    </h2>
                                    <div className="space-y-3">
                                        {initialItinerary.flatMap(day =>
                                            [...day.transports, day.stay]
                                                .filter((item) => item && item.status === 'confirmed')
                                                .map((item, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day.date}</span>
                                                        <div className="font-bold text-gray-800 text-lg mt-0.5">{item.name}</div>
                                                        {item.bookingRef && (
                                                            <div className="mt-2 inline-block bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded font-mono font-bold">
                                                                Ref: {item.bookingRef}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><AlertCircle size={20} /></div>
                                        To Arrange
                                    </h2>
                                    <div className="space-y-3">
                                        {initialItinerary.flatMap(day =>
                                            day.transports
                                                .filter(t => t.status === 'suggested' || t.status === 'planned')
                                                .map((item, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-center">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day.date}</span>
                                                                <div className="font-bold text-gray-800 text-base">{item.name}</div>
                                                            </div>
                                                            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded uppercase">{item.status}</span>
                                                        </div>
                                                    </div>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* End Spacer */}
                        <div className="h-20" />

                    </div>
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl p-6 animation-slide-in">
                        <div className="flex justify-between items-center mb-6">
                            <span className="font-black text-xl">Menu</span>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full"><ChevronDown className="rotate-90" /></button>
                        </div>
                        <nav className="space-y-2">
                            {initialItinerary.map((day) => (
                                <button
                                    key={day.date}
                                    onClick={() => scrollToDay(day.date)}
                                    className="block w-full text-left py-3 px-4 rounded-xl hover:bg-gray-50 font-bold text-gray-600"
                                >
                                    {day.date} - {day.title.substring(0, 10)}...
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}
