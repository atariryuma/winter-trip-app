import React, { useState, useEffect, useCallback } from 'react';
import {
    Plane,
    Train,
    Hotel,
    MapPin,
    Clock,
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
    Share2,
    Printer,
    Home,
    Map,
    Settings,
    ChevronLeft,
    ChevronRight,
    Check,
    Copy,
    ExternalLink
} from 'lucide-react';

// ============================================================================
// DATA (PRESERVED - NO CHANGES)
// ============================================================================

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

// ============================================================================
// UTILITIES
// ============================================================================

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
        events.push({ type: 'stay', time: checkInTime, data: day.stay, sortTime: checkInTime });
    }

    return events.sort((a, b) => a.sortTime.localeCompare(b.sortTime));
}

const getTransportColor = (type) => {
    switch (type) {
        case 'flight': return 'bg-sky-500';
        case 'train': return 'bg-rose-500';
        case 'bus': return 'bg-amber-500';
        default: return 'bg-slate-500';
    }
};

const getTransportIcon = (type) => {
    switch (type) {
        case 'flight': return <Plane size={16} />;
        case 'train': return <Train size={16} />;
        case 'bus': return <Bus size={16} />;
        default: return <Mountain size={16} />;
    }
};

// ============================================================================
// COMPONENTS
// ============================================================================

// --- Status Badge ---
const StatusBadge = ({ status }) => {
    if (status === 'confirmed') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                <CheckCircle size={12} /> 確定
            </span>
        );
    }
    if (status === 'suggested') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                <AlertCircle size={12} /> 提案
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            <Clock size={12} /> 予定
        </span>
    );
};

// --- Transport Card ---
const TransportCard = ({ item }) => (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group">
        {/* Color Accent */}
        <div className={`absolute top-0 left-0 w-1.5 h-full ${getTransportColor(item.type)} rounded-l-2xl`} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pl-3">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${getTransportColor(item.type)} text-white shadow-lg`}>
                    {getTransportIcon(item.type)}
                </div>
                <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm md:text-base">{item.name}</div>
                    <div className="text-xs text-slate-400">{item.type === 'flight' ? 'Flight' : item.type === 'train' ? 'Train' : item.type === 'bus' ? 'Bus' : 'Other'}</div>
                </div>
            </div>
            <StatusBadge status={item.status} />
        </div>

        {/* Time Block */}
        <div className="flex items-center gap-3 md:gap-4 pl-3 mb-4">
            <div className="text-center flex-1">
                <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{item.departureTime}</div>
                <div className="text-[10px] md:text-xs text-slate-400 font-medium mt-1 truncate">{item.departurePlace}</div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-8 md:w-12 h-px bg-slate-200 dark:bg-slate-600 relative">
                    <ArrowRight size={14} className="absolute -right-1 -top-[7px] text-slate-300 dark:text-slate-500" />
                </div>
            </div>
            <div className="text-center flex-1">
                <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{item.arrivalTime}</div>
                <div className="text-[10px] md:text-xs text-slate-400 font-medium mt-1 truncate">{item.arrivalPlace}</div>
            </div>
        </div>

        {/* Details */}
        {item.details && (
            <div className="pl-3 pt-3 border-t border-dashed border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.details}</p>
            </div>
        )}
    </div>
);

// --- Activity Card ---
const ActivityCard = ({ item }) => (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 flex gap-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            {item.icon || <MapPin size={20} />}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base truncate">{item.title}</h4>
                <span className="text-sm font-bold text-slate-400 shrink-0">{item.time}</span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
            {item.status === 'suggested' && (
                <div className="mt-2">
                    <StatusBadge status="suggested" />
                </div>
            )}
        </div>
    </div>
);

