import React from 'react';

const EmergencyContacts = () => {
    const emergencyData = [
        { type: 'section', title: '🚨 日本国内緊急番号' },
        { type: 'contact', name: '警察', number: '110', color: 'blue' },
        { type: 'contact', name: '救急・消防', number: '119', color: 'red' },
        { type: 'contact', name: '海上保安庁', number: '118', color: 'cyan' },
        { type: 'section', title: '🏥 医療・相談' },
        { type: 'contact', name: '救急相談 (東京)', number: '#7119', color: 'orange' },
        { type: 'contact', name: '子ども医療相談', number: '#8000', color: 'green' },
        { type: 'section', title: '📞 旅行関連' },
        { type: 'contact', name: 'JAF ロードサービス', number: '0570-00-8139', color: 'yellow' },
        { type: 'section', title: '👨‍👩‍👧‍👦 家族連絡先' },
        { type: 'info', text: '家族の連絡先を追加してください（次バージョンで編集可能）' },
    ];

    const handleCall = (number) => {
        window.location.href = `tel:${number.replace(/-/g, '')}`;
    };

    return (
        <div className="pt-4 space-y-4 overflow-hidden">
            {emergencyData.map((item, idx) => {
                if (item.type === 'section') {
                    return (
                        <div key={idx} className="px-1">
                            <h3 className="font-bold text-gray-700 text-sm">{item.title}</h3>
                        </div>
                    );
                }
                if (item.type === 'contact') {
                    return (
                        <button
                            key={idx}
                            onClick={() => handleCall(item.number)}
                            className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition"
                        >
                            <div>
                                <span className="font-bold text-gray-800">{item.name}</span>
                                <span className="text-gray-500 ml-2">{item.number}</span>
                            </div>
                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                📞 発信
                            </div>
                        </button>
                    );
                }
                if (item.type === 'info') {
                    return (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
                            {item.text}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};

export default EmergencyContacts;
