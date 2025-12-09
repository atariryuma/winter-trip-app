import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const defaultPackingItems = [
    { id: 'p1', category: 'documents', name: 'パスポート', packed: false },
    { id: 'p2', category: 'documents', name: '航空券（eチケット）', packed: false },
    { id: 'p3', category: 'documents', name: 'ホテル予約確認書', packed: false },
    { id: 'p4', category: 'documents', name: '運転免許証', packed: false },
    { id: 'p5', category: 'documents', name: '保険証', packed: false },
    { id: 'p6', category: 'clothes', name: '冬用コート', packed: false },
    { id: 'p7', category: 'clothes', name: 'セーター/フリース', packed: false },
    { id: 'p8', category: 'clothes', name: '長袖シャツ', packed: false },
    { id: 'p9', category: 'clothes', name: 'ズボン', packed: false },
    { id: 'p10', category: 'clothes', name: '下着・靴下', packed: false },
    { id: 'p11', category: 'clothes', name: '防寒手袋', packed: false },
    { id: 'p12', category: 'clothes', name: 'マフラー/ネックウォーマー', packed: false },
    { id: 'p13', category: 'clothes', name: 'ニット帽', packed: false },
    { id: 'p14', category: 'electronics', name: 'スマートフォン', packed: false },
    { id: 'p15', category: 'electronics', name: '充電器・ケーブル', packed: false },
    { id: 'p16', category: 'electronics', name: 'モバイルバッテリー', packed: false },
    { id: 'p17', category: 'electronics', name: 'カメラ', packed: false },
    { id: 'p18', category: 'toiletries', name: '歯ブラシ・歯磨き粉', packed: false },
    { id: 'p19', category: 'toiletries', name: 'シャンプー・リンス', packed: false },
    { id: 'p20', category: 'toiletries', name: '常備薬', packed: false },
    { id: 'p21', category: 'toiletries', name: 'スキンケア用品', packed: false },
    { id: 'p22', category: 'other', name: '折りたたみ傘', packed: false },
    { id: 'p23', category: 'other', name: 'エコバッグ', packed: false },
];

const categoryLabels = {
    documents: { label: '書類', icon: '📄' },
    clothes: { label: '衣類', icon: '👔' },
    electronics: { label: '電子機器', icon: '📱' },
    toiletries: { label: '洗面用具', icon: '🧴' },
    other: { label: 'その他', icon: '📦' }
};

const PackingList = () => {
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('packingList');
        return saved ? JSON.parse(saved) : defaultPackingItems;
    });

    useEffect(() => {
        localStorage.setItem('packingList', JSON.stringify(items));
    }, [items]);

    const toggleItem = (id) => {
        setItems(items.map(item => item.id === id ? { ...item, packed: !item.packed } : item));
    };

    const resetAll = () => {
        if (confirm('すべてのチェックをリセットしますか？')) {
            setItems(items.map(item => ({ ...item, packed: false })));
        }
    };

    const packedCount = items.filter(i => i.packed).length;
    const progress = Math.round((packedCount / items.length) * 100);

    const groupedItems = Object.keys(categoryLabels).map(cat => ({
        category: cat,
        ...categoryLabels[cat],
        items: items.filter(i => i.category === cat)
    }));

    return (
        <div className="pt-4 space-y-4 overflow-hidden">
            {/* Progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-gray-800">パッキング進捗</span>
                    <span className="text-sm text-gray-500">{packedCount}/{items.length}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <button onClick={resetAll} className="mt-3 text-xs text-red-500 hover:underline">
                    すべてリセット
                </button>
            </div>

            {/* Categories */}
            {groupedItems.map(group => (
                <div key={group.category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <span>{group.icon}</span>
                        <h3 className="font-bold text-gray-800 text-sm">{group.label}</h3>
                        <span className="text-xs text-gray-400 ml-auto">
                            {group.items.filter(i => i.packed).length}/{group.items.length}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {group.items.map(item => (
                            <button
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition"
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${item.packed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                    {item.packed && <CheckCircle2 size={14} className="text-white" />}
                                </div>
                                <span className={`text-gray-700 ${item.packed ? 'line-through text-gray-400' : ''}`}>{item.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PackingList;
