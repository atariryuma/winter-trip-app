import { useMemo, useState } from 'react';
import { ArrowRight, Pencil, Plus, Wallet } from 'lucide-react';
import { useTrip } from '../../store/context';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { CategoryIcon, SectionTitle } from '../../ui/atoms';
import Sheet from '../../ui/Sheet';
import PayerPicker from './PayerPicker';
import { PAYERS_KEY, shoppingKey } from '../../lib/keys';
import { eventTitle, formatYen, isStay, isTransport } from '../../lib/trip';

const GROUPS = [
    { id: 'stay', label: '宿泊', cls: 'bg-violet-500' },
    { id: 'transport', label: '交通', cls: 'bg-accent-500' },
    { id: 'meal', label: '食事', cls: 'bg-orange-500' },
    { id: 'fun', label: '観光・体験', cls: 'bg-rose-500' },
    { id: 'shopping', label: '買い物', cls: 'bg-pink-500' },
    { id: 'other', label: 'その他', cls: 'bg-slate-400' },
];

const groupOf = (e) => {
    if (isStay(e)) return 'stay';
    if (isTransport(e)) return 'transport';
    if (e.category === 'meal') return 'meal';
    if (e.category === 'sightseeing' || e.category === 'activity') return 'fun';
    if (e.category === 'shopping') return 'shopping';
    return 'other';
};

/** Minimal set of transfers so everyone ends up paying the same share. */
const settle = (paidBy, people) => {
    if (people.length < 2) return [];
    const total = people.reduce((s, p) => s + (paidBy[p] || 0), 0);
    const share = total / people.length;
    const balances = people.map((p) => ({ p, v: (paidBy[p] || 0) - share }));
    const debtors = balances.filter((b) => b.v < -0.5).sort((a, b) => a.v - b.v);
    const creditors = balances.filter((b) => b.v > 0.5).sort((a, b) => b.v - a.v);
    const transfers = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
        const amount = Math.min(-debtors[i].v, creditors[j].v);
        transfers.push({ from: debtors[i].p, to: creditors[j].p, amount: Math.round(amount) });
        debtors[i].v += amount;
        creditors[j].v -= amount;
        if (debtors[i].v > -0.5) i += 1;
        if (creditors[j].v < 0.5) j += 1;
    }
    return transfers;
};