// --- Stay Card ---
const StayCard = ({ item }) => (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-5 md:p-6 text-white shadow-xl group hover:shadow-2xl transition-all duration-300">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4"><Hotel size={100} /></div>
        </div>

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">宿泊</span>
                <StatusBadge status={item.status} />
            </div>

            <h3 className="text-xl md:text-2xl font-black mb-4">{item.name}</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div className="text-[10px] text-indigo-200 uppercase tracking-wider mb-1">チェックイン</div>
                    <div className="font-bold text-lg">{item.checkIn}</div>
                </div>
                {item.bookingRef && (
                    <div>
                        <div className="text-[10px] text-indigo-200 uppercase tracking-wider mb-1">予約番号</div>
                        <div className="font-mono text-sm select-all">{item.bookingRef.replace('予約番号: ', '')}</div>
                    </div>
                )}
            </div>

            {item.details && (
                <div className="mt-4 pt-4 border-t border-white/20 text-sm text-indigo-100">
                    {item.details}
                </div>
            )}
        </div>
    </div>
);

// --- Day Progress Indicator ---
const DayProgress = ({ currentIndex, total, onSelect, days }) => (
    <div className="flex items-center justify-center gap-2 py-3">
        {days.map((day, i) => (
            <button
                key={day.date}
                onClick={() => onSelect(day)}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full font-bold text-xs md:text-sm transition-all duration-300 ${i === currentIndex
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-110 shadow-lg'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                aria-label={`Day ${i + 1}: ${day.date}`}
            >
                {i + 1}
            </button>
        ))}
    </div>
);

// --- Share Dialog ---
const ShareDialog = ({ isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">旅程を共有</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">このリンクを家族に送信して、旅程を共有しましょう。</p>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 truncate"
                    />
                    <button
                        onClick={handleCopy}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${copied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200'
                            }`}
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Bottom Navigation (Mobile) ---
const BottomNav = ({ onShare, onPrint, darkMode, onToggleDarkMode }) => (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 safe-area-pb">
        <div className="flex items-center justify-around py-2">
            <button className="flex flex-col items-center gap-1 p-2 text-sky-600 dark:text-sky-400">
                <CalendarDays size={22} />
                <span className="text-[10px] font-bold">日程</span>
            </button>
            <button onClick={onShare} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <Share2 size={22} />
                <span className="text-[10px] font-medium">共有</span>
            </button>
            <button onClick={onPrint} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <Printer size={22} />
                <span className="text-[10px] font-medium">印刷</span>
            </button>
            <button onClick={onToggleDarkMode} className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                {darkMode ? <Sun size={22} /> : <Moon size={22} />}
                <span className="text-[10px] font-medium">{darkMode ? 'ライト' : 'ダーク'}</span>
            </button>
        </div>
    </nav>
);

// --- Login Screen ---
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-sky-500/30 transform -rotate-6">
                        <Plane className="text-white transform rotate-6" size={36} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Winter Trip</h1>
                        <p className="text-slate-400 text-sm mt-2">2024-2025 家族旅行</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={input}
                                onChange={(e) => { setInput(e.target.value); setError(false); }}
                                className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 focus:outline-none dark:text-white transition-all"
                                placeholder="••••"
                                autoFocus
                                aria-label="パスコード入力"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm font-bold animate-pulse">パスコードが違います</p>}

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                        >
                            旅を始める
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN APP
// ============================================================================

export default function TravelApp() {
    const [selectedDay, setSelectedDay] = useState(initialItinerary[0]);
    const [currentDayIndex, setCurrentDayIndex] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Initialize
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

    const selectDay = (day) => {
        setSelectedDay(day);
        setCurrentDayIndex(initialItinerary.findIndex(d => d.date === day.date));
        setSidebarOpen(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        setShowShareDialog(true);
    };

    const goToPrevDay = () => {
        if (currentDayIndex > 0) {
            selectDay(initialItinerary[currentDayIndex - 1]);
        }
    };

    const goToNextDay = () => {
        if (currentDayIndex < initialItinerary.length - 1) {
            selectDay(initialItinerary[currentDayIndex + 1]);
        }
    };

    if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

    const events = getTimelineEvents(selectedDay);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-white transition-colors duration-300 print:bg-white">

            {/* Desktop Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-700">
                    <X size={24} />
                </button>

                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Plane size={20} className="-rotate-45" />
                        </div>
                        <div>
                            <h1 className="font-black text-lg tracking-tight">Winter Trip</h1>
                            <p className="text-xs text-slate-400">2024-2025</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto h-[calc(100vh-180px)]">
                    <div className="space-y-2">
                        {initialItinerary.map((day, i) => (
                            <button
                                key={day.date}
                                onClick={() => selectDay(day)}
                                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${selectedDay.date === day.date
                                        ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-lg'
                                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold">{day.date}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${selectedDay.date === day.date ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
                                        }`}>{day.dayOfWeek}</span>
                                </div>
                                <p className="text-xs truncate opacity-70">{day.title}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex gap-2">
                        <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <Share2 size={16} /> 共有
                        </button>
                        <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <Printer size={16} /> 印刷
                        </button>
                        <button onClick={toggleDarkMode} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="md:ml-72 pb-24 md:pb-8">

                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 print:hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-700 dark:text-white">
                            <Menu size={24} />
                        </button>
                        <h1 className="font-black text-lg">Winter Trip</h1>
                        <div className="w-10"></div>
                    </div>

                    {/* Day Progress */}
                    <DayProgress
                        currentIndex={currentDayIndex}
                        total={initialItinerary.length}
                        onSelect={selectDay}
                        days={initialItinerary}
                    />
                </header>

                {/* Day Header */}
                <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden print:bg-white print:text-black">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542640244-7e67286feb8f?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>

                    <div className="relative z-10 px-4 md:px-8 py-8 md:py-12">
                        <div className="max-w-4xl mx-auto">
                            {/* Navigation Arrows (Desktop) */}
                            <div className="hidden md:flex items-center justify-between mb-6">
                                <button
                                    onClick={goToPrevDay}
                                    disabled={currentDayIndex === 0}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="text-center">
                                    <span className="text-sm font-bold text-white/60">Day {currentDayIndex + 1} of {initialItinerary.length}</span>
                                </div>
                                <button
                                    onClick={goToNextDay}
                                    disabled={currentDayIndex === initialItinerary.length - 1}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>

                            {/* Date & Location */}
                            <div className="flex items-center gap-2 text-sky-400 text-sm font-bold mb-3">
                                <MapPin size={14} />
                                <span>{selectedDay.location}</span>
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3 leading-tight print:text-2xl print:text-black">
                                {selectedDay.title}
                            </h2>

                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                                    <CalendarDays size={14} />
                                    <span>{selectedDay.date} ({selectedDay.dayOfWeek})</span>
                                </div>
                                {selectedDay.weather && (
                                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                                        <Sun size={14} />
                                        <span>{selectedDay.weather.temp} / {selectedDay.weather.condition}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">

                    {/* Summary Card */}
                    {selectedDay.summary && (
                        <div className="mb-8 p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30 print:bg-yellow-50 print:border-yellow-200">
                            <div className="flex items-start gap-3">
                                <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-1">今日のポイント</h3>
                                    <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{selectedDay.summary}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-4 md:space-y-6">
                        {events.map((event, i) => (
                            <div key={i} className="relative">
                                {/* Time Marker */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 text-right">
                                        <span className="text-sm font-black text-slate-400">{event.time}</span>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${event.type === 'transport' ? 'bg-sky-500' :
                                            event.type === 'activity' ? 'bg-emerald-500' :
                                                'bg-indigo-500'
                                        }`}></div>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                                </div>

                                {/* Card */}
                                <div className="ml-[72px]">
                                    {event.type === 'transport' && <TransportCard item={event.data} />}
                                    {event.type === 'activity' && <ActivityCard item={event.data} />}
                                    {event.type === 'stay' && <StayCard item={event.data} />}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* End of Day */}
                    <div className="mt-12 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-bold text-slate-400">
                            <Check size={16} />
                            <span>Day {currentDayIndex + 1} Complete</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <BottomNav
                onShare={handleShare}
                onPrint={handlePrint}
                darkMode={darkMode}
                onToggleDarkMode={toggleDarkMode}
            />

            {/* Share Dialog */}
            <ShareDialog isOpen={showShareDialog} onClose={() => setShowShareDialog(false)} />

            {/* Print Styles */}
            <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:text-black { color: black !important; }
        }
        .safe-area-pb { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
        </div>
    );
}
