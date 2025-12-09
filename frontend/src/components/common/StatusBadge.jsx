import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
    if (status === 'confirmed') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200">
            <CheckCircle2 size={10} /> 予約確保
        </span>
    );
    if (status === 'planned') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200">
            <Circle size={10} /> 計画中
        </span>
    );
    if (status === 'suggested') return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium border border-gray-200">
            <AlertCircle size={10} /> 候補
        </span>
    );
    return null;
};

export default StatusBadge;
