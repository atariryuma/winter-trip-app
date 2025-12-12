import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { DollarSign, Target, Wallet, PlusCircle, X, Check, User, Trash2 } from 'lucide-react';
import server from '../../api/gas';
import { useToast } from '../../context/ToastContext';

// Preset amounts for quick selection
const PRESET_AMOUNTS = [500, 1000, 2000, 3000, 5000, 10000, 20000];

// Detect category from event
const detectCategory = (event) => {
    const { type, category, name } = event;
    if (type === 'stay' || category === 'hotel') return '宿泊';
    if (type === 'transport' || ['flight', 'train', 'bus'].includes(category)) return '交通';
    if (category === 'meal' || name?.includes('ランチ') || name?.includes('ディナー')) return '食事';
    if (category === 'sightseeing') return '観光';
    if (category === 'shopping' || name?.includes('お土産')) return '買い物';
    return 'その他';
};

// Get category emoji
const getCategoryEmoji = (category) => {
    const emojis = {
        '宿泊': '🏨', '交通': '🚄', '食事': '🍽️', '観光': '📍', '買い物': '🛍️', 'その他': '📦'
    };
    return emojis[category] || '📦';
};

// Payer management helpers
const loadPayers = () => {
    try {
        const saved = localStorage.getItem('travel_payers');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

const savePayers = (payers) => {
    localStorage.setItem('travel_payers', JSON.stringify(payers));
};

const BudgetView = ({ itinerary, onForceReload, isScrolled }) => {
    // Budget goal (stored in localStorage)
    const [budgetGoal, setBudgetGoal] = useState(() => {
        const saved = localStorage.getItem('travel_budget_goal');
        return saved ? parseInt(saved) : 100000;
    });
    const [showGoalInput, setShowGoalInput] = useState(false);
    const [tempGoal, setTempGoal] = useState(budgetGoal);

    // Quick Add Payment State
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [customAmount, setCustomAmount] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [selectedPayer, setSelectedPayer] = useState(null);
    const [payers, setPayers] = useState(loadPayers);
    const [newPayerName, setNewPayerName] = useState('');
    const [showNewPayerInput, setShowNewPayerInput] = useState(false);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    // Edit expense state
    const [editingExpense, setEditingExpense] = useState(null);

    // Get all events with their day info
    const allEvents = useMemo(() => {
        if (!itinerary) return [];
        return itinerary.flatMap(day =>
            (day.events || []).map(e => ({
                ...e,
                date: day.date,
                dayId: day.id,
                category: detectCategory(e),
                hasPaid: !!(e.budgetAmount && e.budgetPaidBy)
            }))
        );
    }, [itinerary]);

    // Events without payment (for quick add) - used in modal
    const _unpaidEvents = useMemo(() => allEvents.filter(e => !e.hasPaid), [allEvents]);

    // Collect all expenses from events
    const expenses = useMemo(() => {
        return allEvents
            .filter(e => e.budgetAmount && e.budgetPaidBy)
            .map(e => ({
                id: e.id,
                name: e.name,
                date: e.date,
                amount: parseInt(e.budgetAmount) || 0,
                paidBy: e.budgetPaidBy,
                category: e.category
            }));
    }, [allEvents]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const tripDays = itinerary?.length || 1;
        const perDay = Math.round(total / tripDays);
        const remaining = budgetGoal - total;
        const percentage = budgetGoal > 0 ? Math.min((total / budgetGoal) * 100, 100) : 0;

        return { total, perDay, remaining, percentage, tripDays };
    }, [expenses, itinerary, budgetGoal]);

    // Save budget goal
    const handleSaveGoal = () => {
        setBudgetGoal(tempGoal);
        localStorage.setItem('travel_budget_goal', tempGoal.toString());
        setShowGoalInput(false);
    };

    // Reset quick add form
    const resetQuickAdd = () => {
        setSelectedEventId(null);
        setSelectedAmount(null);
        setCustomAmount('');
        setShowCustomInput(false);
        setSelectedPayer(null);
        setShowNewPayerInput(false);
        setNewPayerName('');
        setEditingExpense(null);
    };

    // Handle event selection
    const handleSelectEvent = (event) => {
        if (event.hasPaid) {
            showToast('warning', `既存の支払い ¥${event.budgetAmount} (${event.budgetPaidBy}) を上書きします`);
        }
        setSelectedEventId(event.id);
    };

    // Handle amount selection
    const handleSelectAmount = (amount) => {
        setSelectedAmount(amount);
        setShowCustomInput(false);
        setCustomAmount('');
    };

    // Handle payer selection
    const handleSelectPayer = (payer) => {
        setSelectedPayer(payer);
        setShowNewPayerInput(false);
    };

    // Add new payer
    const handleAddNewPayer = () => {
        if (!newPayerName.trim()) return;
        const newPayers = [...payers, newPayerName.trim()];
        setPayers(newPayers);
        savePayers(newPayers);
        setSelectedPayer(newPayerName.trim());
        setNewPayerName('');
        setShowNewPayerInput(false);
    };

    // Get final amount
    const finalAmount = showCustomInput ? parseInt(customAmount) || 0 : selectedAmount;

    // Save payment using optimized batch update
    const handleSavePayment = async () => {
        if (!selectedEventId || !finalAmount || !selectedPayer) return;

        setSaving(true);
        try {
            // Find the event and its day
            let targetDay = null;
            let targetEvent = null;

            for (const day of itinerary) {
                const event = day.events.find(e => e.id === selectedEventId);
                if (event) {
                    targetDay = day;
                    targetEvent = event;
                    break;
                }
            }

            if (!targetDay || !targetEvent) {
                throw new Error('Event not found');
            }

            // Use optimized batch update instead of full saveData
            await server.batchUpdateEvents([{
                date: targetDay.date,
                eventId: targetEvent.name,
                eventData: {
                    budgetAmount: finalAmount.toString(),
                    budgetPaidBy: selectedPayer
                }
            }]);

            // Refresh data
            if (onForceReload) await onForceReload();

            // Close and reset
            setShowAddPayment(false);
            resetQuickAdd();
        } catch (error) {
            console.error('Save error:', error);
            showToast('error', '保存に失敗しました: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Delete payment
    const handleDeletePayment = async () => {
        if (!selectedEventId) return;

        setSaving(true);
        try {
            let targetDay = null;
            let targetEvent = null;

            for (const day of itinerary) {
                const event = day.events.find(e => e.id === selectedEventId);
                if (event) {
                    targetDay = day;
                    targetEvent = event;
                    break;
                }
            }

            if (!targetDay || !targetEvent) {
                throw new Error('Event not found');
            }

            // Clear budget fields using batch update
            await server.batchUpdateEvents([{
                date: targetDay.date,
                eventId: targetEvent.name,
                eventData: {
                    budgetAmount: '',
                    budgetPaidBy: ''
                }
            }]);

            // Refresh data
            if (onForceReload) await onForceReload();

            // Close and reset
            setShowAddPayment(false);
            resetQuickAdd();
        } catch (error) {
            console.error('Delete error:', error);
            showToast('error', '削除に失敗しました: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    // Selected event info
    const selectedEvent = allEvents.find(e => e.id === selectedEventId);

    return (
        <div className="space-y-4 pb-24 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            {/* Left Column - Summary */}
            <div className="space-y-4">
                {/* Large Title with fade animation */}
                <div className={`pb-2 transition-all duration-300 ${isScrolled ? 'opacity-0 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Budget</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">予算管理</p>
                </div>
                {/* Summary Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-slate-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

                    <div className="relative z-content">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-white/70 uppercase text-[10px] font-bold tracking-wider">予算管理</h2>
                            <Wallet size={18} className="text-white/50" />
                        </div>

                        {/* Total Spent */}
                        <div className="text-center mb-5">
                            <div className="text-xs text-white/60 mb-1">現在の支出</div>
                            <div className="text-4xl font-black tracking-tight">
                                <span className="text-xl opacity-70 mr-1">¥</span>
                                {stats.total.toLocaleString()}
                            </div>
                        </div>

                        {/* Budget Progress */}
                        {!showGoalInput ? (
                            <div
                                className="bg-white/15 backdrop-blur rounded-xl p-4 cursor-pointer hover:bg-white/20 transition-colors"
                                onClick={() => { setTempGoal(budgetGoal); setShowGoalInput(true); }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-white/70 flex items-center gap-1">
                                        <Target size={12} /> 予算目標
                                    </span>
                                    <span className="text-xs text-white/50">タップで編集</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${stats.percentage >= 100 ? 'bg-red-400' :
                                            stats.percentage >= 80 ? 'bg-amber-400' : 'bg-emerald-400'
                                            }`}
                                        style={{ width: `${stats.percentage}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className={stats.remaining < 0 ? 'text-red-300' : 'text-white/80'}>
                                        残り ¥{Math.abs(stats.remaining).toLocaleString()}
                                        {stats.remaining < 0 && ' オーバー'}
                                    </span>
                                    <span className="text-white/60">/ ¥{budgetGoal.toLocaleString()}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/15 backdrop-blur rounded-xl p-4">
                                <label className="text-xs text-white/70 mb-2 block">予算目標を設定</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={tempGoal}
                                        onChange={(e) => setTempGoal(parseInt(e.target.value) || 0)}
                                        className="flex-1 bg-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 text-lg font-bold"
                                        placeholder="100000"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveGoal}
                                        className="bg-white text-indigo-600 font-bold px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        保存
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                <div className="text-lg font-bold">¥{stats.perDay.toLocaleString()}</div>
                                <div className="text-[9px] uppercase tracking-wider opacity-70">1日あたり</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                                <div className="text-lg font-bold">{expenses.length}件</div>
                                <div className="text-[9px] uppercase tracking-wider opacity-70">支出項目</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Add Payment Button */}
                <button
                    onClick={() => { setShowAddPayment(true); resetQuickAdd(); }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                    <PlusCircle size={20} />
                    支出を追加
                </button>

                {/* Quick Add Payment Modal */}
                {showAddPayment && createPortal(
                    <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                        <div className="bg-white dark:bg-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up-spring">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100 flex items-center gap-2">
                                    <DollarSign size={20} className={editingExpense ? "text-indigo-500" : "text-emerald-500"} />
                                    {editingExpense ? '支出を編集' : '支出を追加'}
                                </h3>
                                <button onClick={() => { setShowAddPayment(false); resetQuickAdd(); }} className="p-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 overflow-y-auto space-y-5 flex-1">
                                {/* Step 1: Select Event */}
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                        <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                                        イベントを選択
                                    </div>

                                    <div className="max-h-48 overflow-y-auto space-y-2 bg-gray-50 dark:bg-slate-900 rounded-xl p-2">
                                        {allEvents.length === 0 ? (
                                            <div className="text-center py-4 text-gray-400 text-sm">イベントがありません</div>
                                        ) : (
                                            allEvents.map(event => (
                                                <button
                                                    key={event.id}
                                                    onClick={() => handleSelectEvent(event)}
                                                    className={`w-full text-left p-3 rounded-lg transition-all ${selectedEventId === event.id
                                                        ? 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-500 text-indigo-700 dark:text-indigo-300'
                                                        : event.hasPaid
                                                            ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                                                            : 'bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>{getCategoryEmoji(event.category)}</span>
                                                        <span className={`font-bold text-sm truncate flex-1 ${selectedEventId === event.id ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>{event.name}</span>
                                                        {event.hasPaid && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${selectedEventId === event.id
                                                                ? 'bg-indigo-500 text-white'
                                                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                                }`}>
                                                                ¥{event.budgetAmount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`text-[10px] mt-1 ${selectedEventId === event.id ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400'}`}>
                                                        {event.date} • {event.category}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Select Amount */}
                                {selectedEventId && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                            <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                                            金額を選択
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 mb-3">
                                            {PRESET_AMOUNTS.map(amount => (
                                                <button
                                                    key={amount}
                                                    onClick={() => handleSelectAmount(amount)}
                                                    className={`py-3 rounded-xl font-bold text-sm transition-all ${selectedAmount === amount && !showCustomInput
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-emerald-100'
                                                        }`}
                                                >
                                                    ¥{amount >= 10000 ? `${amount / 10000}万` : amount.toLocaleString()}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => { setShowCustomInput(true); setSelectedAmount(null); }}
                                                className={`py-3 rounded-xl font-bold text-sm transition-all ${showCustomInput
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                その他
                                            </button>
                                        </div>

                                        {showCustomInput && (
                                            <input
                                                type="number"
                                                value={customAmount}
                                                onChange={(e) => setCustomAmount(e.target.value)}
                                                className="w-full p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border-2 border-emerald-500 text-gray-800 dark:text-white font-bold text-lg focus:outline-none"
                                                placeholder="金額を入力..."
                                                autoFocus
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Step 3: Select Payer */}
                                {selectedEventId && finalAmount > 0 && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                            <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                                            支払った人
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {payers.map(payer => (
                                                <button
                                                    key={payer}
                                                    onClick={() => handleSelectPayer(payer)}
                                                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-1 ${selectedPayer === payer
                                                        ? 'bg-indigo-500 text-white'
                                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-indigo-100'
                                                        }`}
                                                >
                                                    <User size={14} />
                                                    {payer}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setShowNewPayerInput(true)}
                                                className="px-4 py-2 rounded-full font-bold text-sm bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200 flex items-center gap-1"
                                            >
                                                <PlusCircle size={14} />
                                                追加
                                            </button>
                                        </div>

                                        {showNewPayerInput && (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newPayerName}
                                                    onChange={(e) => setNewPayerName(e.target.value)}
                                                    className="flex-1 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white font-medium"
                                                    placeholder="名前を入力..."
                                                    autoFocus
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewPayer()}
                                                />
                                                <button
                                                    onClick={handleAddNewPayer}
                                                    className="bg-indigo-500 text-white px-4 rounded-xl font-bold"
                                                >
                                                    追加
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer - Confirmation */}
                            <div className="p-4 border-t border-gray-100 dark:border-slate-700 shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                                {selectedEvent && finalAmount > 0 && selectedPayer ? (
                                    <div className="space-y-3">
                                        {/* Summary */}
                                        <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3 flex items-center justify-between">
                                            <div>
                                                <div className="font-bold text-gray-800 dark:text-white text-sm">{selectedEvent.name}</div>
                                                <div className="text-[10px] text-gray-400">{selectedPayer}が支払い</div>
                                            </div>
                                            <div className="font-black text-xl text-emerald-600">¥{finalAmount.toLocaleString()}</div>
                                        </div>

                                        <div className="flex gap-3">
                                            {/* Delete button - icon only (matches EditModal pattern) */}
                                            {editingExpense && (
                                                <button
                                                    onClick={handleDeletePayment}
                                                    disabled={saving}
                                                    className="p-3 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                            <button
                                                onClick={handleSavePayment}
                                                disabled={saving}
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                                            >
                                                {saving ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check size={18} />
                                                        保存する
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 text-sm py-2">
                                        イベント・金額・支払者を選択してください
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {/* Right Column - Expense List */}
            <div className="space-y-4">
                {/* Expense List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                        <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                            <DollarSign size={16} className="text-emerald-500" /> 支出一覧
                        </h3>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                                <PlusCircle size={28} className="text-gray-300 dark:text-slate-500" />
                            </div>
                            <p className="text-gray-500 dark:text-slate-400 font-medium mb-1">まだ支出がありません</p>
                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                上の「支出を追加」ボタンから<br />支出を記録しましょう
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-slate-700">
                            {expenses.map(e => (
                                <button
                                    key={e.id}
                                    onClick={() => {
                                        const event = allEvents.find(ev => ev.id === e.id);
                                        if (event) {
                                            setEditingExpense(event);
                                            setSelectedEventId(e.id);
                                            setSelectedAmount(e.amount);
                                            setSelectedPayer(e.paidBy);
                                            setShowAddPayment(true);
                                        }
                                    }}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-lg">
                                        {getCategoryEmoji(e.category)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 dark:text-white text-sm truncate">{e.name}</div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-slate-500">
                                            <span>{e.date}</span>
                                            <span>•</span>
                                            <span>{e.paidBy}</span>
                                        </div>
                                    </div>
                                    <div className="font-black text-gray-800 dark:text-white">
                                        ¥{e.amount.toLocaleString()}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payer Summary */}
                {expenses.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4">
                        <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-2 mb-3">
                            <User size={16} className="text-indigo-500" /> 支払い者別合計
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(
                                expenses.reduce((acc, e) => {
                                    acc[e.paidBy] = (acc[e.paidBy] || 0) + e.amount;
                                    return acc;
                                }, {})
                            ).map(([payer, total]) => (
                                <div key={payer} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 rounded-lg px-3 py-2">
                                    <span className="font-medium text-gray-700 dark:text-slate-200">{payer}</span>
                                    <span className="font-bold text-gray-800 dark:text-white">¥{total.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default BudgetView;
