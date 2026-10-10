import { useState } from 'react';
import { CalendarClock, Sparkles, Trash2 } from 'lucide-react';
import Sheet from '../../ui/Sheet';
import { useConfirm } from '../../ui/contexts';
import { useTrip } from '../../store/context';
import { SEASONS, THEME_OPTIONS, seasonOf } from '../../lib/season';
import { addDays, daysBetween, formatRange, fromIsoDate, isoDate } from '../../lib/trip';
import { DEFAULT_TRIP_TITLE } from '../../lib/keys';

/** draft: { trip } to edit, {} to create */
export default function TripEditorSheet({ draft, onClose }) {
    const open = !!draft;
    return (
        <Sheet open={open} onClose={onClose} title={draft?.trip ? '旅行を編集' : '新しい旅行'}>
            {open && <TripForm key={draft.trip?.id || 'new'} trip={draft.trip || null} onClose={onClose} />}
        </Sheet>
    );
}

function TripForm({ trip, onClose }) {
    const { saveTrip, deleteTrip, supportsTrips, today } = useTrip();
    const { confirm } = useConfirm();
    const [title, setTitle] = useState(trip?.title || '');
    const [startIso, setStartIso] = useState(trip?.start ? isoDate(trip.start) : '');
    const [theme, setTheme] = useState(trip?.theme || 'auto');
    const [budget, setBudget] = useState(trip?.budget ? String(trip.budget) : '');
    const [touched, setTouched] = useState(false);
    // Dates saved without a year can't tell a past trip from an upcoming one,
    // so the year must be chosen before they are saved with it.
    const needsYear = supportsTrips && !!trip?.hasUndatedDays;
    const [yearChosen, setYearChosen] = useState(false);

    const start = startIso ? fromIsoDate(startIso) : null;
    const autoSeason = seasonOf(start || trip?.start || today);
    const hasDays = trip?.days.length > 0;
    const shift = hasDays && start ? daysBetween(trip.days[0].fullDate, start) : 0;
    const eventCount = trip?.days.reduce((n, d) => n + d.events.length, 0) || 0;

    const submit = (e) => {
        e.preventDefault();
        setTouched(true);
        if (!title.trim() || (needsYear && !yearChosen)) return;
        saveTrip(
            { id: trip?.id, title: title.trim(), theme, budget: Number(budget) || 0 },
            supportsTrips ? start : null,
        );
        onClose();
    };

    const remove = async () => {
        const ok = await confirm({
            title: `「${trip.title}」を削除`,
            message: `この旅行と予定 ${eventCount}件を削除します。\nスプレッドシートからも削除され、元に戻せません。`,
            confirmLabel: '削除する',
            destructive: true,
        });
        if (!ok) return;
        deleteTrip(trip.id);
        onClose();
    };

    return (
        <form onSubmit={submit} className="space-y-5" noValidate>
            <div>
                <label className="field-label" htmlFor="trip-title">旅行の名前</label>
                <input
                    id="trip-title"
                    className="field-input text-base font-bold"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`例: 夏の沖縄、${DEFAULT_TRIP_TITLE}`}
                    autoFocus={!trip}
                />
                {touched && !title.trim() && <p className="mt-1 px-1 text-sm text-rose-600">名前を入力してください</p>}
            </div>

            {supportsTrips ? (
                <div>
                    <label className="field-label" htmlFor="trip-start">出発日</label>
                    <input
                        id="trip-start"
                        type="date"
                        className="field-input"
                        value={startIso}
                        onChange={(e) => {
                            setStartIso(e.target.value);
                            setYearChosen(true);
                        }}
                    />
                    {hasDays && shift !== 0 && (
                        <p className="mt-2 px-1 text-xs font-bold text-accent-700 dark:text-accent-400 flex items-start gap-1">
                            <CalendarClock size={14} className="shrink-0 mt-px" />
                            保存すると、すべての日程が{Math.abs(shift)}日{shift > 0 ? '後ろ' : '前'}にずれます
                        </p>
                    )}
                    {needsYear && (
                        <YearChoice
                            trip={trip}
                            today={today}
                            value={yearChosen ? startIso : null}
                            onChoose={(iso) => {
                                setStartIso(iso);
                                setYearChosen(true);
                            }}
                        />
                    )}
                    {touched && needsYear && !yearChosen && (
                        <p className="mt-1 px-1 text-sm text-rose-600">どちらの旅行か選んでください</p>
                    )}
                </div>
            ) : (
                <p className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-xs text-slate-500">
                    出発日の変更と旅行の追加は、バックエンド（Google Apps Script）を更新すると使えます。
                </p>
            )}

            <fieldset>
                <legend className="field-label">テーマ</legend>
                <div className="flex flex-wrap gap-2">
                    {THEME_OPTIONS.map((option) => {
                        const isAuto = option === 'auto';
                        const Icon = isAuto ? Sparkles : SEASONS[option].icon;
                        return (
                            <button
                                type="button"
                                key={option}
                                onClick={() => setTheme(option)}
                                aria-pressed={theme === option}
                                data-season={isAuto ? autoSeason : option}
                                className={`chip ${theme === option ? '!bg-accent-700 !text-white !ring-accent-700' : ''}`}
                            >
                                <Icon size={15} className={theme === option ? '' : 'text-accent-600'} />
                                {isAuto ? `自動（${SEASONS[autoSeason].label}）` : SEASONS[option].label}
                            </button>
                        );
                    })}
                </div>
                <p className="mt-1.5 px-1 text-xs text-slate-400">自動は出発日の季節に合わせて色とアイコンが変わります</p>
            </fieldset>

            <div>
                <label className="field-label" htmlFor="trip-budget">予算（任意）</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                    <input
                        id="trip-budget"
                        inputMode="numeric"
                        className="field-input pl-8 tabular-nums"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ''))}
                        placeholder="0"
                    />
                </div>
            </div>

            <div className="flex gap-3 pt-1">
                {trip && supportsTrips && (
                    <button type="button" onClick={remove} className="btn-secondary text-rose-600" aria-label="この旅行を削除">
                        <Trash2 size={16} />
                    </button>
                )}
                <button type="submit" className="btn-primary flex-1 disabled:opacity-40" disabled={needsYear && !yearChosen && touched}>
                    {trip ? '保存する' : '作成する'}
                </button>
            </div>
        </form>
    );
}

