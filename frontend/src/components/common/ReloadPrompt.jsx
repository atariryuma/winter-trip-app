import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function ReloadPrompt() {
    const [needRefresh, setNeedRefresh] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // Check for updates on load and on focus
            const updateSW = () => {
                navigator.serviceWorker.ready.then(registration => {
                    registration.update();
                });
            };

            window.addEventListener('focus', updateSW);

            // Listen for new worker logic
            navigator.serviceWorker.ready.then(registration => {
                // Check if there's already a waiting worker
                if (registration.waiting) {
                    setNeedRefresh(true);
                }

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setNeedRefresh(true);
                            }
                        });
                    }
                });
            });

            // Listen for controller change (when skipWaiting finishes)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    setNeedRefresh(true);
                }
            });

            return () => window.removeEventListener('focus', updateSW);
        }
    }, []);

    const handleReload = () => {
        // If there is a waiting worker, we might need to tell it to skipWaiting, 
        // but our SW does it automatically on install. 
        // Just reloading should be enough if the new SW has claimed clients.
        window.location.reload();
    };

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-50 animate-in slide-in-from-bottom duration-300">
            <div className="bg-slate-800/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2 rounded-full animate-pulse">
                        <RefreshCw size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">アップデート利用可能</p>
                        <p className="text-xs text-slate-300">新しいバージョンを適用します</p>
                    </div>
                </div>
                <button
                    onClick={handleReload}
                    className="bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-100 active:scale-95 transition"
                >
                    更新する
                </button>
            </div>
        </div>
    );
}
