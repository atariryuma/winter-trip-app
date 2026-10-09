import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { PAYERS_KEY } from '../../lib/keys';

/** Choose who paid; the list of names is remembered on this device. */
export default function PayerPicker({ value, onChange }) {
    const [payers, setPayers] = useLocalStorage(PAYERS_KEY, []);
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');
    const options = value && !payers.includes(value) ? [...payers, value] : payers;

    const add = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        if (!payers.includes(trimmed)) setPayers([...payers, trimmed]);
        onChange(trimmed);
        setName('');
        setAdding(false);
    };

    return (
        <fieldset>
            <legend className="field-label">支払った人</legend>
            <div className="flex flex-wrap gap-2">
                {options.map((p) => (
                    <button
                        type="button"
                        key={p}
                        onClick={() => onChange(p)}
                        aria-pressed={value === p}
                        className={`chip ${value === p ? 'chip-selected' : ''}`}
                    >
                        {p}
                    </button>
                ))}
                {adding ? (
                    <div className="flex items-center gap-2">
                        <input
                            autoFocus
                            className="field-input !py-2 w-32"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    add();
                                }
                            }}
                            placeholder="名前"
                            aria-label="支払った人の名前"
                        />
                        <button type="button" onClick={add} className="chip chip-selected">追加</button>
                    </div>
                ) : (
                    <button type="button" onClick={() => setAdding(true)} className="chip border-dashed">
                        <Plus size={14} /> 追加
                    </button>
                )}
            </div>
        </fieldset>
    );
}
