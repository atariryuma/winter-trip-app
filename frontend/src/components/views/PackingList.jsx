import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Loader2, X, Shirt, Smartphone, Package, FileText, Briefcase } from 'lucide-react';
import server from '../../api/gas';

const CATEGORIES = [
    { id: 'clothing', label: '衣類', icon: Shirt },
    { id: 'electronics', label: '電子機器', icon: Smartphone },
    { id: 'toiletries', label: '洗面用具', icon: Package },
    { id: 'documents', label: '書類・貴重品', icon: FileText },
    { id: 'other', label: 'その他', icon: Briefcase },
];

export default function PackingList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', category: 'clothing' });

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

    // Sort: unchecked first, then by category
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            if (a.isChecked === b.isChecked) {
                return CATEGORIES.findIndex(c => c.id === a.category) - CATEGORIES.findIndex(c => c.id === b.category);
            }
            return a.isChecked ? 1 : -1;
        });
    }, [items]);

    // Group by category
    const groupedItems = useMemo(() => {
        const groups = {};
        CATEGORIES.forEach(cat => groups[cat.id] = []);
        sortedItems.forEach(item => {
            const cat = groups[item.category] ? item.category : 'other';
            groups[cat].push(item);
        });
        return groups;
    }, [sortedItems]);

    const progress = useMemo(() => {
        if (items.length === 0) return 0;
        return Math.round((items.filter(i => i.isChecked).length / items.length) * 100);
    }, [items]);

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 sticky top-0 z-10 shadow-sm border-b dark:border-slate-700">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">持ち物リスト</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            {items.filter(i => i.isChecked).length} / {items.length} 準備完了
                        </p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg transition-transform active:scale-90"
                    >
                        <Plus size={22} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {progress === 100 && (
                    <p className="text-center text-green-600 dark:text-green-400 text-sm font-bold mt-2">🎉 準備完了！</p>
                )}
            </div>

            {/* List */}
            <div className="p-4 space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 dark:text-slate-600">
                        <Package size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">アイテムがありません</p>
                        <p className="text-sm mt-1">「+」ボタンから追加</p>
                    </div>
                ) : (
                    CATEGORIES.map(cat => {
                        const catItems = groupedItems[cat.id];
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
                )}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-4 shadow-xl animate-scale-in">
                        <div className="flex justify-between items-center mb-4 border-b dark:border-slate-700 pb-3">
                            <h3 className="font-bold text-lg dark:text-white">アイテム追加</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="bg-gray-100 dark:bg-slate-700 p-1.5 rounded-full">
                                <X size={18} />
                            </button>
                        </div>

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
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !newItem.name.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : '追加する'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
