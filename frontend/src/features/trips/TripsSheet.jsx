import { Check, Pencil, Plus } from 'lucide-react';
import Sheet from '../../ui/Sheet';
import { useTrip } from '../../store/context';
import { SEASONS } from '../../lib/season';
import { formatRange, phaseLabel } from '../../lib/trip';

const GROUPS = [
    { id: 'during', label: '旅行中' },
    { id: 'before', label: 'これから', order: (a, b) => a.start - b.start },
    { id: 'empty', label: '日程未定' },
    { id: 'after', label: 'これまでの旅行', order: (a, b) => b.start - a.start },
];

export default function TripsSheet({ open, onClose, onCreate, onEdit }) {
    const { trips, currentTrip, selectTrip, supportsTrips } = useTrip();

    const choose = (trip) => {
        selectTrip(trip.id);
        onClose();
        window.scrollTo({ top: 0 });
    };

    return (
        <Sheet open={open} onClose={onClose} title="旅行">
            <div className="space-y-5">
                {GROUPS.map((group) => {
                    const items = trips.filter((t) => t.phase.phase === group.id);
                    if (group.order) items.sort(group.order);
                    if (items.length === 0) return null;
                    return (
                        <section key={group.id}>
                            <h3 className="field-label">{group.label}</h3>
                            <ul className="space-y-2">
                                {items.map((trip) => {
                                    const Icon = SEASONS[trip.season].icon;
                                    const selected = trip.id === currentTrip?.id;
                                    return (
                                        <li key={trip.id} data-season={trip.season} className={`flex items-center rounded-3xl ring-1 ${selected ? 'ring-2 ring-accent-500 bg-accent-50 dark:bg-accent-500/10' : 'ring-slate-200 dark:ring-slate-800'}`}>
                                            <button onClick={() => choose(trip)} className="flex-1 min-w-0 flex items-center gap-3 p-3 text-left" aria-current={selected || undefined}>
                                                <span className="w-11 h-11 shrink-0 rounded-2xl bg-accent-100 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300 flex items-center justify-center">
                                                    <Icon size={22} />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                                        <span className="truncate">{trip.title}</span>
                                                        {selected && <Check size={16} className="shrink-0 text-accent-700 dark:text-accent-400" />}
                                                    </span>
                                                    <span className="block text-xs text-slate-500 truncate">
                                                        {trip.start ? formatRange(trip.start, trip.end) : '日程未定'}
                                                        {trip.days.length > 0 && ` · ${trip.days.length}日間`}
                                                    </span>
                                                    {(group.id === 'before' || group.id === 'during') && (
                                                        <span className="block text-[11px] font-bold text-accent-700 dark:text-accent-400">{phaseLabel(trip.phase)}</span>
                                                    )}
                                                </span>
                                            </button>
                                            <button onClick={() => onEdit(trip)} className="p-3 mr-1 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label={`${trip.title} を編集`}>
                                                <Pencil size={18} />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    );
                })}

                {supportsTrips ? (
                    <button onClick={onCreate} className="btn-primary w-full">
                        <Plus size={18} /> 新しい旅行を作る
                    </button>
                ) : (
                    <p className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                        旅行を複数作るには、バックエンド（Google Apps Script）の更新が必要です。
                    </p>
                )}
            </div>
        </Sheet>
    );
}
