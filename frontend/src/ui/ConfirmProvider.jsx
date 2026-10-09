import { useCallback, useMemo, useState } from 'react';
import { ConfirmContext } from './contexts';
import Sheet from './Sheet';

export default function ConfirmProvider({ children }) {
    const [request, setRequest] = useState(null);

    const confirm = useCallback((options) => new Promise((resolve) => {
        setRequest({ ...options, resolve });
    }), []);

    const settle = (answer) => {
        request?.resolve(answer);
        setRequest(null);
    };

    const value = useMemo(() => ({ confirm }), [confirm]);

    return (
        <ConfirmContext.Provider value={value}>
            {children}
            <Sheet open={!!request} onClose={() => settle(false)} title={request?.title} size="sm">
                {request?.message && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{request.message}</p>
                )}
                <div className="mt-5 flex gap-3">
                    <button
                        onClick={() => settle(false)}
                        className="flex-1 py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800"
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={() => settle(true)}
                        className={`flex-1 py-3 rounded-2xl font-bold text-white ${request?.destructive ? 'bg-rose-600' : 'bg-sky-600'}`}
                    >
                        {request?.confirmLabel || 'OK'}
                    </button>
                </div>
            </Sheet>
        </ConfirmContext.Provider>
    );
}
