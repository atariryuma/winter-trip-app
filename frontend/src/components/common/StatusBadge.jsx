import React from 'react';
import { CheckCircle2, Circle, AlertCircle, Pencil } from 'lucide-react';

/**
 * StatusBadge - Event status indicator
 * @param {string} status - confirmed/booked, planned, suggested
 * @param {boolean} inverted - Use inverted colors (for dark backgrounds)
 * @param {boolean} compact - Hide text labels (for tablet view)
 */
const StatusBadge = ({ status, inverted = false, compact = false }) => {
    if (status === 'confirmed' || status === 'booked') return (
        <span className={`inline-flex items-center gap-1 py-0.5 rounded-full text-[10px] font-bold border
            ${compact ? 'px-1.5' : 'px-2'}
            ${inverted
                ? 'bg-green-400/20 text-green-100 border-green-400/30'
                : 'bg-green-100 text-green-700 border-green-200'}`}
            title={compact ? '予約確保' : undefined}>
            <CheckCircle2 size={10} />
            {!compact && <span>予約確保</span>}
        </span>
    );
    if (status === 'planned') return (
        <span className={`inline-flex items-center gap-1 py-0.5 rounded-full text-[10px] font-bold border
            ${compact ? 'px-1.5' : 'px-2'}
            ${inverted
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}
            title={compact ? '計画中' : undefined}>
            <Circle size={10} />
            {!compact && <span>計画中</span>}
            <Pencil size={9} className="opacity-60" />
        </span>
    );
    if (status === 'suggested') return (
        <span className={`inline-flex items-center gap-1 py-0.5 rounded-full text-[10px] font-medium border
            ${compact ? 'px-1.5' : 'px-2'}
            ${inverted
                ? 'bg-white/10 text-white/80 border-white/20'
                : 'bg-gray-100 text-gray-600 border-gray-200'}`}
            title={compact ? '候補' : undefined}>
            <AlertCircle size={10} />
            {!compact && <span>候補</span>}
            <Pencil size={9} className="opacity-60" />
        </span>
    );
    return null;
};

export default StatusBadge;


