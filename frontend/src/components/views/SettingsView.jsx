import React, { useState } from 'react';
import {
    Luggage, ChevronRight, Phone, Download, Upload, Clock, Moon,
    FileText, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp,
    Package, AlertTriangle
} from 'lucide-react';
import server from '../../api/gas';

const SettingsView = ({ itinerary, setItinerary, setSelectedDayId, isDarkMode, setIsDarkMode, lastUpdate, setActiveTab, onDataRefresh }) => {
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showDataManagement, setShowDataManagement] = useState(false);

    // CSV Export - all itinerary data
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

    // CSV Import - events data
    const handleImportCSV = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadStatus(null);

        try {
            const text = await file.text();
            const result = await server.uploadEvents(text);
            setUploadStatus({ success: true, message: result.message });
            if (onDataRefresh) onDataRefresh();
        } catch (err) {
            setUploadStatus({ success: false, message: err.message });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="pt-4 space-y-4 pb-24">
            {/* 便利ツール - Main Features */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">便利ツール</h3>
                </div>

                {/* パッキングリスト */}
                <button
                    onClick={() => setActiveTab('packing')}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors touch-manipulation min-h-[56px]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
                            <Package size={20} className="text-white" />
                        </div>
                        <div className="text-left">
                            <span className="text-gray-700 dark:text-slate-200 font-bold block">持ち物チェックリスト</span>
                            <span className="text-xs text-gray-400 dark:text-slate-500">忘れ物を防ぐ</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                </button>

                {/* 緊急連絡先 */}
                <button
                    onClick={() => setActiveTab('emergency')}
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors touch-manipulation min-h-[56px] border-t border-gray-50 dark:border-slate-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-sm">
                            <Phone size={20} className="text-white" />
                        </div>
                        <div className="text-left">
                            <span className="text-gray-700 dark:text-slate-200 font-bold block">緊急連絡先</span>
                            <span className="text-xs text-gray-400 dark:text-slate-500">110・119・病院</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                </button>
            </div>

            {/* 外観 - Appearance */}
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

            {/* データ管理 - Collapsible */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <button
                    onClick={() => setShowDataManagement(!showDataManagement)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">データ管理</h3>
                    {showDataManagement ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {showDataManagement && (
                    <div className="border-t border-gray-100 dark:border-slate-700">
                        {/* CSV Export */}
                        <button onClick={handleExportCSV} className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors touch-manipulation min-h-[56px]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                                    <Download size={18} className="text-green-500" />
                                </div>
                                <div className="text-left">
                                    <span className="text-gray-700 dark:text-slate-200 font-medium block">CSVエクスポート</span>
                                    <span className="text-xs text-gray-400 dark:text-slate-500">旅程データをダウンロード</span>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                        </button>

                        {/* CSV Import */}
                        <label className={`w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors touch-manipulation min-h-[56px] border-t border-gray-50 dark:border-slate-700 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                                    {uploading ? (
                                        <Loader2 size={18} className="text-blue-500 animate-spin" />
                                    ) : (
                                        <Upload size={18} className="text-blue-500" />
                                    )}
                                </div>
                                <div className="text-left">
                                    <span className="text-gray-700 dark:text-slate-200 font-medium block">CSVインポート</span>
                                    <span className="text-xs text-gray-400 dark:text-slate-500">旅程データをアップロード</span>
                                </div>
                            </div>
                            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" disabled={uploading} />
                            <FileText size={18} className="text-gray-300 dark:text-slate-500" />
                        </label>
                        {uploadStatus && (
                            <div className={`px-4 py-2 flex items-center gap-2 text-sm ${uploadStatus.success ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                                {uploadStatus.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                {uploadStatus.message}
                            </div>
                        )}

                        {/* Warning */}
                        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800/30">
                            <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400 text-xs">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <span>CSVをインポートすると既存データが上書きされます</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Last Update - Always visible */}
                {lastUpdate && (
                    <div className="px-4 py-3 flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
                        <Clock size={14} className="text-gray-400 dark:text-slate-500" />
                        <span className="text-xs text-gray-500 dark:text-slate-400">最終更新: {lastUpdate}</span>
                    </div>
                )}
            </div>

            {/* アプリ情報 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">アプリ情報</h3>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between">
                    <span className="text-gray-700 dark:text-slate-200">バージョン</span>
                    <span className="text-gray-400 dark:text-slate-500 text-sm">2.0.0</span>
                </div>
                <a href="https://github.com/atariryuma/winter-trip-app" target="_blank" rel="noopener noreferrer" className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 border-t border-gray-50 dark:border-slate-700">
                    <span className="text-gray-700 dark:text-slate-200">GitHub</span>
                    <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                </a>
            </div>
        </div>
    );
};

export default SettingsView;
