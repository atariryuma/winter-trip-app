import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Plane, Train, Bus, MapPin, BedDouble, Calendar,
    Sun, Cloud, Snowflake, Camera, ArrowRight, Utensils,
    CheckCircle2, Circle, AlertCircle, Copy, Ticket, Mountain,
    Edit2, Plus, X, Save, Trash2, Moon, Menu, Smartphone,
    Settings, Download, Upload, Clock, ChevronRight, Luggage, Phone
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
        summary: '日本を縦断する移動日。那覇から名古屋を経て、雪の飛騨高山へ。移動そのものを楽しむ一日。',
        events: [
            { id: 'e1-1', type: 'transport', category: 'flight', name: 'SKY 552便', time: '10:05', endTime: '12:00', place: '那覇空港', to: '中部国際空港', status: 'confirmed', details: '座席: 1C 2F (フォワードシート) / 予約番号: 1140' },
            { id: 'e1-2', type: 'transport', category: 'train', name: '名鉄ミュースカイ', time: '13:17', endTime: '13:54', place: '中部国際空港', to: '名鉄名古屋', status: 'planned', details: '移動・昼食（駅弁推奨）' },
            { id: 'e1-3', type: 'transport', category: 'train', name: '特急ひだ 13号', time: '14:48', endTime: '17:13', place: '名古屋', to: '高山', status: 'confirmed', details: '1号車(グリーン/禁煙) 7番A-D席 / 予約番号: 49798' },
            { id: 'e1-4', type: 'activity', category: 'meal', name: '高山到着・夕食', time: '17:30', description: 'ホテルチェックイン後、飛騨牛ディナーへ', status: 'planned' },
            { id: 'e1-5', type: 'stay', category: 'hotel', name: '力車イン', time: '15:00', checkIn: '15:00-18:00', status: 'confirmed', bookingRef: '6321591551', details: '和室 ファミリールーム 101 BAMBOO' },
        ]
    },
    {
        id: 'day-2',
        date: '12/29', dayOfWeek: '月', title: '世界遺産・白川郷の雪景色',
        location: '高山 ⇔ 白川郷',
        weather: { temp: '-2°C', condition: 'Snow' },
        summary: '白銀の世界遺産、白川郷へ。合掌造りの集落と雪景色を堪能し、高山の古い町並みで食べ歩き。',
        events: [
            { id: 'e2-1', type: 'activity', category: 'transfer', name: '宿移動', time: '08:30', description: '力車インをチェックアウトし、荷物を次のホテルへ預ける', status: 'planned' },
            { id: 'e2-2', type: 'transport', category: 'bus', name: '濃飛バス（往路）', time: '08:50', endTime: '09:40', place: '高山濃飛バスセンター', to: '白川郷', status: 'suggested', details: '※要Web予約確認' },
            { id: 'e2-3', type: 'activity', category: 'sightseeing', name: '白川郷 散策', time: '10:00', description: '展望台からの景色、合掌造り民家園など', status: 'planned' },
            { id: 'e2-4', type: 'transport', category: 'bus', name: '濃飛バス（復路）', time: '13:15', endTime: '14:05', place: '白川郷', to: '高山', status: 'suggested', details: '明るいうちに高山へ戻る' },
            { id: 'e2-5', type: 'activity', category: 'sightseeing', name: '古い町並み散策', time: '15:00', description: 'さんまち通りで食べ歩き・お土産購入', status: 'planned' },
            { id: 'e2-6', type: 'stay', category: 'hotel', name: 'ホテル ウッド 高山', time: '15:00', checkIn: '15:00', status: 'confirmed', bookingRef: '5444724807', details: 'スタンダード ツインルーム 2部屋' },
        ]
    },
    {
        id: 'day-3',
        date: '12/30', dayOfWeek: '火', title: '北アルプスの絶景と下呂温泉',
        location: '高山 → 新穂高 → 下呂',
        weather: { temp: '-5°C', condition: 'Clear' },
        summary: '新穂高ロープウェイで雲上の絶景へ。その後、日本三名泉の一つ、下呂温泉で旅の疲れを癒やす。',
        events: [
            { id: 'e3-1', type: 'activity', category: 'sightseeing', name: '宮川朝市（早朝）', time: '07:30', description: '出発前に少しだけ朝市を覗く', status: 'suggested' },
            { id: 'e3-2', type: 'transport', category: 'bus', name: '濃飛バス（新穂高線）', time: '08:40', endTime: '10:16', place: '高山BC', to: '新穂高ロープウェイ', status: 'suggested', details: '2日券などのお得な切符を検討' },
            { id: 'e3-3', type: 'transport', category: 'other', name: '新穂高ロープウェイ', time: '10:30', endTime: '12:00', place: '山麓', to: '山頂展望台', status: 'suggested', details: '標高2156mの雲上の世界へ' },
            { id: 'e3-4', type: 'transport', category: 'bus', name: '濃飛バス（戻り）', time: '12:55', endTime: '14:31', place: '新穂高ロープウェイ', to: '高山BC', status: 'suggested' },
            { id: 'e3-5', type: 'transport', category: 'train', name: '特急ひだ 14号', time: '15:34', endTime: '16:17', place: '高山', to: '下呂', status: 'suggested', details: '※当初予定(12:35)より変更してロープウェイ時間を確保' },
            { id: 'e3-6', type: 'stay', category: 'hotel', name: '温泉宿廣司', time: '17:00', checkIn: '17:00', status: 'confirmed', bookingRef: '6178769046', details: '飛騨牛朴葉味噌定食セット / 和室' },
        ]
    },
    {
        id: 'day-4',
        date: '12/31', dayOfWeek: '水', title: '日本三名泉と名古屋の年越し',
        location: '下呂 → 名古屋',
        weather: { temp: '5°C', condition: 'Sunny' },
        summary: '温泉地ならではの朝を迎え、名古屋へ移動。大晦日の名古屋で年越しそばを楽しみ、新年を迎える準備。',
        events: [
            { id: 'e4-1', type: 'activity', category: 'sightseeing', name: '下呂温泉街 散策', time: '10:00', description: '下呂プリン、足湯めぐり、温泉寺', status: 'planned' },
            { id: 'e4-2', type: 'transport', category: 'train', name: '特急ひだ 8号', time: '12:22', endTime: '14:02', place: '下呂', to: '名古屋', status: 'planned', details: '指定席の予約推奨' },
            { id: 'e4-3', type: 'activity', category: 'sightseeing', name: '名古屋城（外観）', time: '15:30', description: '※年末休園の可能性あり。名城公園散策。', status: 'planned' },
            { id: 'e4-4', type: 'activity', category: 'meal', name: '年越しそば（きしめん）', time: '19:00', description: '名古屋駅周辺で夕食', status: 'planned' },
            { id: 'e4-5', type: 'stay', category: 'hotel', name: 'ホテルリブマックス名古屋', time: '15:00', checkIn: '15:00-22:00', status: 'confirmed', bookingRef: '5704883964', details: 'ファミリールーム 禁煙' },
        ]
    },
    {
        id: 'day-5',
        date: '1/1', dayOfWeek: '木', title: '初詣と帰路',
        location: '名古屋 → 那覇',
        weather: { temp: '7°C', condition: 'Sunny' },
        summary: '新年の幕開けは熱田神宮で。名古屋めしを最後に味わい、思い出と共に沖縄へ帰還。',
        events: [
            { id: 'e5-1', type: 'activity', category: 'sightseeing', name: '熱田神宮 初詣', time: '09:00', description: '三種の神器を祀る神社。混雑必至のため早めに。', status: 'planned' },
            { id: 'e5-2', type: 'activity', category: 'meal', name: '名古屋めしランチ', time: '12:00', description: 'ひつまぶし または 味噌カツ', status: 'planned' },
            { id: 'e5-3', type: 'transport', category: 'train', name: '名鉄ミュースカイ', time: '15:00', endTime: '15:30', place: '名鉄名古屋', to: '中部国際空港', status: 'planned', details: '余裕を持って空港へ' },
            { id: 'e5-4', type: 'transport', category: 'flight', name: 'SKY 557便', time: '16:50', endTime: '19:20', place: '中部', to: '那覇', status: 'confirmed', details: '座席: 2F (フォワードシート) / 予約番号: 0753' },
        ]
    },
];

