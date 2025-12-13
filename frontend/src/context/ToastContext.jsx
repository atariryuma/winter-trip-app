import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, XCircle, Info, X } from 'lucide-react';

// Toast Context
const ToastContext = createContext(null);

// Toast types and their styles
const TOAST_STYLES = {
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-900/90',
        border: 'border-amber-200 dark:border-amber-700',
        text: 'text-amber-700 dark:text-amber-200',
        icon: AlertCircle,
        iconColor: 'text-amber-500'
    },
    success: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/90',
        border: 'border-emerald-200 dark:border-emerald-700',
        text: 'text-emerald-700 dark:text-emerald-200',
        icon: CheckCircle,
        iconColor: 'text-emerald-500'
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-900/90',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-700 dark:text-red-200',
        icon: XCircle,
        iconColor: 'text-red-500'
    },
    info: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/90',
        border: 'border-indigo-200 dark:border-indigo-700',
        text: 'text-indigo-700 dark:text-indigo-200',
        icon: Info,
        iconColor: 'text-indigo-500'
    }
};

// Single Toast Component
const Toast = ({ id, type, message, onDismiss }) => {
    const style = TOAST_STYLES[type] || TOAST_STYLES.info;
    const Icon = style.icon;

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-sm
                ${style.bg} ${style.border} ${style.text}
                animate-slide-up-fade
            `}
        >
            <Icon size={18} className={`shrink-0 ${style.iconColor}`} />
            <span className="text-sm font-medium flex-1">{message}</span>
            <button
                onClick={() => onDismiss(id)}
                className="shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
};

// Toast Container - renders all active toasts
const ToastContainer = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return createPortal(
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-notification flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
            ))}
        </div>,
        document.body
    );
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((type, message, duration) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message }]);

        // Default duration based on type: error=5s, warning=4s, success/info=3s
        const defaultDuration = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000;
        const actualDuration = duration !== undefined ? duration : defaultDuration;

        // Auto dismiss
        if (actualDuration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, actualDuration);
        }

        return id;
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast, dismissAll }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
