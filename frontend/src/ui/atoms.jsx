import { categoryMeta, STATUSES, isConfirmed } from '../lib/trip';

export function CategoryIcon({ category, size = 18, className = '' }) {
    const meta = categoryMeta(category);
    const Icon = meta.icon;
    return (
        <span className={`inline-flex items-center justify-center rounded-xl ${meta.toneClasses.soft} ${className}`}>
            <Icon size={size} />
        </span>
    );
}

export function StatusPill({ status, className = '' }) {
    const key = status === 'booked' ? 'confirmed' : status;
    const meta = STATUSES[key] || STATUSES.planned;
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${meta.cls} ${className}`}>
            {meta.label}
        </span>
    );
}

export function NeedsBookingPill({ event }) {
    if (isConfirmed(event)) return null;
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
            要予約
        </span>
    );
}

export function Spinner({ className = 'w-5 h-5' }) {
    return (
        <span
            className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin opacity-70 ${className}`}
            aria-label="読み込み中"
        />
    );
}

export function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-2 mt-6 first:mt-0">
            <h3 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400">{children}</h3>
            {action}
        </div>
    );
}

export function Card({ children, className = '', ...props }) {
    return (
        <div
            className={`rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
