import React from 'react';
import { Smartphone } from 'lucide-react';

const PortraitLock = () => (
    <div className="fixed inset-0 bg-gray-900 z-[9999] flex flex-col items-center justify-center text-white p-10 md:hidden landscape:flex hidden">
        <Smartphone size={64} className="mb-6 animate-pulse" />
        <h2 className="text-2xl font-bold mb-4">画面を縦にしてください</h2>
        <p className="text-gray-400 text-center">このアプリはスマートフォンでの縦画面表示に最適化されています。</p>
    </div>
);

export default PortraitLock;
