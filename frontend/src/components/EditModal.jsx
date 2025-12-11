import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Save, MapPin, Navigation, Calendar } from 'lucide-react';

/**
 * EditModal with From/To fields for transport events
 * - From: Auto-filled with previous event's location (read-only display)
 * - To: Google Places Autocomplete suggestions
 * - Date picker for moving events to different days
 */
const EditModal = ({ isOpen, onClose, item, onSave, onDelete, previousEvent, availableDates = [], currentDate }) => {
    const [formData, setFormData] = useState({});
    const [toSuggestions, setToSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedDate, setSelectedDate] = useState(currentDate || '');
    const toInputRef = useRef(null);
    const suggestionsTimeoutRef = useRef(null);

    useEffect(() => {
        if (item) {
            setFormData({ ...item });
        } else {
            setFormData({ type: 'activity', category: 'sightseeing', status: 'planned', time: '10:00', name: '' });
        }
        setSelectedDate(currentDate || '');
        setToSuggestions([]);
        setShowSuggestions(false);
    }, [item, isOpen, currentDate]);

    // Check if this is a transport category
    const isTransport = ['flight', 'train', 'bus'].includes(formData.category);

    // Get "from" location from previous event
    const fromLocation = previousEvent?.to || previousEvent?.address || previousEvent?.name || '';

    // Fetch Google Places autocomplete suggestions
    const fetchPlaceSuggestions = async (query) => {
        if (!query || query.length < 2) {
            setToSuggestions([]);
            return;
        }

        // Note: Direct Google Places API call would fail due to CORS.
        // Using fallback with common Japanese locations
        const commonPlaces = [
            '中部国際空港 (セントレア)',
            '名古屋駅',
            '那覇空港',
            '東京駅',
            '新宿駅',
            '京都駅',
            '大阪駅',
            '博多駅',
            '札幌駅',
            '高山駅',
            '下呂駅',
            '飛騨古川駅'
        ].filter(p => p.toLowerCase().includes(query.toLowerCase()));

        setToSuggestions(commonPlaces.slice(0, 5));
    };

    // Handle "to" input change with debounce
    const handleToChange = (e) => {
        const value = e.target.value;
        setFormData({ ...formData, to: value, name: value });

        // Debounce the API call
        if (suggestionsTimeoutRef.current) {
            clearTimeout(suggestionsTimeoutRef.current);
        }
        suggestionsTimeoutRef.current = setTimeout(() => {
            fetchPlaceSuggestions(value);
            setShowSuggestions(true);
        }, 300);
    };

    // Select a suggestion
    const selectSuggestion = (suggestion) => {
        setFormData({ ...formData, to: suggestion, name: suggestion });
        setShowSuggestions(false);
        setToSuggestions([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100">{item ? '予定を編集' : '新しい予定'}</h3>
                    <button onClick={onClose} aria-label="閉じる" className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 touch-manipulation">
                        <X size={20} className="text-gray-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-4 overflow-y-auto space-y-4 flex-1">
                    {/* Category & Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">カテゴリ</label>
                            <select
                                value={formData.category || ''}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all touch-manipulation"
                            >
                                <option value="flight">✈️ 飛行機</option>
                                <option value="train">🚄 電車</option>
                                <option value="bus">🚌 バス</option>
                                <option value="sightseeing">📍 観光</option>
                                <option value="meal">🍽️ 食事</option>
                                <option value="hotel">🏨 宿泊</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">ステータス</label>
                            <select
                                value={formData.status || ''}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all touch-manipulation"
                            >
                                <option value="planned">📋 計画中</option>
                                <option value="confirmed">✅ 確定</option>
                                <option value="suggested">💡 候補</option>
                            </select>
                        </div>
                    </div>

                    {/* Date Picker - Only for editing existing events when multiple dates available */}
                    {item && availableDates.length > 1 && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold mb-3">
                                <Calendar size={16} />
                                <span>日程を変更</span>
                            </div>
                            <select
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all touch-manipulation"
                            >
                                {availableDates.map((date, i) => (
                                    <option key={i} value={date.value}>
                                        {date.label}
                                    </option>
                                ))}
                            </select>
                            {selectedDate !== currentDate && (
                                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                    ※ この予定は選択した日に移動されます
                                </p>
                            )}
                        </div>
                    )}

                    {/* From/To Section - Only for Transport */}
                    {isTransport && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 space-y-3 border border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                                <Navigation size={16} />
                                <span>移動区間</span>
                            </div>

                            {/* From (Read-only) */}
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">出発地 (From)</label>
                                <div className="w-full p-3 bg-gray-100 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-sm">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span>{fromLocation || '(前のイベントから取得)'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* To (With Autocomplete) */}
                            <div className="relative">
                                <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">到着地 (To)</label>
                                <input
                                    ref={toInputRef}
                                    type="text"
                                    value={formData.to || ''}
                                    onChange={handleToChange}
                                    onFocus={() => setShowSuggestions(toSuggestions.length > 0)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    className="w-full p-3 bg-white dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 font-bold text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all touch-manipulation"
                                    placeholder="到着地を入力..."
                                />

                                {/* Autocomplete Suggestions */}
                                {showSuggestions && toSuggestions.length > 0 && (
                                    <div className="absolute z-modal-content w-full mt-1 bg-white dark:bg-slate-700 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 max-h-48 overflow-y-auto">
                                        {toSuggestions.map((suggestion, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-600 text-sm text-gray-700 dark:text-slate-200 flex items-center gap-2 border-b border-gray-100 dark:border-slate-600 last:border-0"
                                                onMouseDown={() => selectSuggestion(suggestion)}
                                            >
                                                <MapPin size={14} className="text-indigo-500 shrink-0" />
                                                <span>{suggestion}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Name - For non-transport, or show as secondary for transport */}
                    {!isTransport && (
                        <div>
                            <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">名称</label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 font-bold text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all touch-manipulation"
                                placeholder="予定の名前"
                            />
                        </div>
                    )}

                    {/* Time - Stack on very narrow screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">開始時刻</label>
                            <input
                                type="time"
                                value={formData.time || ''}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 text-base font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all touch-manipulation"
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">終了時刻</label>
                            <input
                                type="time"
                                value={formData.endTime || ''}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 text-base font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all touch-manipulation"
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-2 block">詳細・メモ</label>
                        <textarea
                            value={formData.details || formData.description || ''}
                            onChange={e => setFormData({ ...formData, details: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 h-24 resize-none text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all touch-manipulation"
                            placeholder="予約番号や注意事項など"
                        />
                    </div>


                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex gap-3 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
                    {item && onDelete && (
                        <button
                            onClick={() => onDelete(item.id)}
                            aria-label="削除"
                            className="p-3.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors touch-manipulation active:scale-95"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        onClick={() => {
                            // For transport, ensure 'place' is set to 'from' location
                            const dataToSave = { ...formData };
                            if (isTransport && fromLocation) {
                                dataToSave.place = fromLocation;
                            }
                            // Include new date if event is being moved
                            if (selectedDate && selectedDate !== currentDate) {
                                dataToSave.newDate = selectedDate;
                                dataToSave.originalDate = currentDate;
                            }
                            onSave(dataToSave);
                        }}
                        aria-label="保存"
                        className="flex-1 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2 transition-colors touch-manipulation active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                    >
                        <Save size={18} /> 保存する
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;
