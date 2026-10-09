import { useState } from 'react';
import { ArrowDown, Plus } from 'lucide-react';
import Sheet from '../../ui/Sheet';
import PlaceInput from './PlaceInput';
import PayerPicker from '../money/PayerPicker';
import { useTrip } from '../../store/context';
import { CATEGORIES, STATUSES, isConfirmed, toDateString, typeForCategory } from '../../lib/trip';

const CATEGORY_ORDER = ['flight', 'train', 'bus', 'transfer', 'hotel', 'meal', 'sightseeing', 'shopping', 'activity'];
const NEW_DATE = '__new__';

const emptyFields = (time = '') => ({
    category: 'sightseeing',
    status: 'planned',
    name: '',
    time,
    endTime: '',
    from: '',
    to: '',
    bookingRef: '',
    details: '',
    budgetAmount: '',
    budgetPaidBy: '',
});

const fieldsFrom = (event) => ({
    ...emptyFields(),
    ...Object.fromEntries(Object.keys(emptyFields()).map((k) => [k, event[k] ?? ''])),
    status: isConfirmed(event) ? 'confirmed' : event.status || 'planned',
});

// "2027-01-03" → "1/3"
const isoToDateString = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return toDateString(new Date(y, m - 1, d));
};
const toIso = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * draft: { event?, date?, newDate?: Date, time?, fromPlace? }
 *  - event: edit an existing event
 *  - newDate: preselect a date that has no events yet (adding a day)
 */
export default function EventEditorSheet({ draft, onClose }) {
    const open = !!draft;
    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={draft?.event ? '予定を編集' : '予定を追加'}
            size="md"
        >
            {/* Remount per draft so the form starts from the right values. */}
            {open && <EditorForm key={draft.event?.id || `${draft.date}-${draft.time}`} draft={draft} onClose={onClose} />}
        </Sheet>
    );
}

