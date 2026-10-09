import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

/** Offers a reload once a new service worker has taken over an already-controlled page. */
export default function UpdatePrompt() {
    const [needRefresh, setNeedRefresh] = useState(false);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return undefined;
        // On the very first visit there is no controller yet; claiming it is not an update.
        const wasControlled = !!navigator.serviceWorker.controller;
        const onControllerChange = () => {
            if (wasControlled) setNeedRefresh(true);
        };
        const checkForUpdate = () => {
            navigator.serviceWorker.getRegistration().then((reg) => reg?.update()).catch(() => {});
        };
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
        window.addEventListener('focus', checkForUpdate);
        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            window.removeEventListener('focus', checkForUpdate);
        };
    }, []);

    if (!needRefresh) return null;

    return (
        <div className="fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] z-notification flex justify-center px-4">
            <div className="w-full max-w-sm flex items-center gap-3 rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-xl animate-slide-up-fade">
                <RefreshCw size={18} className="text-sky-300 shrink-0" />
                <p className="flex-1 text-sm">新しいバージョンがあります</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-sm font-bold"
                >
                    更新
                </button>
            </div>
        </div>
    );
}
