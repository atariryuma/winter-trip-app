import React, { useState } from 'react';
import { Phone, Check, Copy } from 'lucide-react';

const EmergencyContacts = () => {
    const [copiedNumber, setCopiedNumber] = useState(null);

    const handleCall = (number) => {
        window.location.href = `tel:${number.replace(/-/g, '')}`;
    };

    const handleCopy = (number) => {
        navigator.clipboard.writeText(number.replace(/-/g, ''));
        setCopiedNumber(number);
        setTimeout(() => setCopiedNumber(null), 2000);
    };

    const emergencyNumbers = [
        { name: '警察', number: '110', icon: '🚔', color: 'from-indigo-500 to-indigo-600', desc: '事件・事故' },
        { name: '救急・消防', number: '119', icon: '🚑', color: 'from-red-500 to-red-600', desc: '火災・救急' },
        { name: '海上保安', number: '118', icon: '⛵', color: 'from-cyan-500 to-cyan-600', desc: '海の事故' },
    ];

    const helpLines = [
        { name: '救急相談', number: '#7119', desc: '病院案内・救急相談' },
        { name: '子ども医療相談', number: '#8000', desc: '夜間の子どもの急病' },
    ];

    return (
        <div className="space-y-4">
            {/* Emergency Buttons */}
            <div className="grid grid-cols-3 gap-3">
                {emergencyNumbers.map((item) => (
                    <button
                        key={item.number}
                        onClick={() => handleCall(item.number)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg active:scale-95 transition-transform`}
                    >
                        <span className="text-2xl mb-1">{item.icon}</span>
                        <span className="font-black text-xl">{item.number}</span>
                        <span className="text-[10px] opacity-80 mt-0.5">{item.name}</span>
                    </button>
                ))}
            </div>

            {/* Help Lines */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 text-sm">🏥 医療相談</h3>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-slate-700">
                    {helpLines.map((item) => (
                        <div key={item.number} className="flex items-center justify-between p-4">
                            <div>
                                <div className="font-bold text-gray-800 dark:text-slate-100">{item.name}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">{item.desc}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleCopy(item.number)}
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    {copiedNumber === item.number ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                                <button
                                    onClick={() => handleCall(item.number)}
                                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-xl transition-colors"
                                >
                                    <Phone size={16} />
                                    <span className="font-mono">{item.number}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmergencyContacts;
