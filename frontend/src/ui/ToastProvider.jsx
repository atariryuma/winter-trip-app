import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { ToastContext } from './contexts';

const STYLES = {
    success: { icon: CheckCircle2, iconCls: 'text-emerald-400' },
    warning: { icon: AlertTriangle, iconCls: 'text-amber-400' },
    error: { icon: XCircle, iconCls: 'text-rose-400' },
    info: { icon: Info, iconCls: 'text-sky-400' },
};

const DEFAULT_DURATION = { error: 6000, warning: 4500, success: 3000, info: 3000 };

export default function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(0);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((type, message, options = {}) => {
        const id = ++nextId.current;
        const duration = options.duration ?? (options.action ? 5000 : DEFAULT_DURATION[type] ?? 3000);
        setToasts((prev) => [...prev.slice(-2), { id, type, message, action: options.action }]);
        if (duration > 0) setTimeout(() => dismissToast(id), duration);
        return id;
    }, [dismissToast]);

    const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {createPortal(
                <div
                    className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 z-notification flex flex-col items-center gap-2 px-4 pointer-events-none"
                    role="status"
                    aria-live="polite"
                >
                    {toasts.map((t) => {
                        const style = STYLES[t.type] || STYLES.info;
                        const Icon = style.icon;
                        return (
                            <div
                                key={t.id}
                                className="pointer-events-auto w-full max-w-sm flex items-center gap-3 rounded-2xl bg-slate-900/95 dark:bg-slate-700/95 text-white pl-4 pr-2 py-2.5 shadow-xl backdrop-blur animate-slide-up-fade"
                            >
                                <Icon size={18} className={`shrink-0 ${style.iconCls}`} />
                                <span className="flex-1 text-sm leading-snug py-1">{t.message}</span>
                                {t.action && (
                                    <button
                                        onClick={() => {
                                            t.action.onClick();
                                            dismissToast(t.id);
                                        }}
                                        className="shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold text-sky-300 hover:bg-white/10"
                                    >
                                        {t.action.label}
                                    </button>
                                )}
                                <button
                                    onClick={() => dismissToast(t.id)}
                                    className="shrink-0 p-1.5 rounded-lg text-white/60 hover:bg-white/10"
                                    aria-label="閉じる"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>,
                document.body,
            )}
        </ToastContext.Provider>
    );
}