function EditorForm({ draft, onClose }) {
    const { days, saveEvent } = useTrip();
    const original = draft.event || null;
    const [fields, setFields] = useState(() => {
        if (original) return fieldsFrom(original);
        return { ...emptyFields(draft.time || ''), from: draft.fromPlace || '' };
    });
    const [dateChoice, setDateChoice] = useState(draft.newDate ? NEW_DATE : draft.date || days[0]?.date || NEW_DATE);
    const [newDateIso, setNewDateIso] = useState(() => {
        if (draft.newDate) return toIso(draft.newDate);
        const last = days[days.length - 1]?.fullDate;
        return last ? toIso(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)) : toIso(new Date());
    });
    const [touched, setTouched] = useState(false);

    const set = (key) => (value) => setFields((f) => ({ ...f, [key]: value }));
    const transport = typeForCategory(fields.category) === 'transport';
    const targetDate = dateChoice === NEW_DATE ? (newDateIso ? isoToDateString(newDateIso) : '') : dateChoice;

    const resolvedName = fields.name.trim()
        || (transport && (fields.from || fields.to) ? `${fields.from || '?'} → ${fields.to || '?'}` : '');
    const errors = {
        name: !resolvedName ? (transport ? '出発地・到着地か名前を入力してください' : '名前を入力してください') : null,
        date: !targetDate ? '日付を選んでください' : null,
    };
    const valid = !errors.name && !errors.date;

    const submit = (e) => {
        e.preventDefault();
        setTouched(true);
        if (!valid) return;
        const amount = String(fields.budgetAmount).replace(/[^\d]/g, '');
        saveEvent({
            original,
            originalDate: draft.date,
            date: targetDate,
            fields: {
                ...fields,
                name: resolvedName,
                budgetAmount: amount,
                budgetPaidBy: amount ? fields.budgetPaidBy : '',
            },
        });
        onClose();
    };

    return (
        <form onSubmit={submit} className="space-y-5" noValidate>
            <fieldset>
                <legend className="field-label">種類</legend>
                <div className="flex flex-wrap gap-2">
                    {CATEGORY_ORDER.map((key) => {
                        const meta = CATEGORIES[key];
                        const Icon = meta.icon;
                        const selected = fields.category === key;
                        return (
                            <button
                                type="button"
                                key={key}
                                onClick={() => set('category')(key)}
                                aria-pressed={selected}
                                className={`chip ${selected ? 'chip-selected' : ''}`}
                            >
                                <Icon size={15} /> {meta.label}
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            {transport ? (
                <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2">
                    <PlaceInput label="出発地" value={fields.from} onChange={set('from')} placeholder="例: 名古屋駅" />
                    <div className="flex justify-center text-slate-400"><ArrowDown size={16} /></div>
                    <PlaceInput label="到着地" value={fields.to} onChange={set('to')} placeholder="例: 高山駅" large />
                    <div className="pt-2">
                        <label className="field-label" htmlFor="ev-name">便名・列車名（任意）</label>
                        <input
                            id="ev-name"
                            className="field-input"
                            value={fields.name}
                            onChange={(e) => set('name')(e.target.value)}
                            placeholder={fields.from || fields.to ? `未入力なら「${fields.from || '?'} → ${fields.to || '?'}」` : '例: 特急ひだ 15号'}
                        />
                    </div>
                </div>
            ) : (
                <PlaceInput
                    label={fields.category === 'hotel' ? '宿の名前' : '名前・場所'}
                    value={fields.name}
                    onChange={set('name')}
                    placeholder={fields.category === 'hotel' ? '例: ホテル ウッド 高山' : '例: 白川郷 展望台'}
                    autoFocus={!original}
                    large
                />
            )}
            {touched && errors.name && <p className="text-sm text-rose-600 -mt-3">{errors.name}</p>}

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label" htmlFor="ev-time">{fields.category === 'hotel' ? 'チェックイン' : '開始'}</label>
                    <input id="ev-time" type="time" className="field-input" value={fields.time} onChange={(e) => set('time')(e.target.value)} />
                </div>
                <div>
                    <label className="field-label" htmlFor="ev-end">{fields.category === 'hotel' ? 'チェックアウト' : '終了'}</label>
                    <input id="ev-end" type="time" className="field-input" value={fields.endTime} onChange={(e) => set('endTime')(e.target.value)} />
                </div>
            </div>

            <div>
                <label className="field-label" htmlFor="ev-date">日付</label>
                <select id="ev-date" className="field-input" value={dateChoice} onChange={(e) => setDateChoice(e.target.value)}>
                    {days.map((d) => (
                        <option key={d.date} value={d.date}>
                            Day {d.index + 1} · {d.fullDate.getMonth() + 1}/{d.fullDate.getDate()}({d.weekday})
                        </option>
                    ))}
                    <option value={NEW_DATE}>別の日を指定…</option>
                </select>
                {dateChoice === NEW_DATE && (
                    <input
                        type="date"
                        className="field-input mt-2"
                        value={newDateIso}
                        onChange={(e) => setNewDateIso(e.target.value)}
                        aria-label="新しい日付"
                    />
                )}
                {original && targetDate && targetDate !== draft.date && (
                    <p className="mt-1 px-1 text-xs text-sky-600 dark:text-sky-400">保存すると {targetDate} に移動します</p>
                )}
                {touched && errors.date && <p className="text-sm text-rose-600 mt-1">{errors.date}</p>}
            </div>

            <fieldset>
                <legend className="field-label">状態</legend>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(STATUSES).map(([key, meta]) => (
                        <button
                            type="button"
                            key={key}
                            onClick={() => set('status')(key)}
                            aria-pressed={fields.status === key}
                            className={`chip justify-center ${fields.status === key ? 'chip-selected' : ''}`}
                        >
                            {meta.label}
                        </button>
                    ))}
                </div>
            </fieldset>

            <div>
                <label className="field-label" htmlFor="ev-ref">予約番号</label>
                <input
                    id="ev-ref"
                    className="field-input font-mono"
                    value={fields.bookingRef}
                    onChange={(e) => set('bookingRef')(e.target.value)}
                    placeholder="確認番号・座席など"
                    autoCapitalize="characters"
                />
                {fields.bookingRef && fields.status !== 'confirmed' && (
                    <button type="button" onClick={() => set('status')('confirmed')} className="mt-1 px-1 text-xs font-bold text-sky-600 dark:text-sky-400 inline-flex items-center gap-1">
                        <Plus size={12} /> 「予約済」にする
                    </button>
                )}
            </div>

            <div>
                <label className="field-label" htmlFor="ev-memo">メモ</label>
                <textarea
                    id="ev-memo"
                    rows={3}
                    className="field-input resize-none leading-relaxed"
                    value={fields.details}
                    onChange={(e) => set('details')(e.target.value)}
                    placeholder="座席、持ち物、注意事項など"
                />
            </div>

            <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
                <div>
                    <label className="field-label" htmlFor="ev-amount">支払い（任意）</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                        <input
                            id="ev-amount"
                            inputMode="numeric"
                            className="field-input pl-8 tabular-nums"
                            value={fields.budgetAmount}
                            onChange={(e) => set('budgetAmount')(e.target.value.replace(/[^\d]/g, ''))}
                            placeholder="0"
                        />
                    </div>
                </div>
                {fields.budgetAmount && (
                    <PayerPicker value={fields.budgetPaidBy} onChange={set('budgetPaidBy')} />
                )}
            </div>

            <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-[env(safe-area-inset-bottom)] bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                <button type="submit" className="btn-primary w-full">
                    {original ? '保存する' : '追加する'}
                </button>
            </div>
        </form>
    );
}
