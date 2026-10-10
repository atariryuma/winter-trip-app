import { useEffect, useState } from 'react';
import { BedDouble, MoreHorizontal, Navigation, Trash2, TriangleAlert } from 'lucide-react';
import {
    dayRoute, endPlace, eventTitle, formatDateJa, formatMinutes, isSameDay, isStay, mapsDirectionsUrl, needsBooking,
    toMinutes,
} from '../../lib/trip';

/** Summary card for the selected day: route, what's next, tonight's stay. */
export default function DayHero({ day, prevStay, now, onDeleteDay, onOpenEvent }) {
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!menuOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [menuOpen]);
    const plan = day.events.filter((e) => !isStay(e));
    const stays = day.events.filter(isStay);
    const pending = day.events.filter(needsBooking);
    const stops = dayRoute(plan, prevStay ? endPlace(prevStay) : null);
    if (stays[0] && stops[stops.length - 1] !== stays[0].name) stops.push(stays[0].name);
    const routeUrl = mapsDirectionsUrl(stops);

    const isToday = isSameDay(day.fullDate, now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const current = isToday
        ? plan.find((e) => {
            const s = toMinutes(e.time);
            const end = toMinutes(e.endTime);
            return s !== null && end !== null && s <= nowMin && nowMin < end;
        })
        : null;
    const next = isToday ? plan.find((e) => (toMinutes(e.time) ?? -1) > nowMin) : null;

    return (
        <section className="relative rounded-[1.75rem] bg-gradient-to-br from-slate-900 via-slate-800 to-accent-900 text-white p-5 shadow-xl shadow-slate-900/10">
            {/* The glow is clipped on its own layer so the day menu below can overflow the card */}
            <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] pointer-events-none" aria-hidden>
                <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-accent-400/20 blur-3xl" />
            </div>
            <div className="relative flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-accent-200/80">DAY {day.index + 1}</p>
                    <h2 className="text-xl min-[360px]:text-2xl font-black mt-0.5">{formatDateJa(day.fullDate, { withYear: day.fullDate.getFullYear() !== now.getFullYear() })}</h2>
                </div>
                {/* Route sits up here: the floating add button covers the card's bottom-right on small phones */}
                <div className="relative flex items-center gap-1 shrink-0">
                    {routeUrl && stops.length >= 2 && (
                        <a
                            href={routeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="この日のルート"
                            className="p-2 min-[400px]:px-3 min-[400px]:py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold inline-flex items-center gap-1"
                        >
                            <Navigation size={14} className="min-[400px]:w-3 min-[400px]:h-3" />
                            <span className="hidden min-[400px]:inline">ルート</span>
                        </a>
                    )}
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-2 -mr-2 rounded-full hover:bg-white/10"
                        aria-label="この日のメニュー"
                        aria-expanded={menuOpen}
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-dropdown" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-full mt-1 z-dropdown w-48 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xl ring-1 ring-black/5 overflow-hidden">
                                <button
                                    onClick={() => { setMenuOpen(false); onDeleteDay(day); }}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                >
                                    <Trash2 size={16} /> この日を削除
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {(current || next) && (
                <button
                    onClick={() => onOpenEvent(current || next)}
                    className="relative mt-4 w-full text-left rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3"
                >
                    <p className="text-[11px] font-bold text-accent-200">{current ? 'いまの予定' : '次の予定'}</p>
                    <p className="font-bold truncate">
                        <span className="tabular-nums mr-2">{(current || next).time}</span>
                        {eventTitle(current || next)}
                    </p>
                    {!current && next && (
                        <p className="text-xs text-white/70 mt-0.5">あと {formatMinutes(toMinutes(next.time) - nowMin)}</p>
                    )}
                </button>
            )}

            {stops.length >= 2 && (
                <p className="relative mt-4 text-sm text-white/85 leading-relaxed line-clamp-2">
                    {stops.join(' → ')}
                </p>
            )}

            <div className="relative mt-4 flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold">予定 {plan.length}件</span>
                {pending.length > 0 && (
                    <span className="px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-200 text-xs font-bold inline-flex items-center gap-1">
                        <TriangleAlert size={12} /> 要予約 {pending.length}件
                    </span>
                )}
                {stays[0] && (
                    <button
                        onClick={() => onOpenEvent(stays[0])}
                        className="px-3 py-1.5 rounded-full bg-violet-400/20 text-violet-100 text-xs font-bold inline-flex items-center gap-1 max-w-full"
                    >
                        <BedDouble size={12} className="shrink-0" /> <span className="truncate">{stays[0].name}</span>
                    </button>
                )}
            </div>
        </section>
    );
}
