import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    CheckCircle2, Circle, Plus, Trash2, Loader2, X,
    Shirt, Smartphone, Package, FileText, Briefcase,
    ShoppingBag, Gift, DollarSign, User, Users
} from 'lucide-react';
import server from '../../api/gas';

// Packing categories
const PACKING_CATEGORIES = [
    { id: 'clothing', label: '衣類', icon: Shirt },
    { id: 'electronics', label: '電子機器', icon: Smartphone },
    { id: 'toiletries', label: '洗面用具', icon: Package },
    { id: 'documents', label: '書類・貴重品', icon: FileText },
    { id: 'other', label: 'その他', icon: Briefcase },
];

// Shopping categories
const SHOPPING_CATEGORIES = [
    { id: 'souvenir', label: 'お土産', icon: Gift },
    { id: 'daily', label: '日用品', icon: ShoppingBag },
    { id: 'other', label: 'その他', icon: Package },
];

export default function PackingList() {
    const [activeTab, setActiveTab] = useState('packing'); // 'packing' | 'shopping'

    // Packing list state
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', category: 'clothing' });

    // Shopping list state
    const [shoppingItems, setShoppingItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('shoppingList') || '[]');
        } catch { return []; }
    });
    const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
    const [newShoppingItem, setNewShoppingItem] = useState({
        name: '', category: 'souvenir', recipient: '', buyer: '', price: '', isPurchased: false
    });

    // Lock to prevent double-toggle race condition
    const toggleLock = useRef(new Set());

    // Save shopping list to localStorage
    useEffect(() => {
        localStorage.setItem('shoppingList', JSON.stringify(shoppingItems));
    }, [shoppingItems]);

    // Fetch packing items
    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await server.getPackingList();
            setItems(data);
        } catch (err) {
            console.error('Failed to fetch packing list:', err);
        } finally {
            setLoading(false);
        }
    };

    // Packing item handlers
    const handleToggleCheck = async (item) => {
        const updatedItem = { ...item, isChecked: !item.isChecked };
        setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));

        try {
            await server.updatePackingItem({
                ...updatedItem,
                isShared: String(updatedItem.isShared || false),
                isChecked: String(updatedItem.isChecked)
            });
        } catch (err) {
            console.error('Update failed:', err);
            setItems(prev => prev.map(i => i.id === item.id ? item : i));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('削除しますか？')) return;

        const originalItems = [...items];
        setItems(prev => prev.filter(i => i.id !== id));

        try {
            await server.deletePackingItem(id);
        } catch (err) {
            console.error('Delete failed:', err);
            setItems(originalItems);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newItem.name.trim()) return;

        try {
            setSubmitting(true);
            const savedItem = await server.updatePackingItem({
                ...newItem,
                isChecked: false,
                isShared: 'false',
                assignee: 'みんな'
            });
            setItems(prev => [...prev, savedItem]);
            setNewItem({ name: '', category: 'clothing' });
            setIsAddModalOpen(false);
        } catch (err) {
            console.error('Add failed:', err);
            alert('追加に失敗しました');
        } finally {
            setSubmitting(false);
        }
    };

    // Shopping item handlers
    const handleAddShoppingItem = (e) => {
        e.preventDefault();
        if (!newShoppingItem.name.trim()) return;

        const item = {
            ...newShoppingItem,
            id: Date.now().toString(),
            price: newShoppingItem.price ? parseInt(newShoppingItem.price) : 0,
            isPurchased: false,
            createdAt: new Date().toISOString()
        };

        setShoppingItems(prev => [...prev, item]);
        setNewShoppingItem({ name: '', category: 'souvenir', recipient: '', buyer: '', price: '', isPurchased: false });
        setIsShoppingModalOpen(false);
    };

    const handleToggleShoppingPurchased = (item) => {
        // Prevent double-toggle race condition
        if (toggleLock.current.has(item.id)) return;

        toggleLock.current.add(item.id);

        try {
            const updated = { ...item, isPurchased: !item.isPurchased };

            // If marking as purchased and it's a souvenir with price, add to budget
            if (updated.isPurchased && updated.category === 'souvenir' && updated.price > 0) {
                // Add to expenses in localStorage (Budget reads from here)
                try {
                    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
                    const newExpense = {
                        id: `shop-${item.id}`,
                        name: `${item.name}${item.recipient ? ` (→${item.recipient})` : ''}`,
                        amount: updated.price,
                        category: 'souvenir',
                        paidBy: updated.buyer || '未設定',
                        date: new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
                        eventId: null
                    };
                    // Avoid duplicates
                    if (!expenses.find(e => e.id === newExpense.id)) {
                        expenses.push(newExpense);
                        localStorage.setItem('expenses', JSON.stringify(expenses));
                    }
                } catch (err) {
                    console.error('Failed to add to budget:', err);
                }
            }

            setShoppingItems(prev => prev.map(i => i.id === item.id ? updated : i));
        } finally {
            // Remove lock after a short delay to prevent rapid re-clicks
            setTimeout(() => toggleLock.current.delete(item.id), 300);
        }
    };

    const handleDeleteShoppingItem = (id) => {
        if (!window.confirm('削除しますか？')) return;
        setShoppingItems(prev => prev.filter(i => i.id !== id));

        // Also remove from expenses if exists
        try {
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            const filtered = expenses.filter(e => e.id !== `shop-${id}`);
            localStorage.setItem('expenses', JSON.stringify(filtered));
        } catch { /* ignore localStorage errors */ }
    };

    // Packing stats
    const packingProgress = useMemo(() => {
        if (items.length === 0) return 0;
        return Math.round((items.filter(i => i.isChecked).length / items.length) * 100);
    }, [items]);

    // Shopping stats
    const shoppingStats = useMemo(() => {
        const purchased = shoppingItems.filter(i => i.isPurchased);
        const total = purchased.reduce((sum, i) => sum + (i.price || 0), 0);
        return { purchased: purchased.length, total: shoppingItems.length, spent: total };
    }, [shoppingItems]);

    // Group items by category
    const groupedPackingItems = useMemo(() => {
        const sorted = [...items].sort((a, b) => {
            if (a.isChecked === b.isChecked) {
                return PACKING_CATEGORIES.findIndex(c => c.id === a.category) - PACKING_CATEGORIES.findIndex(c => c.id === b.category);
            }
            return a.isChecked ? 1 : -1;
        });

        const groups = {};
        PACKING_CATEGORIES.forEach(cat => groups[cat.id] = []);
        sorted.forEach(item => {
            const cat = groups[item.category] ? item.category : 'other';
            groups[cat].push(item);
        });
        return groups;
    }, [items]);

    const groupedShoppingItems = useMemo(() => {
        const sorted = [...shoppingItems].sort((a, b) => a.isPurchased === b.isPurchased ? 0 : a.isPurchased ? 1 : -1);
        const groups = {};
        SHOPPING_CATEGORIES.forEach(cat => groups[cat.id] = []);
        sorted.forEach(item => {
            const cat = groups[item.category] ? item.category : 'other';
            groups[cat].push(item);
        });
        return groups;
    }, [shoppingItems]);

    return (
        <div className="pb-24 space-y-4">
            {/* Large Title */}
            <div className="pb-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Lists</h1>
            </div>
            {/* Tab Header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                {/* Tab Buttons */}
                <div className="flex border-b border-gray-100 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('packing')}
                        className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${activeTab === 'packing'
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                            : 'text-gray-400 dark:text-slate-500'
                            }`}
                    >
                        <Package size={16} className="inline mr-1.5 -mt-0.5" />
                        持ち物
                    </button>
                    <button
                        onClick={() => setActiveTab('shopping')}
                        className={`flex-1 py-3 text-center font-bold text-sm transition-colors ${activeTab === 'shopping'
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                            : 'text-gray-400 dark:text-slate-500'
                            }`}
                    >
                        <ShoppingBag size={16} className="inline mr-1.5 -mt-0.5" />
                        買い物
                    </button>
                </div>

                {/* Stats Header */}
                <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                        <div>
                            <h2 className="text-xl font-bold dark:text-white">
                                {activeTab === 'packing' ? '持ち物リスト' : '買い物リスト'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {activeTab === 'packing'
                                    ? `${items.filter(i => i.isChecked).length} / ${items.length} 準備完了`
                                    : `${shoppingStats.purchased} / ${shoppingStats.total} 購入済み${shoppingStats.spent > 0 ? ` (¥${shoppingStats.spent.toLocaleString()})` : ''}`
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => activeTab === 'packing' ? setIsAddModalOpen(true) : setIsShoppingModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-transform active:scale-90"
                        >
                            <Plus size={22} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    {activeTab === 'packing' && (
                        <>
                            <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${packingProgress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${packingProgress}%` }}
                                />
                            </div>
                            {packingProgress === 100 && (
                                <p className="text-center text-green-600 dark:text-green-400 text-sm font-bold mt-2">🎉 準備完了！</p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                {activeTab === 'packing' ? (
                    // Packing List
                    loading ? (
                        <div className="flex justify-center py-12 lg:col-span-full">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 dark:text-slate-600 lg:col-span-full">
                            <Package size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">アイテムがありません</p>
                            <p className="text-sm mt-1">「+」ボタンから追加</p>
                        </div>
                    ) : (
                        PACKING_CATEGORIES.map(cat => {
                            const catItems = groupedPackingItems[cat.id];
                            if (!catItems || catItems.length === 0) return null;
                            const Icon = cat.icon;

                            return (
                                <div key={cat.id}>
                                    <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-slate-400 text-sm font-bold px-1">
                                        <Icon size={16} />
                                        <span>{cat.label}</span>
                                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">
                                            {catItems.length}
                                        </span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                        {catItems.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className={`flex items-center p-3 gap-3 ${idx !== catItems.length - 1 ? 'border-b border-gray-50 dark:border-slate-700' : ''}`}
                                            >
                                                <button
                                                    onClick={() => handleToggleCheck(item)}
                                                    className={`shrink-0 transition-colors ${item.isChecked ? 'text-indigo-500' : 'text-gray-300 dark:text-slate-600'}`}
                                                >
                                                    {item.isChecked ? <CheckCircle2 size={24} className="fill-indigo-50 dark:fill-indigo-900/30" /> : <Circle size={24} />}
                                                </button>
                                                <span className={`flex-1 ${item.isChecked ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-800 dark:text-slate-200 font-medium'}`}>
                                                    {item.name}
                                                </span>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 p-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : (
                    // Shopping List
                    shoppingItems.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 dark:text-slate-600 lg:col-span-full">
                            <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">買い物リストがありません</p>
                            <p className="text-sm mt-1">「+」ボタンから追加</p>
                        </div>
                    ) : (
                        SHOPPING_CATEGORIES.map(cat => {
                            const catItems = groupedShoppingItems[cat.id];
                            if (!catItems || catItems.length === 0) return null;
                            const Icon = cat.icon;

                            return (
                                <div key={cat.id}>
                                    <div className="flex items-center gap-2 mb-2 text-gray-500 dark:text-slate-400 text-sm font-bold px-1">
                                        <Icon size={16} />
                                        <span>{cat.label}</span>
                                        <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">
                                            {catItems.length}
                                        </span>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                        {catItems.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className={`p-3 ${idx !== catItems.length - 1 ? 'border-b border-gray-50 dark:border-slate-700' : ''}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleToggleShoppingPurchased(item)}
                                                        className={`shrink-0 transition-colors ${item.isPurchased ? 'text-green-500' : 'text-gray-300 dark:text-slate-600'}`}
                                                    >
                                                        {item.isPurchased ? <CheckCircle2 size={24} className="fill-green-50 dark:fill-green-900/30" /> : <Circle size={24} />}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-medium ${item.isPurchased ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-800 dark:text-slate-200'}`}>
                                                            {item.name}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                                                            {item.recipient && (
                                                                <span className="flex items-center gap-1 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-full">
                                                                    <Gift size={10} /> {item.recipient}
                                                                </span>
                                                            )}
                                                            {item.buyer && (
                                                                <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                                    <User size={10} /> {item.buyer}
                                                                </span>
                                                            )}
                                                            {item.price > 0 && (
                                                                <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                                                    <DollarSign size={10} /> ¥{item.price.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteShoppingItem(item.id)}
                                                        className="text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 p-2"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )
                )}
            </div>

            {/* Packing Add Modal - iOS Bottom Sheet Style */}
            {isAddModalOpen && createPortal(
                <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up-spring" onClick={e => e.stopPropagation()}>
                        {/* Grabber */}
                        <div className="flex justify-center pt-3 pb-1 sm:hidden">
                            <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
                        </div>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100">持ち物を追加</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">
                                <X size={20} className="text-gray-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto space-y-5 flex-1">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">アイテム名</label>
                                    <input
                                        type="text"
                                        value={newItem.name}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        placeholder="例: パジャマ、充電器"
                                        className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">カテゴリ</label>
                                    <select
                                        value={newItem.category}
                                        onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full appearance-none bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {PACKING_CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !newItem.name.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-colors"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : '追加する'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Shopping Add Modal - iOS Bottom Sheet Style */}
            {
                isShoppingModalOpen && createPortal(
                    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setIsShoppingModalOpen(false)}>
                        <div className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-slide-up-spring" onClick={e => e.stopPropagation()}>
                            {/* Grabber */}
                            <div className="flex justify-center pt-3 pb-1 sm:hidden">
                                <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
                            </div>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100">買い物を追加</h3>
                                <button onClick={() => setIsShoppingModalOpen(false)} className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">
                                    <X size={20} className="text-gray-500 dark:text-slate-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 overflow-y-auto space-y-5 flex-1">
                                <form onSubmit={handleAddShoppingItem} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">商品名 *</label>
                                        <input
                                            type="text"
                                            value={newShoppingItem.name}
                                            onChange={e => setNewShoppingItem({ ...newShoppingItem, name: e.target.value })}
                                            placeholder="例: 北海道チーズケーキ、熊の木彫り"
                                            className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                            <Gift size={12} className="inline mr-1" />
                                            カテゴリ
                                        </label>
                                        <select
                                            value={newShoppingItem.category}
                                            onChange={e => setNewShoppingItem({ ...newShoppingItem, category: e.target.value })}
                                            className="w-full appearance-none bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {SHOPPING_CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Recipient (Optional) */}
                                    {newShoppingItem.category === 'souvenir' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                                <Users size={12} className="inline mr-1" />
                                                渡す相手
                                            </label>
                                            <input
                                                type="text"
                                                value={newShoppingItem.recipient}
                                                onChange={e => setNewShoppingItem({ ...newShoppingItem, recipient: e.target.value })}
                                                placeholder="例: 両親、職場の同僚"
                                                className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                            <User size={12} className="inline mr-1" />
                                            購入者
                                        </label>
                                        <input
                                            type="text"
                                            value={newShoppingItem.buyer}
                                            onChange={e => setNewShoppingItem({ ...newShoppingItem, buyer: e.target.value })}
                                            placeholder="例: パパ、ママ"
                                            className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1">
                                            <DollarSign size={12} className="inline mr-1" />
                                            予定金額
                                        </label>
                                        <input
                                            type="number"
                                            value={newShoppingItem.price}
                                            onChange={e => setNewShoppingItem({ ...newShoppingItem, price: e.target.value })}
                                            placeholder="購入時に確定"
                                            className="w-full bg-gray-50 dark:bg-slate-700 border-none rounded-xl px-4 py-3 font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">購入完了時にお財布へ自動登録されます</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!newShoppingItem.name.trim()}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-colors"
                                    >
                                        追加する
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div>
    );
}
