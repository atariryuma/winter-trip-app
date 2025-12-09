import React, { useState } from 'react';
import { Luggage, ChevronRight, Phone, Download, Upload, Clock, Moon } from 'lucide-react';

const SettingsView = ({ itinerary, setItinerary, setSelectedDayId, isDarkMode, setIsDarkMode, lastUpdate, setActiveTab }) => {
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

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n').map(line => {
                    // Parse CSV line handling quoted fields
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

                // Skip header, group by date
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

                if (confirm(`${newItinerary.length}日分のデータをインポートしますか？`)) {
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

export default SettingsView;
