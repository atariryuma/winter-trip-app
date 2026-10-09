import { useState } from 'react';
import { Check, Copy, PartyPopper, Ticket } from 'lucide-react';
import { useTrip } from '../../store/context';
import { CategoryIcon, NeedsBookingPill, SectionTitle } from '../../ui/atoms';
import { daysBetween, eventTitle, isBookable, isStay, isTransport, needsBooking } from '../../lib/trip';

const FILTERS = [
    { id: 'all', label: 'すべて', test: () => true },
    { id: 'transport', label: '交通', test: isTransport },
    { id: 'stay', label: '宿', test: isStay },
];

export default function BookingsView({ onOpenEvent }) {
    const { days, today } = useTrip();
    const [filter, setFilter] = useState('all');
    const test = FILTERS.find((f) => f.id === filter).test;

    const items = days.flatMap((day) =>
        day.events.filter((e) => isBookable(e) && test(e)).map((event) => ({ event, day })));
    const todo = items.filter(({ event }) => needsBooking(event));
    const done = items.filter(({ event }) => !needsBooking(event));
    const allBookable = days.flatMap((d) => d.events.filter(isBookable));
    const doneCount = allBookable.filter((e) => !needsBooking(e)).length;
    const progress = allBookable.length ? Math.round((doneCount / allBookable.length) * 100) : 0;

    const open = ({ event, day }) => onOpenEvent({ event, day });

    return (
        <div className="px-4 sm:px-6 pt-2 pb-32 md:pb-16 max-w-3xl">
            <div className="rounded-[1.75rem] bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 p-5">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-500">予約の進み具合</p>
                        <p className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                            {doneCount}<span className="text-lg text-slate-400"> / {allBookable.length}</span>
                        </p>
                    </div>
                    <p className={`text-sm font-bold ${todo.length ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {todo.length ? `残り ${allBookable.length - doneCount}件` : 'すべて予約済み'}
                    </p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="flex gap-2 mt-4" role="tablist">
                {FILTERS.map((f) => (
                    <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)} className={`chip ${filter === f.id ? 'chip-selected' : ''}`}>
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="mt-4">
                {todo.length > 0 && (
                    <>
                        <SectionTitle>まだ予約していない</SectionTitle>
                        <div className="space-y-2">
                            {todo.map((item) => (
                                <button
                                    key={item.event.id}
                                    onClick={() => open(item)}
                                    className="w-full flex items-center gap-3 rounded-3xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200/80 dark:ring-amber-500/20 p-4 text-left"
                                >
                                    <CategoryIcon category={item.event.category} className="w-10 h-10 shrink-0" />
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-xs text-slate-500">
                                            {item.day.fullDate.getMonth() + 1}/{item.day.fullDate.getDate()}({item.day.weekday}) {item.event.time}
                                            {daysBetween(today, item.day.fullDate) > 0 && ` · あと${daysBetween(today, item.day.fullDate)}日`}
                                        </span>
                                        <span className="block font-bold text-slate-900 dark:text-white truncate">{eventTitle(item.event)}</span>
                                    </span>
                                    <NeedsBookingPill event={item.event} />
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {todo.length === 0 && items.length > 0 && (
                    <div className="flex items-center gap-3 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-200">
                        <PartyPopper size={22} />
                        <p className="text-sm font-bold">必要な予約はすべて完了しています</p>
                    </div>
                )}

                {done.length > 0 && (
                    <>
                        <SectionTitle>予約済み</SectionTitle>
                        <div className="space-y-2">
                            {done.map((item) => <TicketCard key={item.event.id} item={item} onOpen={() => open(item)} />)}
                        </div>
                    </>
                )}

                {items.length === 0 && (
                    <div className="py-16 text-center text-slate-500">
                        <Ticket className="mx-auto text-slate-300" size={40} />
                        <p className="mt-3 text-sm">交通や宿の予定を追加するとここに表示されます</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TicketCard({ item, onOpen }) {
    const { event, day } = item;
    const [copied, setCopied] = useState(false);

    const copy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(event.bookingRef);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard unavailable */
        }
    };

    return (
        <div className="flex rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 overflow-hidden">
            <button onClick={onOpen} className="flex-1 min-w-0 flex items-center gap-3 p-4 text-left">
                <CategoryIcon category={event.category} className="w-10 h-10 shrink-0" />
                <span className="min-w-0">
                    <span className="block text-xs text-slate-500 tabular-nums">
                        {day.fullDate.getMonth() + 1}/{day.fullDate.getDate()}({day.weekday}) {event.time}{event.endTime ? `–${event.endTime}` : ''}
                    </span>
                    <span className="block font-bold text-slate-900 dark:text-white truncate">{eventTitle(event)}</span>
                    {isTransport(event) && (event.from || event.to) && (
                        <span className="block text-xs text-slate-500 truncate">{event.from} → {event.to}</span>
                    )}
                </span>
            </button>
            {event.bookingRef ? (
                <button
                    onClick={copy}
                    className="w-28 shrink-0 border-l-2 border-dashed border-slate-200 dark:border-slate-700 px-3 flex flex-col items-center justify-center gap-1 bg-emerald-50/60 dark:bg-emerald-500/5"
                    aria-label={`予約番号 ${event.bookingRef} をコピー`}
                >
                    <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-200 break-all text-center line-clamp-2">{event.bookingRef}</span>
                    <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-1">
                        {copied ? <><Check size={11} /> コピー済</> : <><Copy size={11} /> コピー</>}
                    </span>
                </button>
            ) : (
                <span className="w-28 shrink-0 border-l-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-[11px] text-slate-400">
                    番号なし
                </span>
            )}
        </div>
    );
}
