import { useState } from 'react';
import { CalendarClock, Sparkles, Trash2 } from 'lucide-react';
import Sheet from '../../ui/Sheet';
import { useConfirm } from '../../ui/contexts';
import { useTrip } from '../../store/context';
import { SEASONS, THEME_OPTIONS, seasonOf } from '../../lib/season';
import { daysBetween, fromIsoDate, isoDate } from '../../lib/trip';
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

    const start = startIso ? fromIsoDate(startIso) : null;
    const autoSeason = seasonOf(start || trip?.start || today);
    const hasDays = trip?.days.length > 0;
    const shift = hasDays && start ? daysBetween(trip.days[0].fullDate, start) : 0;
    const eventCount = trip?.days.reduce((n, d) => n + d.events.length, 0) || 0;

    const submit = (e) => {
        e.preventDefault();
        setTouched(true);
        if (!title.trim()) return;
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
                    <input id="trip-start" type="date" className="field-input" value={startIso} onChange={(e) => setStartIso(e.target.value)} />
                    {hasDays && shift !== 0 && (
                        <p className="mt-2 px-1 text-xs font-bold text-accent-700 dark:text-accent-400 flex items-start gap-1">
                            <CalendarClock size={14} className="shrink-0 mt-px" />
                            保存すると、すべての日程が{Math.abs(shift)}日{shift > 0 ? '後ろ' : '前'}にずれます
                        </p>
                    )}
                    {trip?.hasUndatedDays && (
                        <p className="mt-2 rounded-2xl bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                            年が保存されていない日付があり、{trip.start?.getFullYear()}年の旅行として表示しています。
                            出発日が正しいか確認して保存すると、年つきで保存されます。
                        </p>
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
                <button type="submit" className="btn-primary flex-1">{trip ? '保存する' : '作成する'}</button>
            </div>
        </form>
    );
}
