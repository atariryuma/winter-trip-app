import React, { useState } from 'react';
import { Plane, Lock, ArrowRight } from 'lucide-react';

export default function LoginView({ onLogin, validatePasscode, yearRange = "2025" }) {
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (passcode.length < 4) return;

        setLoading(true);
        setError(false);

        try {
            const isValid = await validatePasscode(passcode);
            if (isValid) {
                onLogin();
            } else {
                throw new Error('Invalid passcode');
            }
        } catch (err) {
            setError(true);
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setPasscode('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white dark:bg-slate-900">
            {/* Left Side - Branding (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 text-white items-center justify-center p-12">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
                    <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 transform -rotate-12" size={400} />
                </div>

                <div className="relative z-content max-w-lg text-center lg:text-left">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl mb-8 border border-white/20 shadow-xl">
                        <Plane className="text-white transform -rotate-45" size={40} />
                    </div>
                    <h1 className="text-6xl font-bold mb-6 tracking-tight leading-tight">
                        Trip<br />Planner
                    </h1>
                    <p className="text-xl text-indigo-100 font-light tracking-wide mb-8">
                        Kyushu <span className="mx-3 opacity-60">To</span> Okinawa
                    </p>
                    <div className="inline-block px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm font-medium tracking-wider uppercase">
                        {yearRange} Trip Itinerary
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form (Desktop & Mobile) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[#F0F2F5] dark:bg-slate-900 lg:bg-white lg:dark:bg-slate-900 relative">
                {/* Mobile Background (Absolute) */}
                <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-800 z-base"></div>

                <div className={`w-full max-w-sm bg-white/90 lg:bg-white dark:bg-slate-800 lg:dark:bg-slate-800 backdrop-blur-xl lg:backdrop-blur-none rounded-3xl p-8 lg:p-12 shadow-2xl lg:shadow-none border border-white/20 lg:border-none z-content transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>

                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                            <Plane className="text-white -rotate-45" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">TripPlanner</h2>
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <h2 className="hidden lg:block text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm lg:text-base">
                            Enter your passcode to access the itinerary.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className={`h-5 w-5 transition-colors ${error ? 'text-red-400' : 'text-gray-400 group-focus-within:text-indigo-500'}`} />
                                </div>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={4}
                                    value={passcode}
                                    onChange={(e) => {
                                        setPasscode(e.target.value);
                                        setError(false);
                                    }}
                                    className={`block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-700 border rounded-2xl text-lg font-bold tracking-[0.5em] text-center text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-500 placeholder:tracking-normal placeholder:text-sm focus:ring-4 focus:outline-none transition-all ${error
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                        : 'border-gray-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20'
                                        }`}
                                    placeholder="PASSCODE"
                                    autoFocus
                                />
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-center text-red-500 font-medium animate-fade-in">
                                    Incorrect passcode
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || passcode.length < 4}
                            className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg transition-all transform active:scale-95 ${loading || passcode.length < 4
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40'
                                }`}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Enter</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                            Secured by TravelApp Auth
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
