import { lazy, Suspense, useState } from 'react';
import { Backpack, CalendarDays, CloudOff, RefreshCw, Settings, Snowflake, Ticket, Wallet } from 'lucide-react';
import TimelineView from './features/timeline/TimelineView';
import EventDetailSheet from './features/event/EventDetailSheet';
import EventEditorSheet from './features/event/EventEditorSheet';
import SettingsSheet from './features/settings/SettingsSheet';
import PullToRefresh from './ui/PullToRefresh';
import UpdatePrompt from './ui/UpdatePrompt';
import { Spinner } from './ui/atoms';
import { useTrip } from './store/context';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEFAULT_TRIP_TITLE, TRIP_TITLE_KEY } from './lib/keys';
import { needsBooking, tripPhase } from './lib/trip';

const BookingsView = lazy(() => import('./features/bookings/BookingsView'));
const ListsView = lazy(() => import('./features/lists/ListsView'));
const MoneyView = lazy(() => import('./features/money/MoneyView'));

const TABS = [
    { id: 'timeline', label: '旅程', icon: CalendarDays },
    { id: 'bookings', label: '予約', icon: Ticket },
    { id: 'lists', label: '持ち物', icon: Backpack },
    { id: 'money', label: 'お金', icon: Wallet },
];

const phaseLabel = (phase) => {
    switch (phase.phase) {
        case 'before': return phase.daysUntil === 1 ? 'いよいよ明日出発' : `出発まであと${phase.daysUntil}日`;
        case 'during': return phase.dayNumber > 0 ? `旅行中・${phase.dayNumber}日目` : '旅行中';
        case 'after': return 'おかえりなさい';
        default: return '';
    }
};

export default function AppShell({ theme, setTheme, onLogout }) {
    const { days, status, syncError, syncedAt, saving, refresh, today, deleteEvent } = useTrip();
    const [tab, setTab] = useState(() => sessionStorage.getItem('tab') || 'timeline');
    const [title] = useLocalStorage(TRIP_TITLE_KEY, DEFAULT_TRIP_TITLE);
    const [selection, setSelection] = useState(null);
    const [draft, setDraft] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const switchTab = (id) => {
        setTab(id);
        sessionStorage.setItem('tab', id);
        window.scrollTo({ top: 0 });
    };

    const openEditor = (event, day) => setDraft({ event, date: day.date });
    const pendingBookings = days.reduce((n, d) => n + d.events.filter(needsBooking).length, 0);

    if (status === 'loading') {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 text-slate-400">
                <Snowflake className="animate-spin [animation-duration:3s]" size={32} />
                <p className="text-sm">旅のしおりを読み込んでいます…</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 px-8 text-center">
                <CloudOff className="text-slate-300" size={44} />
                <p className="font-bold text-slate-800 dark:text-slate-100">データを読み込めませんでした</p>
                <p className="text-sm text-slate-500">{syncError}</p>
                <button onClick={refresh} className="btn-primary mt-3"><RefreshCw size={16} /> 再読み込み</button>
            </div>
        );
    }

    const phase = tripPhase(days, today);
    const current = TABS.find((t) => t.id === tab) || TABS[0];

    return (
        <div className="min-h-[100dvh] md:pl-60">
            <UpdatePrompt />

            {/* Side navigation (tablet / desktop) */}
            <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur z-fixed">
                <div className="px-5 pt-6 pb-5">
                    <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                        <Snowflake size={18} /> <span className="text-xs font-bold tracking-widest">TRIPPLANNER</span>
                    </div>
                    <p className="mt-2 text-lg font-black leading-snug text-slate-900 dark:text-white">{title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{phaseLabel(phase)}</p>
                </div>
                <nav className="flex-1 px-3 space-y-1">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => switchTab(t.id)}
                            aria-current={tab === t.id ? 'page' : undefined}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition ${tab === t.id
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <t.icon size={18} /> {t.label}
                            {t.id === 'bookings' && pendingBookings > 0 && (
                                <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center">{pendingBookings}</span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-3">
                    <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Settings size={18} /> 設定
                    </button>
                </div>
            </aside>

            {/* Header */}
            <header className="sticky top-0 z-sticky bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur pt-[env(safe-area-inset-top)]">
                <div className="h-14 flex items-center gap-3 px-4 sm:px-6">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-black text-slate-900 dark:text-white truncate leading-tight">
                            <span className="md:hidden">{tab === 'timeline' ? title : current.label}</span>
                            <span className="hidden md:inline">{current.label}</span>
                        </h1>
                        {tab === 'timeline' && <p className="md:hidden text-[11px] font-bold text-sky-600 dark:text-sky-400">{phaseLabel(phase)}</p>}
                    </div>
                    <SyncBadge saving={saving} syncError={syncError} syncedAt={syncedAt} onRetry={refresh} />
                    <button onClick={() => setSettingsOpen(true)} className="md:hidden p-2 -mr-2 rounded-full text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800" aria-label="設定">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            <main>
                <PullToRefresh onRefresh={refresh}>
                    <Suspense fallback={<div className="py-20 flex justify-center text-slate-400"><Spinner className="w-6 h-6" /></div>}>
                        {tab === 'timeline' && <TimelineView onOpenEvent={setSelection} onEdit={setDraft} />}
                        {tab === 'bookings' && <BookingsView onOpenEvent={setSelection} />}
                        {tab === 'lists' && <ListsView />}
                        {tab === 'money' && <MoneyView />}
                    </Suspense>
                </PullToRefresh>
            </main>

            {/* Bottom tab bar (phones) */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-fixed bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]">
                <div className="grid grid-cols-4 h-16">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => switchTab(t.id)}
                            aria-current={tab === t.id ? 'page' : undefined}
                            className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${tab === t.id ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}
                        >
                            <t.icon size={22} strokeWidth={tab === t.id ? 2.4 : 2} />
                            {t.label}
                            {t.id === 'bookings' && pendingBookings > 0 && (
                                <span className="absolute top-2 left-1/2 ml-2 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] leading-4 text-center">{pendingBookings}</span>
                            )}
                        </button>
                    ))}
                </div>
            </nav>

            <EventDetailSheet
                selection={selection}
                onClose={() => setSelection(null)}
                onEdit={openEditor}
                onDelete={(event) => deleteEvent(event.id)}
            />
            <EventEditorSheet draft={draft} onClose={() => setDraft(null)} />
            <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} theme={theme} setTheme={setTheme} onLogout={onLogout} />
        </div>
    );
}

function SyncBadge({ saving, syncError, syncedAt, onRetry }) {
    if (saving) {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500" role="status">
                <Spinner className="w-3.5 h-3.5" /> 保存中
            </span>
        );
    }
    if (syncError) {
        return (
            <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-bold"
                title={syncedAt ? `最終同期 ${new Date(syncedAt).toLocaleString('ja-JP')}` : undefined}
            >
                <CloudOff size={14} /> オフライン
            </button>
        );
    }
    return null;
}
