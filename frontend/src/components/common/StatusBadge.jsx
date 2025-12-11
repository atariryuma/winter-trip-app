import React from 'react';
import { CheckCircle2, Circle, AlertCircle, Pencil } from 'lucide-react';

const StatusBadge = ({ status, inverted = false }) => {
    if (status === 'confirmed' || status === 'booked') return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border
            ${inverted
                ? 'bg-green-400/20 text-green-100 border-green-400/30'
                : 'bg-green-100 text-green-700 border-green-200'}`}>
            <CheckCircle2 size={10} /> 予約確保
        </span>
    );
    if (status === 'planned') return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border
            ${inverted
                ? 'bg-white/20 text-white border-white/30'
                : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
            <Circle size={10} /> 計画中 <Pencil size={9} className="opacity-60" />
        </span>
    );
    if (status === 'suggested') return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border
            ${inverted
                ? 'bg-white/10 text-white/80 border-white/20'
                : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            <AlertCircle size={10} /> 候補 <Pencil size={9} className="opacity-60" />
        </span>
    );
    return null;
};

export default StatusBadge;


