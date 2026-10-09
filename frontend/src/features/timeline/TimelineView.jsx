import { Fragment, useRef, useState } from 'react';
import { CalendarPlus, Plus } from 'lucide-react';
import DayStrip from './DayStrip';
import DayHero from './DayHero';
import { DepartureRow, EventRow, GapRow, NowMarker, StayCard } from './TimelineItems';
import { useTrip } from '../../store/context';
import { useConfirm } from '../../ui/contexts';
import { useNow } from '../../hooks/useNow';
import {
    endPlace, formatDateJa, gapMinutes, isFlight, isSameDay, isStay, startPlace, toMinutes, toTime, tripPhase,
} from '../../lib/trip';

const SELECTED_KEY = 'selected_day';

export default function TimelineView({ onOpenEvent, onEdit }) {
    const { days, deleteDay } = useTrip();
    const { confirm } = useConfirm();
    const now = useNow();
    const [chosen, setChosen] = useState(() => sessionStorage.getItem(SELECTED_KEY));
    const touch = useRef(null);

    if (days.length === 0) {
        return (
            <div className="px-6 py-20 text-center">
                <CalendarPlus className="mx-auto text-slate-300" size={48} />
                <p className="mt-4 font-bold text-slate-700 dark:text-slate-200">まだ予定がありません</p>
                <p className="text-sm text-slate-500 mt-1">最初の予定を追加して旅をはじめましょう</p>
                <button onClick={() => onEdit({})} className="btn-primary mt-6">予定を追加</button>
            </div>
        );
    }

    // During the trip the app opens on today; otherwise on the last viewed (or first) day.
    const phase = tripPhase(days, now);
    const fallback = phase.phase === 'during' && phase.todayIndex >= 0 ? days[phase.todayIndex].date : days[0].date;
    const day = days.find((d) => d.date === chosen) || days.find((d) => d.date === fallback);
    const select = (date) => {
        setChosen(date);
        sessionStorage.setItem(SELECTED_KEY, date);
    };

    const prevStay = day.index > 0 ? days[day.index - 1].events.filter(isStay).pop() : null;
    const plan = day.events.filter((e) => !isStay(e));
    const stays = day.events.filter(isStay);
    const isToday = isSameDay(day.fullDate, now);
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const stateOf = (e) => {
        if (!isToday) return 'idle';
        const start = toMinutes(e.time);
        const end = toMinutes(e.endTime);
        if (start === null) return 'idle';
        if (end !== null && start <= nowMin && nowMin < end) return 'current';
        return (end ?? start) < nowMin ? 'past' : 'idle';
    };
    const hasCurrent = isToday && plan.some((e) => stateOf(e) === 'current');
    const nowIndex = isToday && !hasCurrent ? plan.findIndex((e) => (toMinutes(e.time) ?? -1) > nowMin) : -1;
    const showNowAtEnd = isToday && !hasCurrent && nowIndex === -1 && plan.length > 0;

    const open = (event) => {
        const idx = plan.indexOf(event);
        const routeFrom = idx > 0 ? endPlace(plan[idx - 1]) : prevStay?.name;
        onOpenEvent({ event, day, routeFrom });
    };

    const insertBetween = (a, b) => {
        const start = toMinutes(a.endTime || a.time);
        const end = toMinutes(b.time);
        const time = start !== null && end !== null && end > start ? toTime(start + Math.floor((end - start) / 2)) : '';
        onEdit({ date: day.date, time, fromPlace: endPlace(a) });
    };

    const addAtEnd = () => {
        const last = plan[plan.length - 1];
        const base = toMinutes(last?.endTime || last?.time);
        onEdit({ date: day.date, time: base !== null ? toTime(base + 60) : '09:00', fromPlace: last ? endPlace(last) : '' });
    };

    const addDay = () => {
        const last = days[days.length - 1].fullDate;
        onEdit({ newDate: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), time: '09:00' });
    };

    const requestDeleteDay = async (target) => {
        const ok = await confirm({
            title: `${formatDateJa(target.fullDate)} を削除`,
            message: `この日の予定 ${target.events.length}件をすべて削除します。\nスプレッドシートからも削除され、元に戻せません。`,
            confirmLabel: '削除する',
            destructive: true,
        });
        if (!ok) return;
        const neighbour = days[target.index + 1] || days[target.index - 1];
        if (neighbour) select(neighbour.date);
        deleteDay(target.date);
    };

    const onTouchStart = (e) => {
        const t = e.touches[0];
        touch.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e) => {
        if (!touch.current) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touch.current.x;
        const dy = t.clientY - touch.current.y;
        touch.current = null;
        if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;
        const target = days[day.index + (dx < 0 ? 1 : -1)];
        if (target) select(target.date);
    };

    return (
        <div>
            <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-header bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur">
                <DayStrip days={days} selectedDate={day.date} onSelect={select} onAddDay={addDay} today={now} />
            </div>

            <div className="px-4 sm:px-6 pt-3 pb-32 md:pb-16 max-w-3xl" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                <DayHero day={day} prevStay={prevStay} now={now} onDeleteDay={requestDeleteDay} onOpenEvent={open} />

                <div className="mt-4" key={day.date}>
                    {prevStay && plan[0] && (
                        <DepartureRow stay={prevStay} firstEvent={plan[0]} firstPlace={isFlight(plan[0]) ? plan[0].from : startPlace(plan[0])} />
                    )}

                    {plan.map((event, i) => {
                        const next = plan[i + 1];
                        const skipTravel = isFlight(event) || (next && isFlight(next));
                        return (
                            <Fragment key={event.id}>
                                {i === nowIndex && <NowMarker now={now} />}
                                <EventRow event={event} state={stateOf(event)} onOpen={open} />
                                {next && (
                                    <GapRow
                                        from={skipTravel ? null : endPlace(event)}
                                        to={skipTravel ? null : startPlace(next)}
                                        available={gapMinutes(event, next)}
                                        onInsert={() => insertBetween(event, next)}
                                    />
                                )}
                            </Fragment>
                        );
                    })}
                    {showNowAtEnd && <NowMarker now={now} />}

                    {plan.length === 0 && (
                        <p className="py-10 text-center text-sm text-slate-500">この日の予定はまだありません</p>
                    )}

                    <button
                        onClick={addAtEnd}
                        className="mt-3 w-full py-3.5 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-500 hover:text-sky-600 hover:border-sky-400 flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> 予定を追加
                    </button>

                    {stays.length > 0 && (
                        <div className="mt-6 space-y-2">
                            {plan.length > 0 && !isFlight(plan[plan.length - 1]) && (
                                <GapRow from={endPlace(plan[plan.length - 1])} to={stays[0].name} available={null} label="宿へ" />
                            )}
                            {stays.map((stay) => <StayCard key={stay.id} stay={stay} onOpen={open} />)}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={addAtEnd}
                className="fixed right-5 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-8 md:right-8 z-fixed w-14 h-14 rounded-2xl bg-sky-600 text-white shadow-xl shadow-sky-600/30 flex items-center justify-center active:scale-95 transition"
                aria-label="予定を追加"
            >
                <Plus size={26} />
            </button>
        </div>
    );
}
