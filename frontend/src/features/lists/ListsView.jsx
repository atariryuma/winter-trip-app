import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Briefcase, Check, FileText, Gift, Info, Package, RotateCcw, Shirt, ShoppingBag, Smartphone, Trash2,
} from 'lucide-react';
import api from '../../lib/api';
import { formatYen } from '../../lib/trip';
import { useToast } from '../../ui/contexts';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SectionTitle, Spinner } from '../../ui/atoms';
import { shoppingKey } from '../../lib/keys';
import { useTrip } from '../../store/context';

const PACKING_CATEGORIES = [
    { id: 'documents', label: '書類・貴重品', icon: FileText },
    { id: 'clothing', label: '衣類', icon: Shirt },
    { id: 'electronics', label: '電子機器', icon: Smartphone },
    { id: 'toiletries', label: '洗面用具', icon: Package },
    { id: 'other', label: 'その他', icon: Briefcase },
];

const SHOPPING_CATEGORIES = [
    { id: 'souvenir', label: 'お土産', icon: Gift },
    { id: 'daily', label: '日用品', icon: ShoppingBag },
    { id: 'other', label: 'その他', icon: Package },
];

const truthy = (v) => v === true || v === 'true' || v === 'TRUE';

const fetchItems = () => api.getPackingList().then((data) =>
    (data || []).map((i) => ({ ...i, isChecked: truthy(i.isChecked), isShared: truthy(i.isShared) })));