/** Pick which year a trip saved without years belongs to: the past or the upcoming occurrence. */
function YearChoice({ trip, today, value, onChoose }) {
    const length = daysBetween(trip.days[0].fullDate, trip.days[trip.days.length - 1].fullDate);
    const inferred = trip.days[0].fullDate;
    const candidates = [-1, 0, 1].map((offset) => {
        const start = new Date(inferred.getFullYear() + offset, inferred.getMonth(), inferred.getDate());
        const end = addDays(start, length);
        return { iso: isoDate(start), start, end, past: daysBetween(end, today) > 0 };
    });
    // The most recent past occurrence and the next one to come
    const options = [candidates.filter((c) => c.past).pop(), candidates.find((c) => !c.past)].filter(Boolean);
    return (
        <fieldset className="mt-2 rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-3">
            <legend className="sr-only">旅行の年</legend>
            <p className="text-xs text-amber-800 dark:text-amber-200">
                この旅行の日付には年が保存されていません。どちらの旅行か選んでください。
            </p>
            <div className="mt-2 grid gap-2">
                {options.map((o) => (
                    <button
                        type="button"
                        key={o.iso}
                        onClick={() => onChoose(o.iso)}
                        aria-pressed={value === o.iso}
                        className={`rounded-xl px-3 py-2.5 text-left ring-1 ${value === o.iso
                            ? 'bg-accent-700 text-white ring-accent-700'
                            : 'bg-white dark:bg-slate-900 ring-amber-200 dark:ring-amber-500/30 text-slate-800 dark:text-slate-100'
                        }`}
                    >
                        <span className="block text-sm font-bold">{o.past ? '終わった旅行' : 'これからの旅行'}</span>
                        <span className={`block text-xs ${value === o.iso ? 'text-white/80' : 'text-slate-500'}`}>{formatRange(o.start, o.end)}</span>
                    </button>
                ))}
            </div>
        </fieldset>
    );
}
