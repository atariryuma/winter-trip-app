import React, { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';

const EditModal = ({ isOpen, onClose, item, onSave, onDelete }) => {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (item) setFormData({ ...item });
        else setFormData({ type: 'activity', category: 'sightseeing', status: 'planned', time: '10:00', name: '' });
    }, [item, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100">{item ? '予定を編集' : '新しい予定'}</h3>
                    <button onClick={onClose} aria-label="閉じる" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"><X size={20} className="text-gray-500 dark:text-slate-400" /></button>
                </div>
                <div className="p-4 overflow-y-auto space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">カテゴリ</label>
                            <select value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 text-sm">
                                <option value="flight">飛行機</option>
                                <option value="train">電車</option>
                                <option value="bus">バス</option>
                                <option value="sightseeing">観光</option>
                                <option value="meal">食事</option>
                                <option value="hotel">宿泊</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">ステータス</label>
                            <select value={formData.status || ''} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 text-sm">
                                <option value="planned">計画中</option>
                                <option value="confirmed">確定</option>
                                <option value="suggested">候補</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">名称</label>
                        <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 font-bold text-sm" placeholder="予定の名前" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="min-w-0 overflow-hidden">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">開始時刻</label>
                            <input type="time" value={formData.time || ''} onChange={e => setFormData({ ...formData, time: e.target.value })} className="w-full p-2 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 text-sm appearance-none" />
                        </div>
                        <div className="min-w-0 overflow-hidden">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">終了時刻</label>
                            <input type="time" value={formData.endTime || ''} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full p-2 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 text-sm appearance-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">詳細・メモ</label>
                        <textarea value={formData.details || formData.description || ''} onChange={e => setFormData({ ...formData, details: e.target.value, description: e.target.value })} className="w-full p-2.5 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-100 h-20 resize-none text-sm" placeholder="予約番号や注意事項など" />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
                    {item && onDelete && (<button onClick={() => onDelete(item.id)} aria-label="削除" className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-500"><Trash2 size={20} /></button>)}
                    <button onClick={() => onSave(formData)} aria-label="保存" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"><Save size={18} /> 保存する</button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;