// ============================================================================
// PORTRAIT LOCK COMPONENT
// ============================================================================

const PortraitLock = () => (
    <div className="fixed inset-0 z-[10000] bg-slate-900 text-white flex flex-col items-center justify-center p-10 text-center hidden landscape:flex md:hidden">
        <Smartphone className="text-blue-500 mb-6 animate-pulse" size={64} style={{ transform: 'rotate(90deg)' }} />
        <h2 className="text-2xl font-bold mb-2">スマートフォンを<br />縦にしてください</h2>
        <p className="opacity-70 text-sm">このアプリは縦画面での利用に<br />最適化されています。</p>
    </div>
);

// ============================================================================
// UTILITIES
// ============================================================================

const generateId = () => Math.random().toString(36).substr(2, 9);

const getIcon = (category, type) => {
    if (type === 'stay' || category === 'hotel') return <BedDouble className="text-indigo-500" size={18} />;
    if (category === 'flight') return <Plane className="text-blue-500" size={18} />;
    if (category === 'train') return <Train className="text-emerald-500" size={18} />;
    if (category === 'bus') return <Bus className="text-orange-500" size={18} />;
    if (category === 'other') return <Mountain className="text-purple-500" size={18} />;
    if (category === 'meal') return <Utensils className="text-rose-500" size={18} />;
    if (category === 'sightseeing') return <Camera className="text-pink-500" size={18} />;
    return <MapPin className="text-gray-500" size={18} />;
};

