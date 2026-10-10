import { lazy, Suspense, useState } from 'react';
import { Backpack, CalendarDays, ChevronDown, CloudOff, Plane, RefreshCw, Settings, Ticket, Wallet } from 'lucide-react';
import TimelineView from './features/timeline/TimelineView';
import EventDetailSheet from './features/event/EventDetailSheet';
import EventEditorSheet from './features/event/EventEditorSheet';
import SettingsSheet from './features/settings/SettingsSheet';
import TripsSheet from './features/trips/TripsSheet';
import TripEditorSheet from './features/trips/TripEditorSheet';
import PullToRefresh from './ui/PullToRefresh';
import UpdatePrompt from './ui/UpdatePrompt';
import { Spinner } from './ui/atoms';
import { useTrip } from './store/context';
import { useSeason } from './hooks/useSeason';
import { needsBooking, phaseLabel } from './lib/trip';
import { SEASONS, seasonOf } from './lib/season';

const BookingsView = lazy(() => import('./features/bookings/BookingsView'));
const ListsView = lazy(() => import('./features/lists/ListsView'));
const MoneyView = lazy(() => import('./features/money/MoneyView'));

const TABS = [
    { id: 'timeline', label: '旅程', icon: CalendarDays },
    { id: 'bookings', label: '予約', icon: Ticket },
    { id: 'lists', label: '持ち物', icon: Backpack },
    { id: 'money', label: 'お金', icon: Wallet },
];

export default function AppShell({ theme, setTheme, onLogout }) {
    const { currentTrip, days, status, syncError, syncedAt, saving, refresh, today, deleteEvent } = useTrip();
    const [tab, setTab] = useState(() => sessionStorage.getItem('tab') || 'timeline');
    const [selection, setSelection] = useState(null);
    const [draft, setDraft] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tripsOpen, setTripsOpen] = useState(false);
    // { trip } edits a trip, {} creates one
    const [tripDraft, setTripDraft] = useState(null);

    const season = currentTrip?.season || seasonOf(today);
    const SeasonIcon = SEASONS[season].icon;
    useSeason(season);

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
                <Plane className="animate-pulse" size={32} />
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

    const current = TABS.find((t) => t.id === tab) || TABS[0];
    const title = currentTrip?.title || 'TripPlanner';
    const subtitle = currentTrip ? phaseLabel(currentTrip.phase) : '旅行を作成してください';

    return (
        <div className="min-h-[100dvh] md:pl-60">
            <UpdatePrompt />

            {/* Side navigation (tablet / desktop) */}
            <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur z-fixed">
                <div className="px-3 pt-5 pb-4">
                    <p className="px-2 flex items-center gap-2 text-accent-700 dark:text-accent-400 text-xs font-bold tracking-widest">
                        <Plane size={14} /> TRIPPLANNER
                    </p>
                    <button
                        onClick={() => setTripsOpen(true)}
                        className="mt-3 w-full flex items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="旅行を切り替え"
                    >
                        <span className="w-10 h-10 shrink-0 rounded-2xl bg-accent-100 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 flex items-center justify-center">
                            <SeasonIcon size={20} />
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block font-black leading-snug text-slate-900 dark:text-white truncate">{title}</span>
                            <span className="block text-xs text-slate-500 truncate">{subtitle}</span>
                        </span>
                        <ChevronDown size={16} className="shrink-0 text-slate-400" />
                    </button>
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

            {/* Header. Keep it sticky at top-0 with a background: WebKit skips the iOS 26+
                edge blur when such a box covers the top edge (see the status-bar note in index.html). */}
            <header className="sticky top-0 z-sticky bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur pt-[env(safe-area-inset-top)]">
                <div className="h-14 flex items-center gap-3 px-4 sm:px-6">
                    <button
                        onClick={() => setTripsOpen(true)}
                        className="md:hidden flex-1 min-w-0 flex items-center gap-2.5 text-left"
                        aria-label="旅行を切り替え"
                    >
                        <SeasonIcon size={22} className="shrink-0 text-accent-700 dark:text-accent-400" />
                        <span className="min-w-0">
                            <span className="flex items-center gap-1 text-lg font-black text-slate-900 dark:text-white leading-tight">
                                <span className="truncate">{title}</span>
                                <ChevronDown size={16} className="shrink-0 text-slate-400" />
                            </span>
                            <span className="block text-[11px] font-bold text-accent-700 dark:text-accent-400 truncate">{subtitle}</span>
                        </span>
                    </button>
                    <h1 className="hidden md:block flex-1 text-lg font-black text-slate-900 dark:text-white">{current.label}</h1>
                    <SyncBadge saving={saving} syncError={syncError} syncedAt={syncedAt} onRetry={refresh} />
                    <button onClick={() => setSettingsOpen(true)} className="md:hidden p-2 -mr-2 rounded-full text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800" aria-label="設定">
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            <main>
                <PullToRefresh onRefresh={refresh}>
                    <Suspense fallback={<div className="py-20 flex justify-center text-slate-400"><Spinner className="w-6 h-6" /></div>}>
                        {(tab === 'timeline' || !currentTrip) && (
                            <TimelineView onOpenEvent={setSelection} onEdit={setDraft} onCreateTrip={() => setTripDraft({})} />
                        )}
                        {currentTrip && tab === 'bookings' && <BookingsView onOpenEvent={setSelection} />}
                        {currentTrip && tab === 'lists' && <ListsView />}
                        {currentTrip && tab === 'money' && <MoneyView />}
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
                            className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${tab === t.id ? 'text-accent-700 dark:text-accent-400' : 'text-slate-400'}`}
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
            <TripsSheet
                open={tripsOpen}
                onClose={() => setTripsOpen(false)}
                onCreate={() => { setTripsOpen(false); setTripDraft({}); }}
                onEdit={(trip) => { setTripsOpen(false); setTripDraft({ trip }); }}
            />
            <TripEditorSheet draft={tripDraft} onClose={() => setTripDraft(null)} />
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
