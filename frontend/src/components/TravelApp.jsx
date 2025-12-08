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
    Bus
} from 'lucide-react';

// --- Data ---

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
                icon: <Utensils size={16} />,
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
                icon: <Hotel size={16} />,
                status: 'planned',
            },
            {
                title: '白川郷 散策',
                time: '10:00',
                description: '展望台からの景色、合掌造り民家園など',
                icon: <Camera size={16} />,
                status: 'planned',
            },
            {
                title: '古い町並み散策',
                time: '15:00',
                description: 'さんまち通りで食べ歩き・お土産購入',
                icon: <MapPin size={16} />,
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
                icon: <Utensils size={16} />,
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
                icon: <MapPin size={16} />,
                status: 'planned',
            },
            {
                title: '名古屋城（外観）',
                time: '15:30',
                description: '※年末休園の可能性あり。名城公園散策。',
                icon: <Camera size={16} />,
                status: 'planned',
            },
            {
                title: '年越しそば（きしめん）',
                time: '19:00',
                description: '名古屋駅周辺で夕食',
                icon: <Utensils size={16} />,
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
                icon: <MapPin size={16} />,
                status: 'planned',
            },
            {
                title: '名古屋めしランチ',
                time: '12:00',
                description: 'ひつまぶし または 味噌カツ',
                icon: <Utensils size={16} />,
                status: 'planned',
            },
        ],
        stay: undefined,
    },
];

// --- Components ---

const StatusBadge = ({ status }) => {
    const styles = {
        confirmed: 'bg-green-100 text-green-800 border-green-200',
        planned: 'bg-blue-100 text-blue-800 border-blue-200',
        suggested: 'bg-amber-100 text-amber-800 border-amber-200',
    };

    const labels = {
        confirmed: '予約確定',
        planned: '計画中',
        suggested: '提案',
    };

    const icons = {
        confirmed: <CheckCircle size={12} className="mr-1" />,
        planned: <Clock size={12} className="mr-1" />,
        suggested: <Mountain size={12} className="mr-1" />,
    };

    return (
        <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            {icons[status]}
            {labels[status]}
        </span>
    );
};

const TransportCard = ({ segment }) => {
    const getIcon = () => {
        switch (segment.type) {
            case 'flight': return <Plane size={20} className="text-sky-600" />;
            case 'train': return <Train size={20} className="text-emerald-600" />;
            case 'bus': return <Bus size={20} className="text-orange-600" />;
            case 'other': return <Mountain size={20} className="text-purple-600" />;
        }
    };

    return (
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm mb-3">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <span className="font-bold text-gray-800">{segment.name}</span>
                </div>
                <StatusBadge status={segment.status} />
            </div>
            <div className="flex items-center gap-4 text-sm">
                <div className="flex-1">
                    <div className="text-xl font-bold text-gray-900">{segment.departureTime}</div>
                    <div className="text-gray-500">{segment.departurePlace}</div>
                </div>
                <div className="text-gray-300">→</div>
                <div className="flex-1 text-right">
                    <div className="text-xl font-bold text-gray-900">{segment.arrivalTime}</div>
                    <div className="text-gray-500">{segment.arrivalPlace}</div>
                </div>
            </div>
            {segment.details && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {segment.details}
                </div>
            )}
        </div>
    );
};

const StayCard = ({ stay }) => {
    return (
        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 shadow-sm mb-3">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <Hotel size={20} className="text-indigo-600" />
                    <span className="font-bold text-indigo-900">{stay.name}</span>
                </div>
                <StatusBadge status={stay.status} />
            </div>
            <div className="text-sm text-indigo-800 mb-1">
                <span className="font-medium">Check-in:</span> {stay.checkIn}
            </div>
            {stay.details && <div className="text-xs text-indigo-600 mt-1">{stay.details}</div>}
            {stay.bookingRef && <div className="text-xs font-mono text-indigo-500 mt-1">{stay.bookingRef}</div>}
        </div>
    );
};

