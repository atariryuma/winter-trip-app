import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

let openSheets = 0;

/**
 * Bottom sheet on phones, centered dialog on larger screens.
 * Closes on Escape and backdrop tap, locks page scroll while open.
 */
export default function Sheet({ open, onClose, title, subtitle, children, footer, size = 'md', headerAction }) {
    const titleId = useId();
    const panelRef = useRef(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!open) return undefined;
        const previouslyFocused = document.activeElement;
        openSheets += 1;
        document.body.style.overflow = 'hidden';
        panelRef.current?.focus();

        const onKey = (e) => {
            if (e.key === 'Escape') onCloseRef.current?.();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            openSheets -= 1;
            if (openSheets === 0) document.body.style.overflow = '';
            previouslyFocused?.focus?.();
        };
    }, [open]);

    if (!open) return null;

    const width = size === 'lg' ? 'sm:max-w-2xl' : size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg';

    return createPortal(
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-center sm:p-6">
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                tabIndex={-1}
                className={`relative w-full ${width} max-h-[92dvh] sm:max-h-[85dvh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl outline-none animate-slide-up-spring sm:animate-scale-in`}
            >
                <div className="sm:hidden flex justify-center pt-2.5 pb-1" aria-hidden>
                    <div className="h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>
                {(title || headerAction) && (
                    <div className="flex items-start gap-3 px-5 pt-2 sm:pt-5 pb-3">
                        <div className="flex-1 min-w-0">
                            {title && (
                                <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white leading-snug break-words">
                                    {title}
                                </h2>
                            )}
                            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                        </div>
                        {headerAction}
                        <button
                            onClick={onClose}
                            className="shrink-0 p-2 -mr-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-label="閉じる"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
                {footer && (
                    <div className="px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-5 border-t border-slate-100 dark:border-slate-800">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}
