import React, { useState } from 'react';
import {
    ChevronRight, Download, Upload, Clock, Moon,
    FileText, CheckCircle, XCircle, Loader2, AlertTriangle
} from 'lucide-react';
import server from '../../api/gas';

const SettingsView = ({ itinerary, isDarkMode, setIsDarkMode, lastUpdate, onDataRefresh }) => {
    const [uploadStatus, setUploadStatus] = useState(null);
    const [uploading, setUploading] = useState(false);

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
        a.download = `Trip_Itinerary_${new Date().toISOString().split('T')[0]}.csv`;
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
        <div className="space-y-4 pb-8">
            {/* Large Title */}
            <div className="pb-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
            </div>

            {/* 外観 - Appearance (First - most commonly used) */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Appearance</h3>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Moon size={20} className="text-indigo-500" />
                        <span className="text-gray-700 dark:text-slate-200">Dark Mode</span>
                    </div>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* データ管理 - Data Management */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">Data Management</h3>
                </div>

                <div>
                    {/* CSV Export */}
                    <button onClick={handleExportCSV} className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 active:bg-gray-100 dark:active:bg-slate-600 transition-colors touch-manipulation min-h-[56px]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                                <Download size={18} className="text-green-500" />
                            </div>
                            <div className="text-left">
                                <span className="text-gray-700 dark:text-slate-200 font-medium block">CSV Export</span>
                                <span className="text-xs text-gray-400 dark:text-slate-500">Download itinerary data</span>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 dark:text-slate-500" />
                    </button>

                    {/* CSV Import */}
                    <label className={`w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors touch-manipulation min-h-[56px] border-t border-gray-50 dark:border-slate-700 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                                {uploading ? (
                                    <Loader2 size={18} className="text-indigo-500 animate-spin" />
                                ) : (
                                    <Upload size={18} className="text-indigo-500" />
                                )}
                            </div>
                            <div className="text-left">
                                <span className="text-gray-700 dark:text-slate-200 font-medium block">CSV Import</span>
                                <span className="text-xs text-gray-400 dark:text-slate-500">Upload itinerary data</span>
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
                            <span>Importing CSV will overwrite existing data</span>
                        </div>
                    </div>
                </div>

                {/* Last Update - Always visible */}
                {lastUpdate && (
                    <div className="px-4 py-3 flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
                        <Clock size={14} className="text-gray-400 dark:text-slate-500" />
                        <span className="text-xs text-gray-500 dark:text-slate-400">Last updated: {lastUpdate}</span>
                    </div>
                )}
            </div>

            {/* アプリ情報 - App Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">About</h3>
                </div>
                <div className="px-4 py-3.5 flex items-center justify-between">
                    <span className="text-gray-700 dark:text-slate-200">Version</span>
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
