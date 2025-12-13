import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, MapPin, Navigation, Copy, Check, Trash2, Ticket } from 'lucide-react';
import server from '../api/gas';
import { getIcon } from './common/IconHelper';
import StatusBadge from './common/StatusBadge';

/**
 * EventCard - Expandable event card with iOS spring animation
 * Expands in-place to show full details (map, address, booking ref, route button)
 */
const EventCard = ({
    event,
    isExpanded,
    onToggle,
    isEditMode,
    onEdit,
    onDelete,
    routeOrigin
}) => {
    const [placeInfo, setPlaceInfo] = useState(null);
    const [staticMapImage, setStaticMapImage] = useState(null);
    const [loadingMap, setLoadingMap] = useState(false);
    const [copied, setCopied] = useState(false);
    const contentRef = useRef(null);
    const cardRef = useRef(null);
    const [contentHeight, setContentHeight] = useState(0);

    // Calculate content height for smooth animation
    useEffect(() => {
        if (isExpanded) {
            // Set initial height immediately for fast expand
            if (contentHeight === 0) {
                setContentHeight(400);
            }
            // Then update with actual height when content is available
            if (contentRef.current) {
                const newHeight = contentRef.current.scrollHeight;
                if (newHeight > 0) {
                    setContentHeight(Math.max(newHeight, 100));
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded, placeInfo, staticMapImage, loadingMap]);

    // Calculate query string for place lookup
    const placeQuery = event
        ? (event.type === 'transport' ? event.from : (event.to || event.name))
        : null;

    // Fetch place info and map when expanded (lazy loading)
    useEffect(() => {
        if (!isExpanded || !placeQuery) {
            return;
        }

        const fetchData = async () => {
            setLoadingMap(true);
            try {
                const info = await server.getPlaceInfo(placeQuery);
                setPlaceInfo(info);

                const mapLocation = info?.formattedAddress || placeQuery;
                const mapImage = await server.getStaticMap(mapLocation);
                setStaticMapImage(mapImage);
            } catch (err) {
                console.error('Failed to fetch place data:', err);
            } finally {
                setLoadingMap(false);
            }
        };

        fetchData();
    }, [isExpanded, placeQuery]);

    // Route logic - Skip for flights (driving directions don't apply to air travel)
    const isFlight = event?.category === 'flight';
    const getRouteDestination = () => event?.type === 'transport' ? event.from : (event?.to || event?.name);
    const routeDest = getRouteDestination();
    const directionsUrl = !isFlight && routeOrigin && routeDest
        ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeOrigin)}&destination=${encodeURIComponent(routeDest)}`
        : null;
    const mapsUrl = placeInfo?.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event?.name || '')}`;

    const copyBookingRef = (e) => {
        e.stopPropagation();
        if (event.bookingRef) {
            navigator.clipboard.writeText(event.bookingRef);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCardClick = () => {
        if (isEditMode) {
            onEdit?.(event);
        } else {
            onToggle?.();
            // 展開時のみ、アニメーション完了後に条件付きスクロール
            if (!isExpanded && cardRef.current) {
                setTimeout(() => {
                    if (!cardRef.current) return;
                    const rect = cardRef.current.getBoundingClientRect();
                    const headerHeight = 56; // モバイルヘッダー高さ
                    const footerHeight = 80; // ボトムナビ高さ
                    const viewportTop = headerHeight;
                    const viewportBottom = window.innerHeight - footerHeight;

                    // カードが画面外にはみ出している場合のみスクロール
                    if (rect.top < viewportTop || rect.bottom > viewportBottom) {
                        cardRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }, 380); // 350msアニメーション + 30msバッファ
            }
        }
    };

    if (!event) return null;

    return (
        <div
            ref={cardRef}
            className={`relative overflow-hidden transition-shadow duration-300 ease-out
                rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700
                ${isExpanded ? 'shadow-md ring-1 ring-indigo-300 dark:ring-indigo-500' : ''}
                ${isEditMode ? 'opacity-90' : ''}`}
        >
            {/* Header - Always Visible */}
            <div
                className="p-4 cursor-pointer active:scale-[0.98] transition-transform duration-150"
                onClick={handleCardClick}
            >
                {/* Time + Category + Status Row */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 rounded-full bg-indigo-500"></div>
                            <span className="font-mono font-bold text-base text-slate-700 dark:text-slate-200">
                                {event.time || '未定'}{event.endTime ? ` → ${event.endTime}` : ''}
                            </span>
                        </div>
                        <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1
                            ${event.type === 'stay' || event.type === 'transport'
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30'
                                : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'}`}
                        >
                            {getIcon(event.category, event.type, { size: 10 })}
                            <span>{event.category}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Status Badge - Clickable for planned/suggested */}
                        <div
                            onClick={(e) => {
                                if (event.status !== 'confirmed' && event.status !== 'booked') {
                                    e.stopPropagation();
                                    onEdit?.(event);
                                }
                            }}
                            className={event.status !== 'confirmed' && event.status !== 'booked'
                                ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all'
                                : ''}
                        >
                            <StatusBadge status={event.status} />
                        </div>
                        {/* Delete Button in Edit Mode */}
                        {isEditMode && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Use setTimeout to decouple confirm dialog from click event
                                    // This fixes the issue where dialog closes immediately on some browsers
                                    setTimeout(() => onDelete?.(), 10);
                                }}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Event Name */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-1 break-words">
                    {event.name}
                </h3>

                {/* Transport From/To - Timeline style */}
                {event.type === 'transport' && (event.from || event.to) && (
                    <div className="p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm">
                        <div className="flex">
                            {/* Timeline dots and line */}
                            <div className="flex flex-col items-center mr-3">
                                <div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-400 bg-white dark:bg-slate-800" />
                                <div className="w-0.5 h-4 bg-indigo-300 dark:bg-indigo-600" />
                                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            </div>
                            {/* Locations */}
                            <div className="flex flex-col justify-between min-w-0">
                                <span className="text-gray-600 dark:text-slate-300 truncate">{event.from || '?'}</span>
                                <span className="font-bold text-gray-900 dark:text-white truncate">{event.to || '?'}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details preview (collapsed only) */}
                {!isExpanded && event.details && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {event.details}
                    </p>
                )}
            </div>

            {/* Expanded Content - iOS spring animation */}
            <div
                ref={contentRef}
                className="overflow-hidden"
                style={{
                    maxHeight: isExpanded ? `${contentHeight || 500}px` : '0px',
                    opacity: isExpanded ? 1 : 0,
                    // iOS spring curve: quick start, gentle settle
                    transition: 'max-height 350ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 250ms ease-out'
                }}
            >
                <div className="px-4 pb-4 space-y-3 overflow-hidden">
                    {/* Map Image */}
                    {loadingMap ? (
                        <div className="h-28 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse flex items-center justify-center">
                            <MapPin className="text-gray-400 animate-bounce" size={20} />
                        </div>
                    ) : staticMapImage ? (
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={staticMapImage}
                                alt="Map"
                                className="w-full h-28 object-cover hover:scale-105 transition-transform duration-300"
                            />
                        </a>
                    ) : null}

                    {/* Address */}
                    {placeInfo?.formattedAddress && (
                        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400">
                            <MapPin size={12} className="mt-0.5 shrink-0" />
                            <span className="break-words break-all">{placeInfo.formattedAddress}</span>
                        </div>
                    )}

                    {/* Details/Memo */}
                    {event.details && (
                        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2.5">
                            <p className="text-xs text-gray-600 dark:text-slate-300 break-words whitespace-pre-wrap">{event.details}</p>
                        </div>
                    )}

                    {/* Booking Reference */}
                    {event.bookingRef && (
                        <div
                            className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                            onClick={copyBookingRef}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-green-600 dark:text-green-400">予約番号:</span>
                                <span className="font-mono font-bold text-xs text-green-700 dark:text-green-300">{event.bookingRef}</span>
                            </div>
                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-green-400" />}
                        </div>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex justify-end gap-2">
                        {/* 予約ボタン - 交通機関 かつ 未予約の場合 */}
                        {['flight', 'bus', 'train'].includes(event.category) &&
                         ['suggested', 'planned'].includes(event.status) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.(event);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold transition-colors"
                            >
                                <Ticket size={14} />
                                予約
                            </button>
                        )}
                        {directionsUrl && (
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Navigation size={14} />
                                ルート
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
