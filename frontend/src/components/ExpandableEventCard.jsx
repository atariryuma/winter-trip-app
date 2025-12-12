import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, MapPin, Navigation, Copy, Check, Trash2 } from 'lucide-react';
import server from '../api/gas';
import { getIcon } from './common/IconHelper';
import StatusBadge from './common/StatusBadge';

/**
 * ExpandableEventCard - iOS HIG compliant expandable card
 * 
 * Animation: Smooth spring-like expand from click point
 * Style: White card (same as collapsed), matching DynamicSummary button sizes
 */
const ExpandableEventCard = ({
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
    const headerRef = useRef(null);
    const [contentHeight, setContentHeight] = useState(0);
    const [headerTopBefore, setHeaderTopBefore] = useState(null);

    // Position correction after expansion to keep header visible
    useEffect(() => {
        if (isExpanded && headerRef.current && headerTopBefore !== null) {
            requestAnimationFrame(() => {
                const headerRect = headerRef.current.getBoundingClientRect();
                const diff = headerRect.top - headerTopBefore;
                if (Math.abs(diff) > 5) {
                    window.scrollBy({ top: diff, behavior: 'smooth' });
                }
                setHeaderTopBefore(null);
            });
        }
    }, [isExpanded, headerTopBefore]);

    // Calculate content height for smooth animation - use large initial value for immediate expand
    useEffect(() => {
        if (isExpanded) {
            // Set initial height immediately for fast expand
            if (contentHeight === 0) {
                setContentHeight(400);
            }
            // Then update with actual height when content is available
            if (contentRef.current) {
                const newHeight = contentRef.current.scrollHeight;
                if (newHeight > 400) {
                    setContentHeight(newHeight);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isExpanded, placeInfo, staticMapImage]);

    // Calculate query string outside useEffect for optimization
    const placeQuery = event
        ? (event.type === 'transport' ? event.from : (event.to || event.name))
        : null;

    // Fetch place info and map when expanded
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
    }, [isExpanded, placeQuery]); // Only re-fetch when expanded state or query string changes

    // Route logic
    // For transport: show route from previous location TO the departure station (event.from)
    // For other events: show route from previous location to this event
    const getRouteDestination = () => event?.type === 'transport' ? event.from : (event?.to || event?.name);
    const getEventRouteOrigin = () => routeOrigin; // Always use previous location as origin

    const routeDest = getRouteDestination();
    const routeOrg = getEventRouteOrigin();

    const directionsUrl = routeOrg && routeDest
        ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeOrg)}&destination=${encodeURIComponent(routeDest)}`
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
                ref={headerRef}
                className="p-4 cursor-pointer"
                onClick={() => {
                    if (isEditMode) {
                        onEdit?.(event);
                    } else {
                        // Record header position before expansion
                        if (!isExpanded && headerRef.current) {
                            setHeaderTopBefore(headerRef.current.getBoundingClientRect().top);
                        }
                        onToggle?.();
                    }
                }}
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
                                    e.stopPropagation();
                                    onDelete?.();
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

                {/* Transport From/To */}
                {event.type === 'transport' && (event.from || event.to) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mb-2">
                        <span>{event.from || '?'}</span>
                        <ArrowRight size={12} className="shrink-0" />
                        <span>{event.to || '?'}</span>
                    </div>
                )}

                {/* Details preview (collapsed only) */}
                {!isExpanded && event.details && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                        {event.details}
                    </p>
                )}
            </div>

            {/* Expanded Content - Downward expansion only */}
            <div
                ref={contentRef}
                className="overflow-hidden"
                style={{
                    maxHeight: isExpanded ? `${contentHeight || 500}px` : '0px',
                    opacity: isExpanded ? 1 : 0,
                    transition: 'max-height 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-out'
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

                    {/* Route Button - Right aligned, DynamicSummary size */}
                    {directionsUrl && (
                        <div className="flex justify-end">
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpandableEventCard;