export default function MoneyView() {
    const { currentTrip, days, setPayment, saveTrip } = useTrip();
    const goal = currentTrip?.budget || 0;
    const setGoal = (budget) => saveTrip({ id: currentTrip.id, title: currentTrip.title, theme: currentTrip.theme, budget });
    const [payers] = useLocalStorage(PAYERS_KEY, []);
    const [shopping] = useLocalStorage(shoppingKey(currentTrip?.id), []);
    const [editing, setEditing] = useState(null);
    const [editingGoal, setEditingGoal] = useState(false);

    const expenses = useMemo(() => days.flatMap((day) => day.events
        .filter((e) => Number(e.budgetAmount) > 0)
        .map((event) => ({ event, day, amount: Number(event.budgetAmount), payer: event.budgetPaidBy || '未設定', group: groupOf(event) }))), [days]);

    const shoppingSpent = shopping.filter((i) => i.isPurchased).reduce((s, i) => s + (Number(i.price) || 0), 0);
    const eventTotal = expenses.reduce((s, x) => s + x.amount, 0);
    const total = eventTotal + shoppingSpent;
    const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;

    const byGroup = GROUPS.map((g) => ({
        ...g,
        amount: expenses.filter((x) => x.group === g.id).reduce((s, x) => s + x.amount, 0) + (g.id === 'shopping' ? shoppingSpent : 0),
    })).filter((g) => g.amount > 0);

    const paidBy = expenses.reduce((acc, x) => ({ ...acc, [x.payer]: (acc[x.payer] || 0) + x.amount }), {});
    const people = [...new Set([...payers, ...Object.keys(paidBy).filter((p) => p !== '未設定')])];
    const transfers = settle(paidBy, people);

    const save = ({ amount, payer }) => {
        setPayment(editing.event.id, { amount, payer });
        setEditing(null);
    };

    return (
        <div className="px-4 sm:px-6 pt-2 pb-32 md:pb-16 max-w-3xl">
            <section className="rounded-[1.75rem] bg-gradient-to-br from-slate-900 via-slate-800 to-accent-900 text-white p-5 shadow-xl shadow-slate-900/10">
                <p className="text-xs font-bold text-white/60">旅の支出</p>
                <p className="text-4xl font-black tabular-nums mt-1">{formatYen(total)}</p>
                <button onClick={() => setEditingGoal(true)} className="mt-1 text-sm text-white/70 inline-flex items-center gap-1">
                    {goal > 0 ? `予算 ${formatYen(goal)}` : '予算を設定'} <Pencil size={12} />
                </button>
                {goal > 0 && (
                    <div className="mt-4 h-2.5 rounded-full bg-white/15 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${total > goal ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                )}
                <div className="mt-3 flex justify-between text-sm">
                    <span className={goal > 0 && total > goal ? 'text-rose-300 font-bold' : 'text-white/80'}>
                        {goal > 0 && (total > goal ? `${formatYen(total - goal)} オーバー` : `残り ${formatYen(goal - total)}`)}
                    </span>
                    {days.length > 0 && <span className="text-white/60">1日あたり {formatYen(total / days.length)}</span>}
                </div>
            </section>

            {byGroup.length > 0 && (
                <>
                    <SectionTitle>内訳</SectionTitle>
                    <div className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 p-4">
                        <div className="flex h-3 rounded-full overflow-hidden">
                            {byGroup.map((g) => <div key={g.id} className={g.cls} style={{ width: `${(g.amount / total) * 100}%` }} title={g.label} />)}
                        </div>
                        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                            {byGroup.map((g) => (
                                <li key={g.id} className="flex items-center gap-2 text-sm">
                                    <span className={`w-2.5 h-2.5 rounded-full ${g.cls}`} />
                                    <span className="text-slate-600 dark:text-slate-300">{g.label}</span>
                                    <span className="ml-auto font-bold tabular-nums">{formatYen(g.amount)}</span>
                                </li>
                            ))}
                        </ul>
                        {shoppingSpent > 0 && <p className="mt-3 text-xs text-slate-400">買い物にはこの端末の買い物リスト（購入済み）を含みます</p>}
                    </div>
                </>
            )}

            {people.length > 0 && eventTotal > 0 && (
                <>
                    <SectionTitle>精算（均等割り）</SectionTitle>
                    <div className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 p-4 space-y-3">
                        <ul className="space-y-1.5">
                            {people.map((p) => (
                                <li key={p} className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-300">{p}</span>
                                    <span className="tabular-nums font-bold">{formatYen(paidBy[p] || 0)} 支払い</span>
                                </li>
                            ))}
                        </ul>
                        {transfers.length > 0 ? (
                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                {transfers.map((t) => (
                                    <p key={`${t.from}-${t.to}`} className="flex items-center gap-2 text-sm">
                                        <span className="font-bold">{t.from}</span>
                                        <ArrowRight size={14} className="text-slate-400" />
                                        <span className="font-bold">{t.to}</span>
                                        <span className="ml-auto font-black tabular-nums text-accent-700 dark:text-accent-400">{formatYen(t.amount)}</span>
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className="pt-3 border-t border-slate-100 dark:border-slate-800 text-sm text-emerald-600 font-bold">精算の必要はありません</p>
                        )}
                        {paidBy['未設定'] > 0 && <p className="text-xs text-amber-600">支払者が未設定の {formatYen(paidBy['未設定'])} は精算に含まれていません</p>}
                    </div>
                </>
            )}

            <SectionTitle action={(
                <button onClick={() => setEditing({ pick: true })} className="text-sm font-bold text-accent-700 dark:text-accent-400 inline-flex items-center gap-1">
                    <Plus size={14} /> 支払いを記録
                </button>
            )}>
                支払い一覧
            </SectionTitle>
            {expenses.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-10 text-center text-slate-500">
                    <Wallet className="mx-auto text-slate-300" size={32} />
                    <p className="mt-2 text-sm">予定ごとに支払いを記録すると、合計と精算が自動で出ます</p>
                </div>
            ) : (
                <ul className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {expenses.map((x) => (
                        <li key={x.event.id}>
                            <button onClick={() => setEditing({ event: x.event, day: x.day })} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <CategoryIcon category={x.event.category} size={15} className="w-8 h-8 shrink-0" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-bold truncate">{eventTitle(x.event)}</span>
                                    <span className="block text-xs text-slate-500">{x.day.fullDate.getMonth() + 1}/{x.day.fullDate.getDate()} · {x.payer}</span>
                                </span>
                                <span className="font-bold tabular-nums">{formatYen(x.amount)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <PaymentSheet target={editing} days={days} onClose={() => setEditing(null)} onSave={save} onPick={(event, day) => setEditing({ event, day })} />

            <Sheet open={editingGoal} onClose={() => setEditingGoal(false)} title="旅の予算" size="sm">
                <GoalForm goal={goal} onSave={(v) => { setGoal(v); setEditingGoal(false); }} />
            </Sheet>
        </div>
    );
}

function GoalForm({ goal, onSave }) {
    const [value, setValue] = useState(String(goal));
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSave(Number(value) || 0); }} className="space-y-4">
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <input autoFocus inputMode="numeric" className="field-input pl-8 text-xl font-bold tabular-nums" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))} aria-label="予算" />
            </div>
            <div className="flex flex-wrap gap-2">
                {[100000, 200000, 300000, 500000].map((v) => (
                    <button type="button" key={v} onClick={() => setValue(String(v))} className="chip">{formatYen(v)}</button>
                ))}
            </div>
            <button type="submit" className="btn-primary w-full">保存</button>
        </form>
    );
}

function PaymentSheet({ target, days, onClose, onSave, onPick }) {
    const event = target?.event;
    return (
        <Sheet
            open={!!target}
            onClose={onClose}
            title={event ? eventTitle(event) : 'どの予定の支払い？'}
            subtitle={event ? '支払い金額と支払った人' : null}
        >
            {target?.pick && !event && (
                <div className="space-y-4">
                    {days.map((day) => (
                        <div key={day.date}>
                            <p className="field-label">Day {day.index + 1} · {day.fullDate.getMonth() + 1}/{day.fullDate.getDate()}({day.weekday})</p>
                            <div className="space-y-1">
                                {day.events.map((e) => (
                                    <button key={e.id} onClick={() => onPick(e, day)} className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                                        <CategoryIcon category={e.category} size={14} className="w-7 h-7 shrink-0" />
                                        <span className="flex-1 truncate text-sm">{eventTitle(e)}</span>
                                        {Number(e.budgetAmount) > 0 && <span className="text-xs text-slate-400 tabular-nums">{formatYen(Number(e.budgetAmount))}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {event && <PaymentForm key={event.id} event={event} onSave={onSave} />}
        </Sheet>
    );
}

function PaymentForm({ event, onSave }) {
    const [amount, setAmount] = useState(event.budgetAmount || '');
    const [payer, setPayer] = useState(event.budgetPaidBy || '');
    const had = Number(event.budgetAmount) > 0;
    return (
        <form onSubmit={(e) => { e.preventDefault(); if (amount) onSave({ amount, payer }); }} className="space-y-4">
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <input autoFocus inputMode="numeric" className="field-input pl-8 text-xl font-bold tabular-nums" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))} placeholder="0" aria-label="金額" />
            </div>
            <div className="flex flex-wrap gap-2">
                {[1000, 3000, 5000, 10000, 20000].map((v) => (
                    <button type="button" key={v} onClick={() => setAmount(String(v))} className="chip">{formatYen(v)}</button>
                ))}
            </div>
            <PayerPicker value={payer} onChange={setPayer} />
            <div className="flex gap-3 pt-2">
                {had && (
                    <button type="button" onClick={() => onSave({ amount: '', payer: '' })} className="btn-secondary text-rose-600">
                        記録を消す
                    </button>
                )}
                <button type="submit" disabled={!amount || !payer} className="btn-primary flex-1 disabled:opacity-40">保存</button>
            </div>
        </form>
    );
}
