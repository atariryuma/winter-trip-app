import { useEffect, useId, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import api from '../../lib/api';

/** Text input with Google Places suggestions (via GAS), keyboard accessible. */
export default function PlaceInput({ label, value, onChange, placeholder, hint, autoFocus, large }) {
    const id = useId();
    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(-1);
    const timer = useRef(null);
    const lastQuery = useRef('');

    useEffect(() => () => clearTimeout(timer.current), []);

    const search = (query) => {
        clearTimeout(timer.current);
        lastQuery.current = query;
        if (!query || query.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        timer.current = setTimeout(async () => {
            const results = await api.getPlaceAutocomplete(query);
            if (lastQuery.current !== query) return;
            setSuggestions(results.slice(0, 6));
            setActive(-1);
        }, 300);
    };

    const pick = (s) => {
        onChange(s.description);
        setOpen(false);
        setSuggestions([]);
    };

    const onKeyDown = (e) => {
        if (!open || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            pick(suggestions[active]);
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setOpen(false);
        }
    };

    const showList = open && suggestions.length > 0;

    return (
        <div className="relative">
            <label htmlFor={id} className="field-label">{label}</label>
            <input
                id={id}
                type="text"
                value={value || ''}
                autoFocus={autoFocus}
                autoComplete="off"
                role="combobox"
                aria-expanded={showList}
                aria-controls={`${id}-list`}
                onChange={(e) => {
                    onChange(e.target.value);
                    setOpen(true);
                    search(e.target.value);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className={`field-input ${large ? 'text-base font-bold' : ''}`}
            />
            {hint && <p className="mt-1 px-1 text-xs text-slate-400">{hint}</p>}
            {showList && (
                <ul
                    id={`${id}-list`}
                    role="listbox"
                    className="absolute z-modal-content left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700"
                >
                    {suggestions.map((s, i) => (
                        <li key={s.placeId || s.description} role="option" aria-selected={i === active}>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => pick(s)}
                                className={`w-full flex items-center gap-2 px-4 py-3 text-left text-sm ${i === active ? 'bg-accent-50 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/60'}`}
                            >
                                <MapPin size={14} className="shrink-0 text-accent-500" />
                                <span className="truncate text-slate-700 dark:text-slate-200">{s.description}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
