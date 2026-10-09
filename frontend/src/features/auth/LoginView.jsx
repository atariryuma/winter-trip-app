import { useState } from 'react';
import { ArrowRight, Snowflake } from 'lucide-react';
import api from '../../lib/api';
import { Spinner } from '../../ui/atoms';

export default function LoginView({ onLogin }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    // null | 'invalid' | 'network'
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        if (code.length < 4 || loading) return;
        setLoading(true);
        setError(null);
        try {
            if (await api.validatePasscode(code)) {
                onLogin();
                return;
            }
            setError('invalid');
            setCode('');
        } catch {
            // Keep the code so the user can just retry.
            setError('network');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 px-6 text-white">
            <div className="w-full max-w-sm">
                <div className="w-16 h-16 rounded-3xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
                    <Snowflake size={30} className="text-sky-200" />
                </div>
                <h1 className="mt-6 text-4xl font-black tracking-tight">TripPlanner</h1>
                <p className="mt-2 text-white/60">家族の旅のしおり。予定・予約・持ち物・お金をみんなで共有。</p>

                <form onSubmit={submit} className="mt-10">
                    <label htmlFor="passcode" className="text-xs font-bold tracking-wider text-white/60">合言葉</label>
                    <div className={`mt-2 flex items-center rounded-2xl bg-white/10 ring-1 ${error ? 'ring-rose-400 animate-shake' : 'ring-white/15 focus-within:ring-sky-300'}`}>
                        <input
                            id="passcode"
                            type="password"
                            inputMode="numeric"
                            autoComplete="current-password"
                            autoFocus
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                                setError(null);
                            }}
                            className="flex-1 min-w-0 bg-transparent px-5 py-4 text-2xl tracking-[0.5em] outline-none placeholder:text-white/20 placeholder:tracking-normal placeholder:text-base"
                            placeholder="4桁以上"
                        />
                        <button
                            type="submit"
                            disabled={code.length < 4 || loading}
                            className="m-1.5 w-12 h-12 rounded-xl bg-white text-slate-900 flex items-center justify-center disabled:opacity-30"
                            aria-label="ログイン"
                        >
                            {loading ? <Spinner className="w-5 h-5" /> : <ArrowRight size={20} />}
                        </button>
                    </div>
                    <p className="mt-3 min-h-5 text-sm text-rose-300" role="alert">
                        {error === 'invalid' && '合言葉が違います'}
                        {error === 'network' && 'サーバーに接続できませんでした。通信環境を確認して、もう一度お試しください'}
                    </p>
                </form>
            </div>
        </div>
    );
}
