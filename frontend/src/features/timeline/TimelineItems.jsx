import { BedDouble, Plus, Ticket, Wallet } from 'lucide-react';
import { CategoryIcon, NeedsBookingPill, StatusPill } from '../../ui/atoms';
import { useTravelTime } from '../../hooks/useTravelTime';
import {
    categoryMeta, eventTitle, formatMinutes, formatYen, isTransport, needsBooking, toMinutes, toTime,
} from '../../lib/trip';

const RAIL = 'w-14 shrink-0';

export function EventRow({ event, state, onOpen }) {
    const meta = categoryMeta(event.category);
    const subtitle = isTransport(event)
        ? [event.from, event.to].filter(Boolean).join(' → ')
        : event.details?.split('\n')[0];
    const showSubtitle = subtitle && subtitle !== event.name;

    return (
        <div className={`flex items-stretch gap-3 ${state === 'past' ? 'opacity-55' : ''}`}>
            <div className={`${RAIL} pt-4 text-right`}>
                <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{event.time || '未定'}</p>
                {event.endTime && <p className="text-xs tabular-nums text-slate-400">{event.endTime}</p>}
            </div>
            <div className="relative flex flex-col items-center w-3">
                <span className="absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" aria-hidden />
                <span className={`relative mt-5 w-3 h-3 rounded-full ring-4 ring-slate-100 dark:ring-slate-950 ${meta.toneClasses.dot}`} />
            </div>
            <button
                onClick={() => onOpen(event)}
                className={`flex-1 min-w-0 my-1.5 text-left rounded-3xl bg-white dark:bg-slate-900 p-4 ring-1 transition active:scale-[0.99] ${state === 'current'
                    ? 'ring-2 ring-sky-500 shadow-lg shadow-sky-500/10'
                    : 'ring-slate-200/70 dark:ring-slate-800 hover:ring-slate-300 dark:hover:ring-slate-700'
                }`}
            >
                <div className="flex items-start gap-3">
                    <CategoryIcon category={event.category} className="w-9 h-9 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white leading-snug break-words">{eventTitle(event)}</p>
                        {showSubtitle && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{subtitle}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {needsBooking(event) ? <NeedsBookingPill event={event} /> : <StatusPill status={event.status} />}
                            {event.bookingRef && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                    <Ticket size={12} /> {event.bookingRef.length > 14 ? `${event.bookingRef.slice(0, 12)}…` : event.bookingRef}
                                </span>
                            )}
                            {Number(event.budgetAmount) > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 tabular-nums">
                                    <Wallet size={12} /> {formatYen(Number(event.budgetAmount))}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </button>
        </div>
    );
}

/**
 * The space between two stops: travel time (when both places are known),
 * slack before the next start, and a shortcut to insert something there.
 */
export function GapRow({ from, to, available, onInsert, label }) {
    const { minutes: travel, loading } = useTravelTime(from, to);
    const slack = travel !== null && available !== null ? available - travel : null;
    let tone = 'text-slate-400';
    let text = null;
    if (loading) {
        text = '移動時間を計算中…';
    } else if (travel !== null) {
        text = `移動 約${formatMinutes(travel)}`;
        if (slack !== null) {
            if (slack < 0) {
                tone = 'text-rose-600 dark:text-rose-400 font-bold';
                text += ` · ${formatMinutes(-slack)}足りません`;
            } else if (slack < 15) {
                tone = 'text-amber-600 dark:text-amber-400 font-bold';
                text += ` · 余裕${formatMinutes(slack)}`;
            } else {
                text += ` · 余裕${formatMinutes(slack)}`;
            }
        }
    } else if (available !== null && available > 0) {
        text = `${formatMinutes(available)}あき`;
    } else if (available !== null && available < 0) {
        tone = 'text-rose-600 dark:text-rose-400 font-bold';
        text = `${formatMinutes(-available)}重なっています`;
    }
    if (label) text = text ? `${label} · ${text}` : label;

    return (
        <div className="flex items-center gap-3 min-h-9">
            <div className={RAIL} />
            <div className="relative flex justify-center w-3 self-stretch">
                <span className="absolute top-0 bottom-0 w-px border-l border-dashed border-slate-300 dark:border-slate-700" aria-hidden />
                {onInsert && (
                    <button
                        onClick={onInsert}
                        className="relative my-auto w-6 h-6 -mx-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-sky-600 hover:bg-sky-50 ring-1 ring-slate-200 dark:ring-slate-800 flex items-center justify-center"
                        aria-label="ここに予定を追加"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
            {text && <p className={`text-xs ${tone}`}>{text}</p>}
        </div>
    );
}

/** "Leave the hotel at …" row at the top of day 2+. */
export function DepartureRow({ stay, firstEvent, firstPlace }) {
    const { minutes: travel } = useTravelTime(stay.name, firstPlace);
    const start = toMinutes(firstEvent?.time);
    const leaveAt = travel !== null && start !== null ? start - travel - 10 : null;
    return (
        <div className="flex items-center gap-3">
            <div className={`${RAIL} text-right`}>
                {leaveAt !== null && leaveAt >= 0 && (
                    <p className="text-sm font-bold tabular-nums text-violet-600 dark:text-violet-300">{toTime(leaveAt)}</p>
                )}
            </div>
            <div className="relative flex justify-center w-3 self-stretch">
                <span className="mt-3 w-3 h-3 rounded-full bg-violet-500/30 ring-4 ring-slate-100 dark:ring-slate-950" />
            </div>
            <p className="flex-1 min-w-0 py-3 text-sm text-slate-600 dark:text-slate-300">
                <BedDouble size={14} className="inline -mt-0.5 mr-1 text-violet-500" />
                <span className="font-bold">{stay.name}</span> を出発
                {leaveAt !== null && leaveAt >= 0 && <span className="text-slate-400">（移動{formatMinutes(travel)}+10分）</span>}
            </p>
        </div>
    );
}

export function NowMarker({ now }) {
    return (
        <div className="flex items-center gap-3 py-1" aria-label="現在時刻">
            <p className={`${RAIL} text-right text-xs font-black tabular-nums text-sky-600 dark:text-sky-400`}>
                {toTime(now.getHours() * 60 + now.getMinutes())}
            </p>
            <span className="w-3 h-3 rounded-full bg-sky-500 ring-4 ring-sky-500/20" />
            <span className="flex-1 h-0.5 bg-sky-500/60 rounded-full" />
        </div>
    );
}

export function StayCard({ stay, onOpen }) {
    return (
        <button
            onClick={() => onOpen(stay)}
            className="w-full flex items-center gap-3 rounded-3xl bg-violet-50 dark:bg-violet-500/10 p-4 text-left ring-1 ring-violet-200/70 dark:ring-violet-500/20"
        >
            <span className="w-10 h-10 rounded-2xl bg-violet-500 text-white flex items-center justify-center shrink-0">
                <BedDouble size={20} />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-bold text-violet-700/80 dark:text-violet-300/80">今夜の宿</span>
                <span className="block font-bold text-slate-900 dark:text-white break-words">{stay.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {stay.time ? `チェックイン ${stay.time}` : 'チェックイン時刻未設定'}
                    {stay.endTime ? ` · チェックアウト ${stay.endTime}` : ''}
                </span>
            </span>
            {needsBooking(stay) ? <NeedsBookingPill event={stay} /> : <StatusPill status={stay.status} />}
        </button>
    );
}