const getWeatherIcon = (condition) => {
    switch (condition) {
        case 'Sunny': case 'Clear': return <Sun className="text-orange-400" size={32} />;
        case 'Cloudy': return <Cloud className="text-gray-400" size={32} />;
        case 'Snow': return <Snowflake className="text-blue-300" size={32} />;
        default: return <Sun className="text-orange-400" size={32} />;
    }
};

const StatusBadge = ({ status }) => {
    if (status === 'confirmed') return <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle2 size={12} /> 確定</span>;
    if (status === 'planned') return <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full"><Circle size={12} /> 計画中</span>;
    if (status === 'suggested') return <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full"><AlertCircle size={12} /> 候補</span>;
    return null;

};

const toMinutes = (timeStr) => {
    if (!timeStr) return 9999;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const toTimeStr = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const getMidTime = (t1, t2) => {
    if (!t1 && !t2) return '12:00';
    if (!t1) return toTimeStr(toMinutes(t2) - 60); // 1 hour before
    if (!t2) return toTimeStr(toMinutes(t1) + 60); // 1 hour after
    const m1 = toMinutes(t1);
    const m2 = toMinutes(t2);
    return toTimeStr(m1 + (m2 - m1) / 2);
};

// ============================================================================
// EDIT MODAL COMPONENT
// ============================================================================

const EditModal = ({ isOpen, onClose, item, onSave, onDelete }) => {
    const [formData, setFormData] = useState({});
    useEffect(() => {
        if (item) setFormData({ ...item });
        else setFormData({ type: 'activity', category: 'sightseeing', status: 'planned', time: '10:00', name: '' });
    }, [item, isOpen]);
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">{item ? '予定を編集' : '新しい予定'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-500" /></button>
                </div>
                <div className="p-4 overflow-y-auto space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">カテゴリ</label>
                            <select value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 text-sm">
                                <option value="flight">飛行機</option>
                                <option value="train">電車</option>
                                <option value="bus">バス</option>
                                <option value="sightseeing">観光</option>
                                <option value="meal">食事</option>
                                <option value="hotel">宿泊</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">ステータス</label>
                            <select value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 text-sm">
                                <option value="planned">計画中</option>
                                <option value="confirmed">確定</option>
                                <option value="suggested">候補</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">名称</label>
                        <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 font-bold text-sm" placeholder="予定の名前" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="min-w-0 overflow-hidden">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">開始時刻</label>
                            <input type="time" value={formData.time || ''} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 text-sm appearance-none" />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">終了時刻</label>
                            <input type="time" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 text-sm appearance-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">詳細・メモ</label>
                        <textarea value={formData.details || formData.description || ''} onChange={e => setFormData({ ...formData, details: e.target.value, description: e.target.value })} className="w-full p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 h-20 resize-none text-sm" placeholder="予約番号や注意事項など" />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-3">
                    {item && onDelete && (<button onClick={() => onDelete(item.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><Trash2 size={20} /></button>)}
                    <button onClick={() => onSave(formData)} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"><Save size={18} /> 保存する</button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// TICKET VIEW COMPONENT
// ============================================================================

const TicketList = ({ itinerary }) => {
    const tickets = useMemo(() => {
        return itinerary.flatMap(day =>
            day.events
                .filter(e => e.bookingRef || e.type === 'stay' || (e.type === 'transport' && e.status === 'confirmed'))
                .map(e => ({ ...e, date: day.date }))
        );
    }, [itinerary]);

    if (tickets.length === 0) return <div className="p-10 text-center text-gray-400 font-bold">表示できるチケット情報がありません</div>;

    return (
        <div className="space-y-4 pt-4 overflow-hidden">
            {tickets.map(t => (
                <div key={t.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.date} • {t.category}</span>
                            <h3 className="text-xl font-bold text-gray-800 mt-1">{t.name}</h3>
                        </div>
                        <div className="p-2 bg-gray-50 rounded-lg">
                            {getIcon(t.category, t.type)}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-2 border-t border-b border-gray-100 py-3">
                        <div>
                            <span className="text-xs text-gray-400 block mb-1">TIME</span>
                            <span className="text-lg font-mono font-bold text-gray-700">{t.time}{t.endTime && ` - ${t.endTime}`}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block mb-1">STATUS</span>
                            <StatusBadge status={t.status} />
                        </div>
                    </div>

                    {t.bookingRef && (
                        <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition" onClick={() => { navigator.clipboard.writeText(t.bookingRef); alert('予約番号をコピーしました'); }}>
                            <div>
                                <span className="text-[10px] text-blue-400 block uppercase font-bold">BOOKING REF</span>
                                <span className="font-mono font-black text-blue-600 text-lg tracking-widest">{t.bookingRef}</span>
                            </div>
                            <Copy size={16} className="text-blue-300" />
                        </div>
                    )}

                    {t.details && <p className="text-sm text-gray-500 mt-1">{t.details}</p>}
                </div>
            ))}
        </div>
    );
};

// ============================================================================
// MAP VIEW COMPONENT
// ============================================================================

const MapView = ({ mapUrl, itinerary }) => {
    const markers = useMemo(() => {
        return itinerary.flatMap(day => {
            const locs = [];
            // if(day.location) locs.push({name: day.location, type: 'day'}); // Too generic often
            day.events.forEach(e => {
                if (e.place) locs.push({ name: e.place, type: 'transport' });
                if (e.to) locs.push({ name: e.to, type: 'transport' });
                if (e.category === 'hotel') locs.push({ name: e.name, type: 'hotel' });
                if (e.category === 'sightseeing') locs.push({ name: e.name, type: 'sightseeing' });
            });
            return locs;
        }).filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
    }, [itinerary]);

    return (
        <div className="pt-4 space-y-4 overflow-hidden">
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 overflow-hidden mb-6">
                {mapUrl ? (
                    <div className="relative">
                        <img src={mapUrl} alt="Trip Map" className="w-full h-auto object-cover rounded-xl bg-gray-100 min-h-[200px]" />
                        <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] text-gray-500">Google Maps Data</div>
                    </div>
                ) : (
                    <div className="w-full h-48 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 flex-col gap-2 border-2 border-dashed border-gray-200">
                        <MapPin size={32} className="opacity-20" />
                        <span className="text-xs font-bold">マップ画像を生成できませんでした</span>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500" />
                    <h3 className="font-bold text-gray-800">スポット一覧</h3>
                </div>
                {markers.map((m, i) => (
                    <a
                        key={i}
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.name)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.type === 'hotel' ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                                {m.type === 'hotel' ? <BedDouble size={18} /> : (m.type === 'sightseeing' ? <Camera size={18} /> : <MapPin size={18} />)}
                            </div>
                            <div>
                                <div className="font-bold text-gray-700">{m.name}</div>
                                <div className="text-xs text-gray-400 uppercase font-bold">{m.type}</div>
                            </div>
                        </div>
                        <ArrowRight size={16} className="text-gray-300" />
                    </a>
                ))}
            </div>
        </div>
    );
};

// ============================================================================
// SETTINGS VIEW COMPONENT
// ============================================================================

const SettingsView = ({ itinerary, isDarkMode, setIsDarkMode, lastUpdate, setActiveTab }) => {
    const handleExportCSV = () => {
        // Convert itinerary to CSV
        const headers = ['日付', '曜日', 'タイトル', '場所', '天気', '気温', 'イベントID', 'タイプ', 'カテゴリ', '名前', '開始時刻', '終了時刻', 'ステータス', '詳細'];
        const rows = [];

        itinerary.forEach(day => {
            day.events.forEach(event => {
                rows.push([
                    day.date, day.dayOfWeek, day.title, day.location,
                    day.weather?.condition || '', day.weather?.temp || '',
                    event.id, event.type, event.category, event.name,
                    event.time || '', event.endTime || '', event.status || '',
                    event.details || event.description || ''
                ]);
            });
        });

        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `旅程_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportCSV = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        alert('CSV インポート機能は次のバージョンで実装予定です');
        e.target.value = '';
    };

    return (
        <div className="pt-4 space-y-4 overflow-hidden">
            {/* Quick Access */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm">便利ツール</h3>
                </div>
                <button onClick={() => setActiveTab('packing')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                        <Luggage size={20} className="text-orange-500" />
                        <span className="text-gray-700">パッキングリスト</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                </button>
                <button onClick={() => setActiveTab('emergency')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition border-t border-gray-50">
                    <div className="flex items-center gap-3">
                        <Phone size={20} className="text-red-500" />
                        <span className="text-gray-700">緊急連絡先</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                </button>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm">データ管理</h3>
                </div>
                <button onClick={handleExportCSV} className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                        <Download size={20} className="text-blue-500" />
                        <span className="text-gray-700">CSV ダウンロード</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                </button>
                <label className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer border-t border-gray-50">
                    <div className="flex items-center gap-3">
                        <Upload size={20} className="text-green-500" />
                        <span className="text-gray-700">CSV アップロード</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                    <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                </label>
                {lastUpdate && (
                    <div className="px-4 py-3 border-t border-gray-50 flex items-center gap-3">
                        <Clock size={20} className="text-gray-400" />
                        <div>
                            <span className="text-xs text-gray-400 block">最終更新</span>
                            <span className="text-sm text-gray-600">{lastUpdate}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Appearance */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm">外観</h3>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Moon size={20} className="text-indigo-500" />
                        <span className="text-gray-700">ダークモード</span>
                    </div>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* App Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm">アプリ情報</h3>
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-gray-700">バージョン</span>
                    <span className="text-gray-400 text-sm">1.0.0</span>
                </div>
                <a href="https://github.com/atariryuma/winter-trip-app" target="_blank" rel="noopener noreferrer" className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 border-t border-gray-50">
                    <span className="text-gray-700">GitHub</span>
                    <ChevronRight size={18} className="text-gray-300" />
                </a>
            </div>

            {/* Hint */}
            <div className="text-center text-xs text-gray-400 py-4">
                💡 カードを編集するには右上の編集ボタンを押してください
            </div>
        </div>
    );
};

// ============================================================================
// PACKING LIST COMPONENT
// ============================================================================

const defaultPackingItems = [
    { id: 'p1', category: 'documents', name: 'パスポート', packed: false },
    { id: 'p2', category: 'documents', name: '航空券（eチケット）', packed: false },
    { id: 'p3', category: 'documents', name: 'ホテル予約確認書', packed: false },
    { id: 'p4', category: 'documents', name: '運転免許証', packed: false },
    { id: 'p5', category: 'documents', name: '保険証', packed: false },
    { id: 'p6', category: 'clothes', name: '冬用コート', packed: false },
    { id: 'p7', category: 'clothes', name: 'セーター/フリース', packed: false },
    { id: 'p8', category: 'clothes', name: '長袖シャツ', packed: false },
    { id: 'p9', category: 'clothes', name: 'ズボン', packed: false },
    { id: 'p10', category: 'clothes', name: '下着・靴下', packed: false },
    { id: 'p11', category: 'clothes', name: '防寒手袋', packed: false },
    { id: 'p12', category: 'clothes', name: 'マフラー/ネックウォーマー', packed: false },
    { id: 'p13', category: 'clothes', name: 'ニット帽', packed: false },
    { id: 'p14', category: 'electronics', name: 'スマートフォン', packed: false },
    { id: 'p15', category: 'electronics', name: '充電器・ケーブル', packed: false },
    { id: 'p16', category: 'electronics', name: 'モバイルバッテリー', packed: false },
    { id: 'p17', category: 'electronics', name: 'カメラ', packed: false },
    { id: 'p18', category: 'toiletries', name: '歯ブラシ・歯磨き粉', packed: false },
    { id: 'p19', category: 'toiletries', name: 'シャンプー・リンス', packed: false },
    { id: 'p20', category: 'toiletries', name: '常備薬', packed: false },
    { id: 'p21', category: 'toiletries', name: 'スキンケア用品', packed: false },
    { id: 'p22', category: 'other', name: '折りたたみ傘', packed: false },
    { id: 'p23', category: 'other', name: 'エコバッグ', packed: false },
];

const categoryLabels = {
    documents: { label: '書類', icon: '📄' },
    clothes: { label: '衣類', icon: '👔' },
    electronics: { label: '電子機器', icon: '📱' },
    toiletries: { label: '洗面用具', icon: '🧴' },
    other: { label: 'その他', icon: '📦' }
};

const PackingList = () => {
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('packingList');
        return saved ? JSON.parse(saved) : defaultPackingItems;
    });

    useEffect(() => {
        localStorage.setItem('packingList', JSON.stringify(items));
    }, [items]);

    const toggleItem = (id) => {
        setItems(items.map(item => item.id === id ? { ...item, packed: !item.packed } : item));
    };

    const resetAll = () => {
        if (confirm('すべてのチェックをリセットしますか？')) {
            setItems(items.map(item => ({ ...item, packed: false })));
        }
    };

    const packedCount = items.filter(i => i.packed).length;
    const progress = Math.round((packedCount / items.length) * 100);

    const groupedItems = Object.keys(categoryLabels).map(cat => ({
        category: cat,
        ...categoryLabels[cat],
        items: items.filter(i => i.category === cat)
    }));

    return (
        <div className="pt-4 space-y-4 overflow-hidden">
            {/* Progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">パッキング進捗</span>
                    <span className="text-sm text-gray-500">{packedCount}/{items.length}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <button onClick={resetAll} className="mt-3 text-xs text-red-500 hover:underline">
                    すべてリセット
                </button>
            </div>

            {/* Categories */}
            {groupedItems.map(group => (
                <div key={group.category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <span>{group.icon}</span>
                        <h3 className="font-bold text-gray-800 text-sm">{group.label}</h3>
                        <span className="text-xs text-gray-400 ml-auto">
                            {group.items.filter(i => i.packed).length}/{group.items.length}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {group.items.map(item => (
                            <button
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition"
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${item.packed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                    {item.packed && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                                <span className={`text-gray-700 ${item.packed ? 'line-through text-gray-400' : ''}`}>{item.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ============================================================================
// EMERGENCY CONTACTS COMPONENT
// ============================================================================

const EmergencyContacts = () => {
    const emergencyData = [
        { type: 'section', title: '🚨 日本国内緊急番号' },
        { type: 'contact', name: '警察', number: '110', color: 'blue' },
        { type: 'contact', name: '救急・消防', number: '119', color: 'red' },
        { type: 'contact', name: '海上保安庁', number: '118', color: 'cyan' },
        { type: 'section', title: '🏥 医療・相談' },
        { type: 'contact', name: '救急相談 (東京)', number: '#7119', color: 'orange' },
        { type: 'contact', name: '子ども医療相談', number: '#8000', color: 'green' },
        { type: 'section', title: '📞 旅行関連' },
        { type: 'contact', name: 'JAF ロードサービス', number: '0570-00-8139', color: 'yellow' },
        { type: 'section', title: '👨‍👩‍👧‍👦 家族連絡先' },
        { type: 'info', text: '家族の連絡先を追加してください（次バージョンで編集可能）' },
    ];

    const handleCall = (number) => {
        window.location.href = `tel:${number.replace(/-/g, '')}`;
    };

    return (
        <div className="pt-4 space-y-4 overflow-hidden">
            {emergencyData.map((item, idx) => {
                if (item.type === 'section') {
                    return (
                        <div key={idx} className="px-1">
                            <h3 className="font-bold text-gray-700 text-sm">{item.title}</h3>
                        </div>
                    );
                }
                if (item.type === 'contact') {
                    return (
                        <button
                            key={idx}
                            onClick={() => handleCall(item.number)}
                            className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition"
                        >
                            <div>
                                <span className="font-bold text-gray-800">{item.name}</span>
                                <span className="text-gray-500 ml-2">{item.number}</span>
                            </div>
                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                📞 発信
                            </div>
                        </button>
                    );
                }
                if (item.type === 'info') {
                    return (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
                            {item.text}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};

// API URL - same origin for GAS deployment
// Server Communication Adapter
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
            const API_URL = 'https://script.google.com/macros/s/AKfycbzmeZyyhBmEAvCHk-AaQQzRgB0BIWczVOLmYD6SUZj7sUFWD0GUZuLOc0hQd33ha-Z8xg/exec';

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
            const API_URL = 'https://script.google.com/macros/s/AKfycbzmeZyyhBmEAvCHk-AaQQzRgB0BIWczVOLmYD6SUZj7sUFWD0GUZuLOc0hQd33ha-Z8xg/exec';

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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
    const [lastUpdate, setLastUpdate] = useState(() => localStorage.getItem('lastUpdate') || null);
    const longPressTimer = useRef(null);

    // Long-press handlers
    const handleTouchStart = (event) => {
        longPressTimer.current = setTimeout(() => {
            setEditItem(event);
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

    // Dark mode persistence
    useEffect(() => {
        localStorage.setItem('darkMode', isDarkMode);
    }, [isDarkMode]);

    // Fetch data from Spreadsheet via GAS API
    // Fetch data from Spreadsheet via GAS Adapter
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
    if (!auth) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl p-8 text-center shadow-2xl border border-white/20">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
                        <Plane className="text-white -rotate-45" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1 tracking-tight">Winter Journey</h1>
                    <p className="text-gray-500 mb-8 font-medium">Okinawa <span className="text-blue-400 mx-2">✈</span> Takayama</p>
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoFocus
                        placeholder="PASSCODE"
                        onChange={e => e.target.value === '2025' && (setAuth(true), sessionStorage.setItem('trip_auth', 'true'))}
                        className="w-full p-4 text-center text-3xl font-bold tracking-[0.5em] text-gray-900 bg-gray-50 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-normal placeholder:text-sm"
                    />
                </div>
            </div>
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
        <div className="min-h-[100dvh] bg-[#F0F2F5] flex justify-center">
            <PortraitLock />
            {SavingOverlay}
            {ErrorBanner}

            <div className="w-full max-w-[600px] bg-white shadow-2xl min-h-[100dvh] relative flex flex-col overflow-x-hidden">

                {/* ========== HEADER ========== */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-6 text-white pt-10 pb-16 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Plane size={140} className="transform rotate-[-10deg] translate-x-4 translate-y-4" />
                    </div>
                    <div className="relative z-10 mx-auto">
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

                {/* ========== DATE TABS (Only for Timeline) ========== */}
                {activeTab === 'timeline' && (
                    <div className="px-4 -mt-6 relative z-20 mb-2">
                        <div className="flex flex-wrap gap-2 pb-2 pt-1">
                            {itinerary.map(day => (
                                <button
                                    key={day.id}
                                    onClick={() => setSelectedDayId(day.id)}
                                    className={`flex-shrink-0 snap-center flex flex-col items-center justify-center w-16 h-16 rounded-2xl shadow-sm transition-all duration-300 border border-gray-100/50 ${selectedDayId === day.id
                                        ? "bg-white text-blue-600 ring-2 ring-blue-500/30 shadow-md"
                                        : "bg-white/90 text-gray-500 hover:bg-white hover:shadow-md"
                                        }`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{day.dayOfWeek}</span>
                                    <span className="text-lg font-black leading-none mt-0.5">{day.date.split('/')[1]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ========== MAIN CONTENT ========== */}
                <main className="flex-1 px-4 pb-24">

                    {/* Content Area */}
                    {activeTab === 'timeline' && selectedDay && (
                        <div className="pt-4 overflow-hidden">

                            {/* Summary Card */}
                            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 border border-gray-100">
                                <div className="flex justify-between items-start mb-3 gap-4">
                                    <div className="flex-1">
                                        <div className="lg:hidden text-xs text-blue-600 font-bold mb-1">Day {dayIndex + 1}</div>
                                        <h2 className="text-lg font-bold text-gray-800">{selectedDay.title}</h2>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <MapPin size={14} /> {selectedDay.location}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center pl-4 border-l border-gray-100">
                                        {getWeatherIcon(selectedDay.weather?.condition)}
                                        <span className="text-sm font-bold text-gray-700 mt-1">{selectedDay.weather?.temp}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    {selectedDay.summary}
                                </p>
                            </div>

                            {/* Timeline - Simplified List for Mobile */}
                            <div className="space-y-4">
                                {sortedEvents.map((event, index) => (
                                    <div key={event.id} className="relative">

                                        {/* Insert Between Divider (Only in Edit Mode) */}
                                        {isEditMode && (
                                            <div
                                                className="h-6 -my-3 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group z-10 relative"
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

                                        <div
                                            onClick={isEditMode ? () => { setEditItem(event); setModalOpen(true); } : undefined}
                                            onTouchStart={() => handleTouchStart(event)}
                                            onTouchEnd={handleTouchEnd}
                                            onTouchMove={handleTouchEnd}
                                            className={`rounded-2xl p-5 shadow-sm border border-gray-100 transition bg-white relative overflow-hidden ${event.type === 'stay' ? 'bg-indigo-50/50 border-indigo-100' : ''} ${isEditMode ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`}
                                        >
                                            {/* Icon Background Decoration */}
                                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                                {getIcon(event.category, event.type)}
                                            </div>

                                            <div className="flex justify-between items-start mb-2 flex-wrap gap-2 relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${event.type === 'stay' ? 'bg-indigo-100 text-indigo-600' : (event.category === 'flight' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600')}`}>
                                                        {getIcon(event.category, event.type)}
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-lg font-bold text-gray-800 font-mono">{event.time}</span>
                                                        {event.endTime && (
                                                            <>
                                                                <ArrowRight size={12} className="text-gray-400" />
                                                                <span className="text-sm text-gray-500 font-mono">{event.endTime}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <StatusBadge status={event.status} />
                                            </div>

                                            <h3 className="font-bold text-gray-800 text-lg mb-1 mt-1">{event.name}</h3>

                                            {event.type === 'transport' && event.place && event.to && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 flex-wrap">
                                                    <span>{event.place}</span>
                                                    <ArrowRight size={14} />
                                                    <span>{event.to}</span>
                                                </div>
                                            )}

                                            {(event.description || event.details) && (
                                                <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                    {event.description && <p>{event.description}</p>}
                                                    {event.details && <p>{event.details}</p>}
                                                </div>
                                            )}

                                            {event.bookingRef && (
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(event.bookingRef); }}
                                                    className="mt-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-2 flex items-center justify-between cursor-pointer active:bg-gray-100 group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Ticket size={14} className="text-blue-500" />
                                                        <span className="text-xs text-gray-500">予約番号:</span>
                                                        <span className="font-mono font-bold text-gray-700">{event.bookingRef}</span>
                                                    </div>
                                                    <Copy size={14} className="text-gray-400 group-hover:text-blue-500" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isEditMode && (
                                    <div className="pt-4">
                                        {/* Final Append Button with Smart Time */}
                                        <button
                                            onClick={() => {
                                                const lastTime = sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].time : '09:00';
                                                const nextTime = toTimeStr(toMinutes(lastTime) + 60);
                                                setEditItem({ type: 'activity', category: 'sightseeing', status: 'planned', time: nextTime, name: '' });
                                                setModalOpen(true);
                                            }}
                                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:text-blue-500 hover:border-blue-300 transition flex items-center justify-center gap-2"
                                        >
                                            <Plus size={20} /> 予定を追加
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* NEW: Ticket View */}
                    {activeTab === 'tickets' && <TicketList itinerary={itinerary} />}

                    {/* NEW: Map View */}
                    {activeTab === 'map' && <MapView mapUrl={mapUrl} itinerary={itinerary} />}

                    {/* NEW: Settings View */}
                    {activeTab === 'settings' && <SettingsView itinerary={itinerary} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} lastUpdate={lastUpdate} setActiveTab={setActiveTab} />}

                    {/* NEW: Packing List View */}
                    {activeTab === 'packing' && <PackingList />}

                    {/* NEW: Emergency Contacts View */}
                    {activeTab === 'emergency' && <EmergencyContacts />}
                </main>

                {/* ========== BOTTOM NAV ========== */}
                <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 py-1 flex justify-around items-center z-30 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
                    <button
                        onClick={() => setActiveTab('timeline')}
                        className={`flex flex-col items-center gap-0.5 p-1 transition-transform active:scale-95 ${activeTab === 'timeline' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Calendar size={24} strokeWidth={activeTab === 'timeline' ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">旅程</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`flex flex-col items-center gap-0.5 p-1 transition-transform active:scale-95 ${activeTab === 'tickets' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Ticket size={24} strokeWidth={activeTab === 'tickets' ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">チケット</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`flex flex-col items-center gap-0.5 p-1 transition-transform active:scale-95 ${activeTab === 'map' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <MapPin size={24} strokeWidth={activeTab === 'map' ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">マップ</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex flex-col items-center gap-0.5 p-1 transition-transform active:scale-95 ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
                        <span className="text-[11px] font-bold">設定</span>
                    </button>
                </div>

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
