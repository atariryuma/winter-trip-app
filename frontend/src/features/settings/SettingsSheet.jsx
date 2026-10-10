import { useRef, useState } from 'react';
import { Download, LogOut, Monitor, Moon, RefreshCw, Sun, Trash2, Upload } from 'lucide-react';
import Sheet from '../../ui/Sheet';
import { Spinner } from '../../ui/atoms';
import { useConfirm, useToast } from '../../ui/contexts';
import { useTrip } from '../../store/context';
import api from '../../lib/api';
import { toDateKey } from '../../lib/trip';

const THEMES = [
    { id: 'system', label: '自動', icon: Monitor },
    { id: 'light', label: 'ライト', icon: Sun },
    { id: 'dark', label: 'ダーク', icon: Moon },
];

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function SettingsSheet({ open, onClose, theme, setTheme, onLogout }) {
    const { currentTrip, days, refresh, syncedAt, syncError, supportsTrips, importEvents } = useTrip();
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const tripTitle = currentTrip?.title || '旅行';
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileRef = useRef(null);

    const sync = async () => {
        setSyncing(true);
        await refresh();
        setSyncing(false);
    };

    // The current trip, in the "events" sheet's column order so it can be imported back.
    // Dates are written with their year.
    const exportCsv = () => {
        const header = ['date', 'type', 'category', 'name', 'time', 'endTime', 'from', 'to', 'status', 'bookingRef', 'memo', 'budget'];
        const rows = days.flatMap((d) => d.events.map((e) => [
            toDateKey(d.fullDate), e.type, e.category, e.name, e.time, e.endTime, e.from, e.to, e.status, e.bookingRef, e.details,
            e.budgetAmount ? `${e.budgetAmount}/${e.budgetPaidBy || ''}` : '',
        ]));
        const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tripTitle}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importCsv = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        const ok = await confirm({
            title: 'CSVを取り込む',
            message: supportsTrips
                ? `「${tripTitle}」の予定がCSVの内容で置き換わります。ほかの旅行はそのままです。\n先に「書き出す」でバックアップを取ることをおすすめします。`
                : 'スプレッドシートの予定がすべてCSVの内容で置き換わります。\n先に「書き出す」でバックアップを取ることをおすすめします。',
            confirmLabel: '取り込む',
            destructive: true,
        });
        if (!ok) return;
        setImporting(true);
        try {
            if (await importEvents(await file.text())) showToast('success', '取り込みました');
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setImporting(false);
        }
    };

    const clearCache = () => {
        const n = api.clearDeviceCache();
        showToast('success', `地図・経路のキャッシュを ${n}件 削除しました`);
    };

    return (
        <Sheet open={open} onClose={onClose} title="設定">
            <div className="space-y-6">
                <section>
                    <p className="field-label">表示</p>
                    <div className="grid grid-cols-3 gap-2">
                        {THEMES.map((t) => (
                            <button key={t.id} onClick={() => setTheme(t.id)} aria-pressed={theme === t.id} className={`chip justify-center !py-3 ${theme === t.id ? 'chip-selected' : ''}`}>
                                <t.icon size={16} /> {t.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <p className="field-label">データ（Googleスプレッドシート）</p>
                    <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/60 divide-y divide-slate-200/70 dark:divide-slate-700/60">
                        <button onClick={sync} disabled={syncing} className="settings-row">
                            {syncing ? <Spinner className="w-4 h-4" /> : <RefreshCw size={18} />}
                            <span className="flex-1">
                                今すぐ同期
                                <span className="block text-xs text-slate-500">
                                    {syncError ? `前回失敗: ${syncError}` : syncedAt ? `最終同期 ${new Date(syncedAt).toLocaleString('ja-JP')}` : '未同期'}
                                </span>
                            </span>
                        </button>
                        <button onClick={exportCsv} disabled={days.length === 0} className="settings-row">
                            <Download size={18} /> <span className="flex-1">「{tripTitle}」をCSVに書き出す</span>
                        </button>
                        <button onClick={() => fileRef.current?.click()} disabled={importing} className="settings-row">
                            {importing ? <Spinner className="w-4 h-4" /> : <Upload size={18} />}
                            <span className="flex-1">CSVから「{tripTitle}」に取り込む</span>
                        </button>
                        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} />
                        <button onClick={clearCache} className="settings-row">
                            <Trash2 size={18} /> <span className="flex-1">地図・経路キャッシュを削除</span>
                        </button>
                    </div>
                </section>

                <button onClick={() => { onClose(); onLogout(); }} className="btn-secondary w-full text-rose-600">
                    <LogOut size={16} /> ログアウト
                </button>

                <p className="text-center text-xs text-slate-400">TripPlanner v{__APP_VERSION__}</p>
            </div>
        </Sheet>
    );
}
