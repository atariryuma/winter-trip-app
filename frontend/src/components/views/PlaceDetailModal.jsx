import React, { useState, useRef } from 'react';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';

/**
 * PlaceDetailModal - Google Search with AI Overview
 * - Query: [name]+[category]について教えてください
 * - Auto-maximizes on touch/scroll
 */
const PlaceDetailModal = ({ event, onClose }) => {
    const [isMaximized, setIsMaximized] = useState(false);
    const iframeContainerRef = useRef(null);

    // Category labels in Japanese
    const categoryLabel = {
        'flight': '飛行機',
        'train': '電車',
        'bus': 'バス',
        'hotel': 'ホテル',
        'meal': 'レストラン',
        'sightseeing': '観光スポット',
    }[event?.category] || event?.category || '';

    // Search query for traveler-focused AI Overview
    const searchQuery = event ? `${categoryLabel}の${event.name}について、旅行者向けの情報はありますか？` : '';
    const searchUrl = `https://www.google.com/search?igu=1&q=${encodeURIComponent(searchQuery)}`;

    // Auto-maximize when user touches/scrolls iframe area
    const handleIframeTouch = () => {
        if (!isMaximized) {
            setIsMaximized(true);
        }
    };

    if (!event) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-end justify-center sm:items-center p-0 sm:p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal Content */}
            <div
                className={`
                    relative w-full bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col animate-slide-up
                    ${isMaximized ? 'h-[100dvh] rounded-none' : 'h-[85vh] sm:h-[80vh] rounded-t-3xl sm:rounded-3xl max-w-2xl'}
                `}
            >
                {/* Header */}
                <div className={`shrink-0 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-modal-content transition-all duration-300 ${isMaximized ? 'p-2' : 'p-4'}`}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h2 className={`font-bold text-gray-900 dark:text-white truncate ${isMaximized ? 'text-sm' : 'text-lg'}`}>
                                {event.name}
                            </h2>
                            {!isMaximized && (
                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{categoryLabel}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-600 hover:bg-gray-200 transition"
                            >
                                {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>
                            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-600 hover:bg-gray-200 transition">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Google Search iframe */}
                <div
                    ref={iframeContainerRef}
                    className="flex-1 relative bg-gray-100 dark:bg-slate-950"
                    onTouchStart={handleIframeTouch}
                    onMouseDown={handleIframeTouch}
                >
                    <iframe
                        src={searchUrl}
                        title="Google Search"
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                </div>
            </div>
        </div>
    );
};

export default PlaceDetailModal;
