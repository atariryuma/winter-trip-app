import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);
export const ConfirmContext = createContext(null);

/** showToast(type, message, { action: { label, onClick }, duration }) */
export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

/** await confirm({ title, message, confirmLabel, destructive }) → boolean */
export const useConfirm = () => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
    return ctx;
};
