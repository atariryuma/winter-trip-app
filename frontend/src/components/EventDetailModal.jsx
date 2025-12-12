import React, { useState, useEffect, useMemo } from 'react';
import { X, MapPin, Navigation, Star, Edit3, Clock, ArrowRight, Phone, Globe, Copy, Check, Map } from 'lucide-react';
import server from '../api/gas';

/**
 * EventDetailModal - Best practice design
 * 
 * Key principles applied:
 * 1. Key info at a glance (name, time, status prominently)
 * 2. Easy dismissal (X button, tap outside)
 * 3. Actionable options (Map, Route, Call as primary actions)
 * 4. Progressive disclosure (details below fold)
 * 5. Mobile-first (large tap targets, responsive)
 * 6. Inline map images for quick visual reference
 */
const EventDetailModal = ({ event, onClose, onEdit, previousEvent, previousDayHotel }) => {
    const [placeInfo, setPlaceInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [staticMapImage, setStaticMapImage] = useState(null);
    const [routeMapData, setRouteMapData] = useState(null);
    const [loadingMaps, setLoadingMaps] = useState(false);

    const categoryIcons = {
        'flight': '✈️', 'train': '🚄', 'bus': '🚌',
        'hotel': '🏨', 'meal': '🍽️', 'sightseeing': '📍',
    };

    // Get route origin and destination based on event type - memoized for optimization
    const { routeOrigin, routeDestination, placeQuery } = useMemo(() => {
        // For transport events (flight, train, bus), use the event's own from/to
        if (event?.type === 'transport') {
            return {
                routeOrigin: event.from || null,
                routeDestination: event.to || null,
                placeQuery: event.to || event.name || event.from
            };
        }

        // For non-transport events, route from previous location to this event
        let origin = null;
        if (previousEvent) {
            // Previous event's end location
            origin = previousEvent.to || previousEvent.name;
        } else if (previousDayHotel) {
            // Day 2+: start from previous day's hotel
            origin = previousDayHotel.name || previousDayHotel.to;
        }

        // Destination is where this event takes place
        const destination = event?.to || event?.name || null;

        return {
            routeOrigin: origin,
            routeDestination: destination,
            placeQuery: destination
        };
    }, [event?.type, event?.from, event?.to, event?.name, previousEvent?.to, previousEvent?.name, previousDayHotel?.name, previousDayHotel?.to]);

    // Fetch place info - only when placeQuery changes
    useEffect(() => {
        if (!placeQuery) {
            setPlaceInfo(null);
            setLoading(false);
            return;
        }

        const fetchPlaceInfo = async () => {
            setLoading(true);
            try {
                const info = await server.getPlaceInfo(placeQuery);
                setPlaceInfo(info);
            } catch (err) {
                console.error('Failed to fetch place info:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlaceInfo();
    }, [placeQuery]);

    // Fetch map images when placeInfo is loaded - only when location strings change
    useEffect(() => {
        if (loading) return; // Wait for place info to finish loading

        const mapLocation = placeInfo?.formattedAddress || routeDestination;

        if (!mapLocation) {
            setStaticMapImage(null);
            setRouteMapData(null);
            setLoadingMaps(false);
            return;
        }

        const fetchMaps = async () => {
            setLoadingMaps(true);
            try {
                // Fetch static map for destination
                const mapImage = await server.getStaticMap(mapLocation);
                setStaticMapImage(mapImage);

                // Fetch route map if we have origin
                if (routeOrigin && routeDestination) {
                    const routeData = await server.getRouteMap(routeOrigin, routeDestination);
                    setRouteMapData(routeData);
                }
            } catch (err) {
                console.error('Failed to fetch maps:', err);
            } finally {
                setLoadingMaps(false);
            }
        };

        fetchMaps();
    }, [placeInfo?.formattedAddress, loading, routeOrigin, routeDestination]);

    if (!event) return null;

    const mapsUrl = placeInfo?.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.name)}`;
    const directionsUrl = routeOrigin
        ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeOrigin)}&destination=${encodeURIComponent(routeDestination)}`
        : null;

    const icon = categoryIcons[event.category] || '📌';
    const isConfirmed = event.status === 'confirmed' || event.status === 'booked';
    const displayFrom = event.from || (previousDayHotel && !previousEvent ? previousDayHotel.name : null);

    const copyBookingRef = () => {
        if (event.bookingRef) {
            navigator.clipboard.writeText(event.bookingRef);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 z-modal flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 overflow-hidden flex flex-col max-h-[85vh] rounded-t-2xl sm:rounded-2xl animate-slide-up-spring">

                {/* === HERO: Key info at a glance === */}
                <div className="relative p-4 pb-3">
                    {/* Close button - Easy dismissal */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Icon + Status row */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-2xl">
                            {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            {/* Status badge */}
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${isConfirmed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                {isConfirmed ? '確定' : '計画中'}
                            </span>
                            {/* Time - prominent */}
                            {event.time && (
                                <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                                    <Clock size={14} />
                                    <span className="text-sm font-medium">
                                        {event.time}{event.endTime ? ` → ${event.endTime}` : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Title - largest element */}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                        {event.name}
                    </h2>
                </div>

                {/* === CONTENT === */}
                <div className="flex-1 overflow-y-auto">
                    {/* Photo - Visual engagement */}
                    {!loading && placeInfo?.photoUrl && (
                        <div className="px-4 pb-3">
                            <img
                                src={placeInfo.photoUrl}
                                alt={event.name}
                                className="w-full h-32 object-cover rounded-xl"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        </div>
                    )}

                    {/* === MAP IMAGES SECTION === */}
                    {(staticMapImage || routeMapData?.image || loadingMaps) && (
                        <div className="px-4 pb-3 space-y-2">
                            {/* Loading state */}
                            {loadingMaps && !staticMapImage && !routeMapData && (
                                <div className="w-full h-24 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Map size={18} className="animate-pulse" />
                                        <span className="text-sm">地図を読み込み中...</span>
                                    </div>
                                </div>
                            )}

                            {/* Route Map (prioritized if available) */}
                            {routeMapData?.image && (
                                <div className="relative">
                                    <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={routeMapData.image}
                                            alt="ルート"
                                            className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-slate-700"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                        {/* Route info overlay */}
                                        <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                                            {routeMapData.duration && (
                                                <span className="px-2 py-1 bg-black/70 text-white text-xs font-bold rounded-lg">
                                                    {routeMapData.duration}
                                                </span>
                                            )}
                                            {routeMapData.distance && (
                                                <span className="px-2 py-1 bg-black/50 text-white/90 text-xs rounded-lg">
                                                    {routeMapData.distance}
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                </div>
                            )}

                            {/* Static Map (shown if no route map, or no photo) */}
                            {staticMapImage && !routeMapData?.image && !placeInfo?.photoUrl && (
                                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={staticMapImage}
                                        alt="地図"
                                        className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-slate-700"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                </a>
                            )}
                        </div>
                    )}

                    {/* === PRIMARY ACTIONS === */}
                    <div className="px-4 pb-3">
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-xl active:scale-[0.98] transition-transform"
                        >
                            <MapPin size={18} />
                            マップで開く
                        </a>
                    </div>

                    {/* === DETAILS (Progressive disclosure) === */}
                    <div className="px-4 pb-4 space-y-2">
                        {/* From → To */}
                        {(displayFrom || event.to) && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                <span className="text-sm text-gray-600 dark:text-slate-300 truncate">{displayFrom || '—'}</span>
                                <ArrowRight size={16} className="text-gray-400 shrink-0" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{event.to || event.name}</span>
                            </div>
                        )}

                        {/* Rating */}
                        {placeInfo?.rating && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                <Star size={16} className="text-amber-500 fill-amber-500" />
                                <span className="font-bold text-gray-900 dark:text-white">{placeInfo.rating}</span>
                                {placeInfo.userRatingCount && (
                                    <span className="text-xs text-gray-500">({placeInfo.userRatingCount.toLocaleString()}件)</span>
                                )}
                            </div>
                        )}

                        {/* Booking Ref - Copyable */}
                        {event.bookingRef && (
                            <button
                                onClick={copyBookingRef}
                                className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-left"
                            >
                                <div>
                                    <p className="text-[10px] font-bold text-green-600 uppercase">予約番号</p>
                                    <p className="font-mono font-bold text-gray-900 dark:text-white">{event.bookingRef}</p>
                                </div>
                                {copied ? (
                                    <Check size={18} className="text-green-600" />
                                ) : (
                                    <Copy size={18} className="text-gray-400" />
                                )}
                            </button>
                        )}

                        {/* Memo */}
                        {event.details && (
                            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">メモ</p>
                                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{event.details}</p>
                            </div>
                        )}

                        {/* Secondary actions */}
                        {(placeInfo?.phone || placeInfo?.website) && (
                            <div className="flex gap-2 pt-1">
                                {placeInfo?.phone && (
                                    <a
                                        href={`tel:${placeInfo.phone}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-xl"
                                    >
                                        <Phone size={16} />
                                        電話
                                    </a>
                                )}
                                {placeInfo?.website && (
                                    <a
                                        href={placeInfo.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm font-medium rounded-xl"
                                    >
                                        <Globe size={16} />
                                        Web
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Address */}
                        {placeInfo?.formattedAddress && (
                            <p className="text-xs text-gray-500 dark:text-slate-400 px-1">
                                {placeInfo.formattedAddress}
                            </p>
                        )}
                    </div>
                </div>

                {/* === FOOTER: Edit action === */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-800 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
                    <button
                        onClick={() => {
                            onClose();
                            if (onEdit) onEdit(event);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-[0.98] transition-all"
                    >
                        <Edit3 size={18} />
                        編集する
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventDetailModal;

