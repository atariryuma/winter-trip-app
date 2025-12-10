import React from 'react';
import { X, Navigation, MapPin } from 'lucide-react';

const RouteModal = ({ origin, destination, onClose }) => {
    // Fallback if origin is missing
    const from = origin || '現在地';
    const to = destination || '目的地';

    // Google Maps Embed API - Directions Mode
    // API KEY is reused from MapView.jsx
    const API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8';

    // Construct Embed URL
    // Use 'directions' mode
    const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${API_KEY}&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&mode=transit`;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full sm:max-w-3xl h-[85dvh] sm:h-[80vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

                {/* Header */}
                <div className="shrink-0 p-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between z-10">
                    <div className="flex flex-col gap-1 w-full pr-8">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                            <MapPin size={14} />
                            <span className="truncate max-w-[150px]">{from}</span>
                        </div>
                        <div className="pl-1.5 flex items-center gap-2">
                            <div className="w-0.5 h-3 bg-gray-300 dark:bg-slate-600 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-white text-lg">
                            <Navigation size={18} className="text-blue-500" />
                            <span className="truncate">{to}</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Map Iframe */}
                <div className="flex-1 bg-gray-50 dark:bg-slate-900 relative">
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={embedUrl}
                        title="Route Map"
                    ></iframe>
                </div>

                {/* Footer Actions */}
                <div className="shrink-0 p-4 border-t border-gray-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm safe-area-pb">
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                    >
                        <ExternalLinkIcon size={18} />
                        Googleマップアプリで開く
                    </a>
                </div>
            </div>
        </div>
    );
};

const ExternalLinkIcon = ({ size }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

export default RouteModal;
