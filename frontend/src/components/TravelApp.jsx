import React, { useState, useEffect, useMemo } from 'react';
import {
    Plane, Train, Bus, MapPin, BedDouble, Calendar,
    Sun, Cloud, Snowflake, Camera, ArrowRight, Utensils,
    CheckCircle2, Circle, AlertCircle, Copy, Ticket, Mountain,
    Edit2, Plus, X, Save, Trash2, Moon, Menu
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
                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">カテゴリ</label>
                            <select value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800">
                                <option value="flight">飛行機</option>
                                <option value="train">電車</option>
                                <option value="bus">バス</option>
                                <option value="sightseeing">観光</option>
                                <option value="meal">食事</option>
                                <option value="hotel">宿泊</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">ステータス</label>
                            <select value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800">
                                <option value="planned">計画中</option>
                                <option value="confirmed">確定</option>
                                <option value="suggested">候補</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">名称</label>
                        <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 font-bold" placeholder="予定の名前" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">開始時刻</label>
                            <input type="time" value={formData.time || ''} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">終了時刻</label>
                            <input type="time" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">詳細・メモ</label>
                        <textarea value={formData.details || formData.description || ''} onChange={e => setFormData({ ...formData, details: e.target.value, description: e.target.value })} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-800 h-24 resize-none" placeholder="予約番号や注意事項など" />
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
// MAIN APP
// ============================================================================

// API URL - same origin for GAS deployment
const API_BASE = typeof google !== 'undefined'
    ? '' // GAS環境: 同一オリジン
    : 'https://script.google.com/macros/s/AKfycbzWeb3xkGQyZ8lG3LA1LkJboSVoAV8vMAUoNHY93sXwzhv7_JOFRAVVHJdznDkc-gBStQ/exec';

export default function TravelApp() {
    const [itinerary, setItinerary] = useState([]);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [auth, setAuth] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const selectedDay = useMemo(() => itinerary.find(d => d.id === selectedDayId), [itinerary, selectedDayId]);
    const sortedEvents = useMemo(() => {
        if (!selectedDay) return [];
        return [...selectedDay.events].sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
    }, [selectedDay]);
    const dayIndex = useMemo(() => itinerary.findIndex(d => d.id === selectedDayId), [itinerary, selectedDayId]);

    // Auth check
    useEffect(() => {
        if (sessionStorage.getItem('trip_auth') === 'true') setAuth(true);
    }, []);

    // Fetch data from Spreadsheet via GAS API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Try GAS API first
                const url = API_BASE ? `${API_BASE}?action=getData` : '?action=getData';
                const res = await fetch(url);
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                if (data && data.length > 0) {
                    setItinerary(data);
                    setSelectedDayId(data[0].id);
                } else {
                    throw new Error('No data');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                // Fallback to hardcoded data
                setItinerary(initialItinerary);
                setSelectedDayId(initialItinerary[0].id);
                setError('スプレッドシートから読み込めませんでした。ローカルデータを使用します。');
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
            const url = API_BASE || ''; // If empty, using relative path (not possible in current setup due to different domains, so must use full URL if dev or relative if deployed on same origin... wait. Code.js handles POST. If local dev, we need URL. If on GAS, we might need absolute URL too unless relative works?)
            // Actually, for GAS web app, POST usually needs to go to the exec URL.
            // Our API_BASE handles this.

            const targetUrl = API_BASE ? API_BASE : window.location.href; // Fallback for deployed

            // Use fetch with no-cors if needed? No, we need response.
            // GAS POST requires text/plain or application/json.
            // We set CORS in GAS? No, GAS auto-handles CORS if we return correct headers.
            // ContentService returns JSON, so we should be good.

            const res = await fetch(targetUrl, {
                method: 'POST',
                body: JSON.stringify(newItinerary)
            });

            const result = await res.json();
            if (result.status !== 'success') throw new Error(result.message || 'Save failed');

            // Success indication?
            // Maybe just clear saving state
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
        if (!window.confirm("削除しますか？")) return;
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
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-6">
                <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Plane className="text-white -rotate-45" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Winter Journey</h1>
                    <p className="text-gray-500 mb-6">Okinawa ✈ Takayama</p>
                    <input
                        type="password" autoFocus placeholder="パスコード"
                        onChange={e => e.target.value === '2025' && (setAuth(true), sessionStorage.setItem('trip_auth', 'true'))}
                        className="w-full p-4 text-center text-2xl tracking-[0.5em] bg-gray-100 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
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
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-6">
                <div className="text-center text-white">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-bold">スプレッドシートからデータを読み込み中...</p>
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
        <div className="min-h-screen bg-gray-100 lg:flex">
            {SavingOverlay}
            {ErrorBanner}

            {/* ========== DESKTOP SIDEBAR (lg+) ========== */}
            <aside className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-40">
                <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Plane size={20} className="-rotate-45" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Winter Journey</h1>
                            <p className="text-xs text-blue-200">Okinawa ✈ Takayama</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {itinerary.map((day, idx) => (
                        <button
                            key={day.id}
                            onClick={() => setSelectedDayId(day.id)}
                            className={`w-full text-left p-4 rounded-2xl transition-all ${selectedDayId === day.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold">Day {idx + 1}</span>
                                <span className="text-xs opacity-70">{day.date} ({day.dayOfWeek})</span>
                            </div>
                            <p className={`text-sm truncate ${selectedDayId === day.id ? 'text-blue-100' : 'text-gray-500'}`}>{day.title}</p>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${isEditMode ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        <Edit2 size={18} /> {isEditMode ? '編集モード ON' : '編集モード'}
                    </button>
                </div>
            </aside>

            {/* ========== MAIN CONTENT ========== */}
            <main className="flex-1 lg:ml-80 pb-24 lg:pb-8">

                {/* Mobile/Tablet Header */}
                <div className="lg:hidden bg-gradient-to-br from-blue-600 to-indigo-800 p-4 sm:p-6 text-white pt-8 sm:pt-10 pb-14 sm:pb-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Plane size={100} className="sm:w-32 sm:h-32" />
                    </div>
                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h1 className="text-xl sm:text-2xl font-bold mb-1">Winter Journey</h1>
                        <p className="opacity-90 text-sm">Okinawa ✈ Takayama</p>
                    </div>
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isEditMode ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}
                    >
                        <Edit2 size={18} />
                    </button>
                </div>

                {/* Date Tabs - Mobile/Tablet */}
                <div className="lg:hidden px-2 sm:px-4 -mt-8 relative z-10 max-w-3xl mx-auto">
                    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                        {itinerary.map(day => (
                            <button
                                key={day.id}
                                onClick={() => setSelectedDayId(day.id)}
                                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-18 sm:w-16 sm:h-20 rounded-2xl shadow-sm transition-all duration-300 ${selectedDayId === day.id
                                    ? "bg-white text-blue-600 ring-2 ring-blue-500 -translate-y-1"
                                    : "bg-white/80 text-gray-500 hover:bg-white"
                                    }`}
                            >
                                <span className="text-xs font-medium">{day.dayOfWeek}</span>
                                <span className="text-lg font-bold">{day.date.split('/')[1]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                {selectedDay && (
                    <div className="px-4 sm:px-6 lg:px-8 pt-4 max-w-4xl mx-auto">

                        {/* Summary Card */}
                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm mb-6 border border-gray-100">
                            <div className="flex justify-between items-start mb-3 gap-4">
                                <div className="flex-1">
                                    <div className="lg:hidden text-xs text-blue-600 font-bold mb-1">Day {dayIndex + 1}</div>
                                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">{selectedDay.title}</h2>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1">
                                        <MapPin size={14} /> {selectedDay.location}
                                    </p>
                                </div>
                                <div className="flex flex-col items-center pl-4 border-l border-gray-100">
                                    {getWeatherIcon(selectedDay.weather?.condition)}
                                    <span className="text-sm font-bold text-gray-700 mt-1">{selectedDay.weather?.temp}</span>
                                </div>
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 leading-relaxed bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100">
                                {selectedDay.summary}
                            </p>
                        </div>

                        {/* Timeline - Responsive Grid for Tablet+ */}
                        <div className="relative pl-4 sm:pl-6 space-y-4 sm:space-y-6">
                            <div className="absolute left-4 sm:left-6 top-2 bottom-4 w-0.5 bg-gray-200"></div>

                            {sortedEvents.map(event => (
                                <div key={event.id} className="relative pl-6 sm:pl-8">
                                    <div className={`absolute left-0 top-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-4 border-gray-100 bg-white flex items-center justify-center shadow-sm z-10 -translate-x-1/2 ${event.type === 'stay' ? 'ring-2 ring-indigo-100' : ''}`}>
                                        {getIcon(event.category, event.type)}
                                    </div>

                                    <div
                                        onClick={isEditMode ? () => { setEditItem(event); setModalOpen(true); } : undefined}
                                        className={`rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 transition bg-white ${event.type === 'stay' ? 'bg-indigo-50/50 border-indigo-100' : ''} ${isEditMode ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-lg sm:text-xl font-bold text-gray-800 font-mono">{event.time}</span>
                                                {event.endTime && (
                                                    <>
                                                        <ArrowRight size={12} className="text-gray-400" />
                                                        <span className="text-sm text-gray-500 font-mono">{event.endTime}</span>
                                                    </>
                                                )}
                                            </div>
                                            <StatusBadge status={event.status} />
                                        </div>

                                        <h3 className="font-bold text-gray-800 text-lg sm:text-xl mb-1">{event.name}</h3>

                                        {event.type === 'transport' && event.place && event.to && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 flex-wrap">
                                                <span>{event.place}</span>
                                                <ArrowRight size={14} />
                                                <span>{event.to}</span>
                                            </div>
                                        )}

                                        {(event.description || event.details) && (
                                            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-sm text-gray-600 space-y-1">
                                                {event.description && <p>{event.description}</p>}
                                                {event.details && <p>{event.details}</p>}
                                            </div>
                                        )}

                                        {event.bookingRef && (
                                            <div
                                                onClick={(e) => { e.stopPropagation(); handleCopy(event.bookingRef); }}
                                                className="mt-3 bg-white border border-gray-200 rounded-lg p-2 sm:p-3 flex items-center justify-between cursor-pointer active:bg-gray-100 group"
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
                                <div className="pl-6 sm:pl-8 pt-4">
                                    <button
                                        onClick={() => { setEditItem(null); setModalOpen(true); }}
                                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:text-blue-500 hover:border-blue-300 transition flex items-center justify-center gap-2"
                                    >
                                        <Plus size={20} /> 予定を追加
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="h-20"></div>
                    </div>
                )}
            </main>

            {/* Bottom Nav - Mobile/Tablet Only */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-6 py-3 flex justify-around items-center z-30">
                <button className="flex flex-col items-center gap-1 text-blue-600">
                    <Calendar size={20} />
                    <span className="text-[10px] font-bold">旅程</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
                    <Ticket size={20} />
                    <span className="text-[10px] font-bold">チケット</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
                    <MapPin size={20} />
                    <span className="text-[10px] font-bold">マップ</span>
                </button>
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