export default function ListsView() {
    const [tab, setTab] = useState('packing');
    return (
        <div className="px-4 sm:px-6 pt-2 pb-32 md:pb-16 max-w-3xl">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800" role="tablist">
                {[['packing', '持ち物'], ['shopping', '買い物・お土産']].map(([id, label]) => (
                    <button
                        key={id}
                        role="tab"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition ${tab === id ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div className="mt-4">{tab === 'packing' ? <PackingList /> : <ShoppingList />}</div>
        </div>
    );
}

function ProgressCard({ done, total, label }) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
        <div className="flex items-center gap-4 rounded-[1.75rem] bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 p-5">
            <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" className="stroke-slate-100 dark:stroke-slate-800" />
                    <circle
                        cx="18" cy="18" r="15.5" fill="none" strokeWidth="4" strokeLinecap="round"
                        className="stroke-emerald-500 transition-all"
                        strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-black tabular-nums">{pct}%</span>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <p className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                    {done}<span className="text-base text-slate-400"> / {total}</span>
                </p>
            </div>
        </div>
    );
}

function AddRow({ categories, onAdd, placeholder, extra }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState(categories[0].id);
    const submit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({ name: name.trim(), category });
        setName('');
    };
    return (
        <form onSubmit={submit} className="mt-4 rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 p-3">
            <div className="flex gap-2">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={placeholder}
                    className="field-input flex-1 !bg-slate-50 dark:!bg-slate-800"
                    aria-label={placeholder}
                />
                <button type="submit" disabled={!name.trim()} className="btn-primary !px-5 disabled:opacity-40">追加</button>
            </div>
            <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide">
                {categories.map((c) => (
                    <button
                        type="button"
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        aria-pressed={category === c.id}
                        className={`chip !py-1.5 !text-xs shrink-0 ${category === c.id ? 'chip-selected' : ''}`}
                    >
                        <c.icon size={13} /> {c.label}
                    </button>
                ))}
            </div>
            {extra}
        </form>
    );
}

function CheckRow({ checked, onToggle, title, meta, onDelete }) {
    return (
        <li className="flex items-center gap-1 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <button onClick={onToggle} className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left" aria-pressed={checked}>
                <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center transition ${checked ? 'bg-emerald-500 text-white' : 'ring-2 ring-slate-300 dark:ring-slate-600'}`}>
                    {checked && <Check size={16} strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                    <span className={`block truncate ${checked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{title}</span>
                    {meta && <span className="block text-xs text-slate-400 truncate">{meta}</span>}
                </span>
            </button>
            <button onClick={onDelete} className="p-2.5 mr-1 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" aria-label={`${title} を削除`}>
                <Trash2 size={16} />
            </button>
        </li>
    );
}

function PackingList() {
    const { showToast } = useToast();
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState('loading');
    const pendingChecks = useRef(new Map());
    const flushTimer = useRef(null);

    const load = useCallback(() => fetchItems().then(
        (list) => { setItems(list); setStatus('ready'); },
        () => setStatus('error'),
    ), []);

    useEffect(() => {
        let alive = true;
        fetchItems().then(
            (list) => { if (alive) { setItems(list); setStatus('ready'); } },
            () => { if (alive) setStatus('error'); },
        );
        return () => { alive = false; };
    }, []);

    const flush = useCallback(() => {
        clearTimeout(flushTimer.current);
        if (pendingChecks.current.size === 0) return;
        const batch = [...pendingChecks.current.values()];
        pendingChecks.current.clear();
        api.savePackingItems(batch).catch(() => {
            showToast('error', 'チェックを保存できませんでした');
            load();
        });
    }, [load, showToast]);

    useEffect(() => {
        window.addEventListener('pagehide', flush);
        return () => {
            window.removeEventListener('pagehide', flush);
            flush();
        };
    }, [flush]);

    const queue = (changed) => {
        changed.forEach((i) => pendingChecks.current.set(i.id, i));
        clearTimeout(flushTimer.current);
        flushTimer.current = setTimeout(flush, 1000);
    };

    const toggle = (item) => {
        const updated = { ...item, isChecked: !item.isChecked };
        setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
        queue([updated]);
    };

    const add = async ({ name, category }) => {
        const draft = { id: '', name, category, isChecked: false, isShared: false, assignee: 'みんな' };
        const tempId = `tmp-${Date.now()}`;
        setItems((prev) => [...prev, { ...draft, id: tempId }]);
        try {
            const saved = await api.savePackingItem(draft);
            setItems((prev) => prev.map((i) => (i.id === tempId ? { ...saved, isChecked: truthy(saved.isChecked) } : i)));
        } catch {
            setItems((prev) => prev.filter((i) => i.id !== tempId));
            showToast('error', '追加できませんでした');
        }
    };

    const remove = async (item) => {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        try {
            await api.deletePackingItem(item.id);
            showToast('info', `「${item.name}」を削除しました`, {
                action: {
                    label: '元に戻す',
                    onClick: async () => {
                        setItems((prev) => [...prev, item]);
                        try {
                            await api.savePackingItem(item);
                        } catch {
                            showToast('error', '元に戻せませんでした');
                            load();
                        }
                    },
                },
            });
        } catch {
            setItems((prev) => [...prev, item]);
            showToast('error', '削除できませんでした');
        }
    };

    const resetAll = () => {
        const checked = items.filter((i) => i.isChecked).map((i) => ({ ...i, isChecked: false }));
        if (checked.length === 0) return;
        setItems((prev) => prev.map((i) => ({ ...i, isChecked: false })));
        queue(checked);
        showToast('success', 'チェックをすべて外しました（帰りの荷造りにどうぞ）');
    };

    const groups = useMemo(() => PACKING_CATEGORIES.map((c) => ({
        ...c,
        items: items
            .filter((i) => (PACKING_CATEGORIES.some((p) => p.id === i.category) ? i.category : 'other') === c.id)
            .sort((a, b) => Number(a.isChecked) - Number(b.isChecked)),
    })).filter((g) => g.items.length > 0), [items]);

    if (status === 'loading') {
        return <div className="py-16 flex justify-center text-slate-400"><Spinner className="w-7 h-7" /></div>;
    }
    if (status === 'error') {
        return (
            <div className="py-16 text-center">
                <p className="text-sm text-slate-500">持ち物リストを読み込めませんでした</p>
                <button onClick={() => { setStatus('loading'); load(); }} className="btn-secondary mt-4 mx-auto">再読み込み</button>
            </div>
        );
    }

    const done = items.filter((i) => i.isChecked).length;

    return (
        <>
            <ProgressCard done={done} total={items.length} label="準備できた持ち物（家族で共有・全旅行で共通）" />
            <AddRow categories={PACKING_CATEGORIES} onAdd={add} placeholder="持ち物を追加（例: モバイルバッテリー）" />
            {groups.map((g) => (
                <section key={g.id}>
                    <SectionTitle>
                        <g.icon size={13} className="inline -mt-0.5 mr-1" />
                        {g.label}（{g.items.filter((i) => i.isChecked).length}/{g.items.length}）
                    </SectionTitle>
                    <ul className="rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 p-1.5">
                        {g.items.map((item) => (
                            <CheckRow
                                key={item.id}
                                checked={item.isChecked}
                                onToggle={() => toggle(item)}
                                title={item.name}
                                meta={item.assignee && item.assignee !== 'みんな' ? item.assignee : null}
                                onDelete={() => remove(item)}
                            />
                        ))}
                    </ul>
                </section>
            ))}
            {done > 0 && (
                <button onClick={resetAll} className="btn-secondary mt-6 mx-auto">
                    <RotateCcw size={16} /> チェックをすべて外す
                </button>
            )}
        </>
    );
}

function ShoppingList() {
    const { currentTrip } = useTrip();
    const [items, setItems] = useLocalStorage(shoppingKey(currentTrip?.id), []);
    const [recipient, setRecipient] = useState('');
    const [price, setPrice] = useState('');

    const add = ({ name, category }) => {
        setItems((prev) => [...prev, {
            id: Date.now().toString(),
            name,
            category,
            recipient: recipient.trim(),
            price: price ? Number(price) : 0,
            isPurchased: false,
            createdAt: new Date().toISOString(),
        }]);
        setRecipient('');
        setPrice('');
    };

    const toggle = (item) => setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isPurchased: !i.isPurchased } : i)));
    const remove = (item) => setItems((prev) => prev.filter((i) => i.id !== item.id));

    const done = items.filter((i) => i.isPurchased);
    const spent = done.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
    const sorted = [...items].sort((a, b) => Number(a.isPurchased) - Number(b.isPurchased));

    return (
        <>
            <ProgressCard done={done.length} total={items.length} label={`購入済み · ${formatYen(spent)}`} />
            <p className="mt-3 px-1 text-xs text-slate-500 flex items-center gap-1">
                <Info size={12} /> 買い物リストはこの端末だけに保存されます
            </p>
            <AddRow
                categories={SHOPPING_CATEGORIES}
                onAdd={add}
                placeholder="買う物を追加（例: ご当地のお菓子）"
                extra={(
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="渡す相手（任意）" className="field-input !py-2 !text-sm" aria-label="渡す相手" />
                        <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="予算 ¥（任意）" className="field-input !py-2 !text-sm tabular-nums" aria-label="予算" />
                    </div>
                )}
            />
            {sorted.length > 0 && (
                <ul className="mt-4 rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/70 dark:ring-slate-800 p-1.5">
                    {sorted.map((item) => (
                        <CheckRow
                            key={item.id}
                            checked={item.isPurchased}
                            onToggle={() => toggle(item)}
                            title={item.name}
                            meta={[item.recipient && `→ ${item.recipient}`, item.price ? formatYen(item.price) : null].filter(Boolean).join(' · ')}
                            onDelete={() => remove(item)}
                        />
                    ))}
                </ul>
            )}
        </>
    );
}
