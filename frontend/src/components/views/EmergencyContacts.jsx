import React, { useState } from 'react';
import { Phone, MapPin, AlertTriangle, Heart, Car, Plane, Info, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

const EmergencyContacts = () => {
    const [expandedSection, setExpandedSection] = useState('emergency');
    const [copiedText, setCopiedText] = useState(null);

    const handleCall = (number) => {
        window.location.href = `tel:${number.replace(/-/g, '')}`;
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const sections = [
        {
            id: 'emergency',
            title: '🚨 緊急連絡先',
            icon: AlertTriangle,
            color: 'red',
            contacts: [
                { name: '警察', number: '110', desc: '事件・事故', color: 'blue' },
                { name: '救急・消防', number: '119', desc: '火災・救急搬送', color: 'red' },
                { name: '海上保安庁', number: '118', desc: '海での事故', color: 'cyan' },
            ]
        },
        {
            id: 'medical',
            title: '🏥 医療・相談',
            icon: Heart,
            color: 'pink',
            contacts: [
                { name: '救急相談', number: '#7119', desc: '病院案内・救急相談', color: 'orange' },
                { name: '子ども医療相談', number: '#8000', desc: '夜間の子どもの急病', color: 'green' },
            ]
        },
        {
            id: 'okinawa',
            title: '🏝️ 沖縄エリア',
            icon: MapPin,
            color: 'blue',
            contacts: [
                { name: '沖縄県立南部医療センター', number: '098-888-0123', desc: '那覇市', color: 'blue' },
                { name: '那覇市立病院', number: '098-884-5111', desc: '古島', color: 'blue' },
                { name: '沖縄観光タクシー', number: '098-855-1234', desc: '観光・送迎', color: 'green' },
            ],
            tips: [
                '台風情報: 気象庁サイトをチェック',
                '日焼け対策: 沖縄の紫外線は本土の1.5倍',
                '水分補給: 暑さ対策を忘れずに',
            ]
        },
        {
            id: 'hida',
            title: '🏔️ 飛騨高山・下呂エリア',
            icon: MapPin,
            color: 'green',
            contacts: [
                { name: '高山赤十字病院', number: '0577-32-1111', desc: '高山市', color: 'red' },
                { name: '下呂市立金山病院', number: '0576-32-2211', desc: '下呂市', color: 'blue' },
                { name: '高山タクシー', number: '0577-32-0246', desc: '観光・送迎', color: 'green' },
            ],
            tips: [
                '冬季は積雪注意: 滑りにくい靴を準備',
                '温泉: 入浴前に水分補給',
                '高山ラーメン: 醤油ベースがおすすめ',
            ]
        },
        {
            id: 'travel',
            title: '✈️ 旅行サポート',
            icon: Plane,
            color: 'indigo',
            contacts: [
                { name: 'JAF ロードサービス', number: '0570-00-8139', desc: '車のトラブル', color: 'yellow' },
                { name: 'JR東海お問合せ', number: '050-3772-3910', desc: '新幹線・特急', color: 'blue' },
                { name: 'ANA予約・案内', number: '0570-029-222', desc: '航空券', color: 'blue' },
            ]
        },
    ];

    // Useful phrases for travelers
    const phrases = [
        { jp: '助けてください', en: 'Help!', situation: '緊急時' },
        { jp: '病院に行きたいです', en: 'I need to go to a hospital', situation: '体調不良' },
        { jp: '道に迷いました', en: 'I\'m lost', situation: '迷子' },
        { jp: '日本語が話せません', en: 'I don\'t speak Japanese', situation: '言語' },
        { jp: 'タクシーを呼んでください', en: 'Please call a taxi', situation: '移動' },
    ];

    return (
        <div className="pt-4 space-y-4 pb-8">
            {/* Quick Emergency Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                    { name: '警察', number: '110', icon: '🚔', color: 'blue' },
                    { name: '救急', number: '119', icon: '🚑', color: 'red' },
                    { name: '海保', number: '118', icon: '⛵', color: 'cyan' },
                ].map((item) => (
                    <button
                        key={item.number}
                        onClick={() => handleCall(item.number)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl shadow-lg transition-all active:scale-95 ${item.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                                item.color === 'red' ? 'bg-red-500 hover:bg-red-600' :
                                    'bg-cyan-500 hover:bg-cyan-600'
                            } text-white`}
                    >
                        <span className="text-2xl mb-1">{item.icon}</span>
                        <span className="font-bold text-lg">{item.number}</span>
                        <span className="text-xs opacity-80">{item.name}</span>
                    </button>
                ))}
            </div>

            {/* Collapsible Sections */}
            {sections.map((section) => (
                <div key={section.id} className="bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden">
                    <button
                        onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-600/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-lg">{section.title}</span>
                        </div>
                        {expandedSection === section.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>

                    {expandedSection === section.id && (
                        <div className="border-t border-gray-100 dark:border-slate-600">
                            {/* Contacts */}
                            <div className="p-2 space-y-2">
                                {section.contacts.map((contact, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleCall(contact.number)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600/50 transition-colors"
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-gray-800 dark:text-slate-100">{contact.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400">{contact.desc}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-gray-600 dark:text-slate-300">{contact.number}</span>
                                            <div className="bg-green-500 text-white p-2 rounded-full">
                                                <Phone size={16} />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Tips */}
                            {section.tips && (
                                <div className="px-4 pb-4">
                                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 space-y-1">
                                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm mb-2">
                                            <Info size={16} />
                                            <span>旅のヒント</span>
                                        </div>
                                        {section.tips.map((tip, idx) => (
                                            <div key={idx} className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                                <span>•</span>
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* Useful Phrases */}
            <div className="bg-white dark:bg-slate-700 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-600">
                    <h3 className="font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                        💬 便利なフレーズ
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">タップでコピー</p>
                </div>
                <div className="p-2 space-y-1">
                    {phrases.map((phrase, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleCopy(phrase.jp)}
                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600/50 transition-colors"
                        >
                            <div className="text-left flex-1">
                                <div className="font-bold text-gray-800 dark:text-slate-100">{phrase.jp}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">{phrase.en}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-100 dark:bg-slate-600 px-2 py-1 rounded-full text-gray-600 dark:text-slate-300">
                                    {phrase.situation}
                                </span>
                                {copiedText === phrase.jp ? (
                                    <Check size={16} className="text-green-500" />
                                ) : (
                                    <Copy size={16} className="text-gray-400" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EmergencyContacts;
