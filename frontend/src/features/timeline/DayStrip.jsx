import { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { isSameDay, isStay, needsBooking } from '../../lib/trip';

export default function DayStrip({ days, selectedDate, onSelect, onAddDay, today }) {
    const refs = useRef({});

    useEffect(() => {
        refs.current[selectedDate]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, [selectedDate]);

    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-6 py-2" role="tablist" aria-label="日付">
            {days.map((day) => {
                const selected = day.date === selectedDate;
                const isToday = isSameDay(day.fullDate, today);
                const alert = day.events.some(needsBooking);
                const hasStay = day.events.some(isStay);
                return (
                    <button
                        key={day.date}
                        ref={(el) => { refs.current[day.date] = el; }}
                        role="tab"
                        aria-selected={selected}
                        onClick={() => onSelect(day.date)}
                        className={`relative shrink-0 w-[4.25rem] rounded-2xl py-2 flex flex-col items-center transition-colors ${selected
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
                            : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-800'
                        }`}
                    >
                        <span className={`text-[10px] font-bold tracking-wider ${selected ? 'opacity-70' : 'text-slate-400'}`}>
                            {isToday ? '今日' : `DAY ${day.index + 1}`}
                        </span>
                        <span className="text-xl font-black leading-tight tabular-nums">{day.fullDate.getDate()}</span>
                        <span className={`text-[11px] font-bold ${day.weekday === '日' ? 'text-rose-500' : day.weekday === '土' ? 'text-sky-500' : ''}`}>
                            {day.fullDate.getMonth() + 1}月·{day.weekday}
                        </span>
                        <span className="flex gap-1 mt-1 h-1.5">
                            {alert && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="要予約あり" />}
                            {hasStay && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" title="宿あり" />}
                        </span>
                        {isToday && !selected && <span className="absolute inset-0 rounded-2xl ring-2 ring-sky-500 pointer-events-none" />}
                    </button>
                );
            })}
            <button
                onClick={onAddDay}
                className="shrink-0 w-12 rounded-2xl flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:text-sky-600"
                aria-label="日を追加"
            >
                <Plus size={20} />
            </button>
        </div>
    );
}
