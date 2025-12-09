import React from 'react';
import { Luggage, ChevronRight, Phone, Download, Upload, Clock, Moon, Sparkles } from 'lucide-react';

const SettingsView = ({ itinerary, setItinerary, setSelectedDayId, isDarkMode, setIsDarkMode, lastUpdate, setActiveTab, onAutoFill }) => {
    const handleExportCSV = () => {
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
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n').map(line => {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    for (const char of line) {
                        if (char === '"') inQuotes = !inQuotes;
                        else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
                        else current += char;
                    }
                    result.push(current);
                    return result;
                });
                if (lines.length < 2) throw new Error('CSVが空です');
                const daysMap = {};
                lines.slice(1).filter(row => row[0]).forEach((row, idx) => {
                    const [date, dayOfWeek, title, location, weather, temp, eventId, type, category, name, time, endTime, status, details] = row;
                    if (!daysMap[date]) {
                        daysMap[date] = {
                            id: `day-${Object.keys(daysMap).length + 1}`,
                            date, dayOfWeek, title, location,
                            weather: { condition: weather, temp },
                            events: []
                        };
                    }
                    daysMap[date].events.push({
                        id: eventId || `e-${idx}`,
                        type: type || 'activity',
                        category: category || 'sightseeing',
                        name, time, endTime, status: status || 'planned',
                        details
                    });
                });
                const newItinerary = Object.values(daysMap);
                if (newItinerary.length === 0) throw new Error('有効なデータがありません');
                if (window.confirm(`${newItinerary.length}日分のデータをインポートしますか？`)) {
                    setItinerary(newItinerary);
                    if (setSelectedDayId) setSelectedDayId(newItinerary[0]?.id);
                    alert('CSVインポート完了！保存ボタンでスプレッドシートに反映されます。');
                }
            } catch (err) {
                alert(`CSVパースエラー: ${err.message}`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="pt-4 space-y-4">
            {/* Quick Access */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">便利ツール</h3>
                </div>
                <button onClick={() => setActiveTab('packing')} className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors touch-manipulation min-h-[56px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                            <Luggage size={18} className="text-orange-500" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-200 font-medium">パッキングリスト</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                </button>
                <button onClick={() => setActiveTab('emergency')} className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors touch-manipulation min-h-[56px] border-t border-gray-50 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                            <Phone size={18} className="text-red-500" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-200 font-medium">緊急連絡先</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                </button>
            </div>

            {/* Data Management */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">データ管理</h3>
                </div>
                <button onClick={handleExportCSV} className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors touch-manipulation min-h-[56px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <Download size={18} className="text-blue-500" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-200 font-medium">CSV ダウンロード</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                </button>
                <label className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors cursor-pointer border-t border-gray-50 dark:border-slate-700 touch-manipulation min-h-[56px]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                            <Upload size={18} className="text-green-500" />
                        </div>
                        <span className="text-gray-700 dark:text-slate-200 font-medium">CSV アップロード</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                    <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                </label>
                {lastUpdate && (
                    <div className="px-4 py-3 border-t border-gray-50 dark:border-slate-700 flex items-center gap-3">
                        <Clock size={20} className="text-gray-400 dark:text-slate-500" />
                        <div>
                            <span className="text-xs text-gray-400 dark:text-slate-500 block">最終更新</span>
                            <span className="text-sm text-gray-600 dark:text-slate-300">{lastUpdate}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Auto Fill */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <button
                    onClick={onAutoFill}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors touch-manipulation min-h-[56px]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                            <Sparkles size={18} className="text-purple-500" />
                        </div>
                        <div className="text-left">
                            <span className="text-gray-700 dark:text-slate-200 font-medium block">情報の自動補完</span>
                            <span className="text-xs text-gray-400 dark:text-slate-500">Google Mapsから詳細を取得して埋める</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                </button>
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">外観</h3>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Moon size={20} className="text-indigo-500" />
                        <span className="text-gray-700 dark:text-slate-200">ダークモード</span>
                    </div>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* App Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">アプリ情報</h3>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between">
                    <span className="text-gray-700 dark:text-slate-200">バージョン</span>
                    <span className="text-gray-400 dark:text-slate-500 text-sm">1.1.0</span>
                </div>
                <a href="https://github.com/atariryuma/winter-trip-app" target="_blank" rel="noopener noreferrer" className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-50 dark:border-slate-700">
                    <span className="text-gray-700 dark:text-slate-200">GitHub</span>
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                </a>
            </div>

            {/* Hint */}
            <div className="text-center text-xs text-gray-400 dark:text-slate-500 py-4">
                💡 カードを編集するには右上の編集ボタンを押してください
            </div>
        </div>
    );
};

export default SettingsView;