const ActivityItem = ({ activity }) => {
    return (
        <div className="flex gap-3 mb-3 items-start">
            <div className="mt-1 p-1.5 bg-gray-100 rounded-full text-gray-600">
                {activity.icon}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{activity.time}</span>
                    <span className="text-sm font-medium text-gray-900">{activity.title}</span>
                    {activity.status === 'suggested' && <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">提案</span>}
                </div>
                <div className="text-xs text-gray-500">{activity.description}</div>
            </div>
        </div>
    );
};

export default function TravelApp() {
    const [activeTab, setActiveTab] = useState('timeline');
    const [expandedDay, setExpandedDay] = useState('12/28');

    const toggleDay = (date) => {
        setExpandedDay(expandedDay === date ? null : date);
    };

    const totalPrice = initialItinerary.reduce((acc, day) => {
        // 概算の合計金額計算ロジックを入れる場合はここ
        return acc;
    }, 0);

    return (
        <div className="max-w-md mx-auto bg-gray-50 h-screen flex flex-col font-sans text-gray-900">
            {/* Header */}
            <header className="bg-teal-700 text-white p-4 shadow-md sticky top-0 z-10">
                <div className="flex justify-between items-center mb-1">
                    <h1 className="text-lg font-bold flex items-center gap-2">
                        <Plane className="rotate-[-45deg]" size={20} />
                        Tabi Log
                    </h1>
                    <span className="text-xs bg-teal-800 px-2 py-1 rounded">2025-2026</span>
                </div>
                <div className="text-sm opacity-90">飛騨高山・下呂温泉・名古屋の旅</div>
            </header>

            {/* Tabs */}
            <div className="flex bg-white shadow-sm">
                <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'timeline' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500'}`}
                >
                    タイムライン
                </button>
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'summary' ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500'}`}
                >
                    予約一覧
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'timeline' ? (
                    <div className="space-y-4">
                        {initialItinerary.map((day) => (
                            <div key={day.date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <button
                                    onClick={() => toggleDay(day.date)}
                                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center justify-center bg-teal-100 text-teal-800 w-12 h-12 rounded-lg">
                                            <span className="text-xs font-bold">{day.date}</span>
                                            <span className="text-sm font-bold">{day.dayOfWeek}</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-gray-800">{day.title}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <MapPin size={10} />
                                                {day.location}
                                            </div>
                                        </div>
                                    </div>
                                    {expandedDay === day.date ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>

                                {expandedDay === day.date && (
                                    <div className="p-4 border-t border-gray-100 bg-white animation-fade-in">
                                        {/* Transports */}
                                        {day.transports.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">移動</h3>
                                                {day.transports.map((t, i) => (
                                                    <TransportCard key={i} segment={t} />
                                                ))}
                                            </div>
                                        )}

                                        {/* Activities */}
                                        {day.activities.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">アクティビティ</h3>
                                                <div className="pl-2 border-l-2 border-gray-100 ml-1">
                                                    {day.activities.map((a, i) => (
                                                        <ActivityItem key={i} activity={a} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Stay */}
                                        {day.stay && (
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">宿泊</h3>
                                                <StayCard stay={day.stay} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Suggestion Box */}
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-900 text-sm">
                            <div className="flex items-center gap-2 font-bold mb-2">
                                <AlertCircle size={16} />
                                <span>プランナーからのアドバイス</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                                <li>12/30に新穂高ロープウェイを組み込みました。そのため、下呂への移動は夕方になります。</li>
                                <li>白川郷のバス（12/29）は非常に混雑します。Webでの早めの予約を強く推奨します。</li>
                                <li>特急ひだ（12/30, 12/31）の指定席手配をお忘れなく。</li>
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-600" />
                                確定済みの予約 (Email連携)
                            </h2>
                            <div className="space-y-3">
                                {initialItinerary.flatMap(day =>
                                    [...day.transports, day.stay]
                                        .filter((item) => item && item.status === 'confirmed')
                                        .map((item, i) => (
                                            <div key={i} className="bg-white p-3 rounded border-l-4 border-green-500 shadow-sm">
                                                <div className="font-bold text-gray-800">{item.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">{item.details}</div>
                                                {item.bookingRef && (
                                                    <div className="mt-2 text-xs font-mono bg-gray-100 inline-block px-1 rounded text-gray-600">
                                                        {item.bookingRef}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                                <AlertCircle size={16} className="text-amber-500" />
                                要手配・確認
                            </h2>
                            <div className="space-y-3">
                                {initialItinerary.flatMap(day =>
                                    day.transports
                                        .filter(t => t.status === 'suggested' || t.status === 'planned')
                                        .map((item, i) => (
                                            <div key={i} className="bg-white p-3 rounded border-l-4 border-amber-400 shadow-sm flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-gray-800">{item.name}</div>
                                                    <div className="text-xs text-gray-500">{day.date} {item.departureTime}発</div>
                                                </div>
                                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">未予約</span>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
