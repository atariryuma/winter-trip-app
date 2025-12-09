import React, { useState, useEffect } from 'react';
import { X, MapPin, ExternalLink, Lightbulb, Loader2, AlertCircle, Phone, Clock, Star, Globe, MessageSquare } from 'lucide-react';

/**
 * PlaceInfoModal - Shows dynamic place details from Google Places API
 * Displays: address, phone, hours, rating, reviews, editorial summary, travel tips
 */
const PlaceInfoModal = ({ isOpen, onClose, placeName, getPlaceInfo }) => {
    const [placeData, setPlaceData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && placeName) {
            setLoading(true);
            setError(null);
            setPlaceData(null);

            getPlaceInfo(placeName)
                .then(data => {
                    setPlaceData(data);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
        }
    }, [isOpen, placeName, getPlaceInfo]);

    if (!isOpen) return null;

    // Rating stars component
    const RatingStars = ({ rating }) => {
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 >= 0.5;
        return (
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        size={14}
                        className={i < fullStars ? 'fill-yellow-400 text-yellow-400' : (i === fullStars && hasHalf ? 'fill-yellow-400/50 text-yellow-400' : 'text-gray-300')}
                    />
                ))}
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700 shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-700">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                            <MapPin size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="font-bold text-gray-800 dark:text-slate-100 truncate">{placeName}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-gray-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                            <p className="text-sm text-gray-500 dark:text-slate-400">情報を取得中...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-3">
                            <AlertCircle size={32} className="text-red-400" />
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}

                    {/* Place Data */}
                    {placeData && !loading && (
                        <>
                            {/* Place Photo (Hero Image) */}
                            {placeData.photoUrl && (
                                <div className="relative -mx-4 -mt-4 mb-4 overflow-hidden bg-gray-100 dark:bg-slate-700">
                                    <img
                                        src={placeData.photoUrl}
                                        alt={placeData.name || placeName}
                                        className="w-full h-48 object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                            // Hide image on error
                                            e.target.style.display = 'none';
                                            e.target.parentElement.style.display = 'none';
                                        }}
                                    />
                                    {/* Gradient overlay for better text readability if needed */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                </div>
                            )}

                            {/* Rating & Reviews Count */}
                            {placeData.rating && (
                                <div className="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 border border-yellow-100 dark:border-yellow-800/30">
                                    <div className="flex items-center gap-2">
                                        <RatingStars rating={placeData.rating} />
                                        <span className="font-bold text-yellow-700 dark:text-yellow-300">{placeData.rating.toFixed(1)}</span>
                                    </div>
                                    {placeData.userRatingCount && (
                                        <span className="text-sm text-yellow-600 dark:text-yellow-400">
                                            ({placeData.userRatingCount.toLocaleString()}件のレビュー)
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Editorial Summary */}
                            {placeData.editorialSummary && (
                                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                                    <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed italic">
                                        "{placeData.editorialSummary}"
                                    </p>
                                </div>
                            )}

                            {/* Address */}
                            {placeData.formattedAddress && (
                                <div className="flex items-start gap-3">
                                    <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-700 dark:text-slate-200 break-words">{placeData.formattedAddress}</p>
                                </div>
                            )}

                            {/* Phone */}
                            {placeData.phone && (
                                <a href={`tel:${placeData.phone}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl p-2 -ml-2 transition-colors">
                                    <Phone size={18} className="text-green-500 shrink-0" />
                                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{placeData.phone}</span>
                                </a>
                            )}

                            {/* Website */}
                            {placeData.website && (
                                <a href={placeData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl p-2 -ml-2 transition-colors">
                                    <Globe size={18} className="text-purple-500 shrink-0" />
                                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate">公式サイト</span>
                                </a>
                            )}

                            {/* Opening Hours */}
                            {placeData.openingHours && placeData.openingHours.length > 0 && (
                                <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock size={16} className="text-gray-500" />
                                        <span className="text-sm font-bold text-gray-700 dark:text-slate-200">営業時間</span>
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-slate-300 space-y-1">
                                        {placeData.openingHours.map((h, i) => (
                                            <p key={i}>{h}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reviews */}
                            {placeData.reviews && placeData.reviews.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={16} className="text-gray-500" />
                                        <span className="text-sm font-bold text-gray-700 dark:text-slate-200">レビュー</span>
                                    </div>
                                    {placeData.reviews.map((review, i) => (
                                        <div key={i} className="bg-gray-50 dark:bg-slate-700 rounded-xl p-3 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-600 dark:text-slate-300">{review.author}</span>
                                                {review.rating && (
                                                    <div className="flex items-center gap-1">
                                                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                                        <span className="text-xs font-bold text-gray-600 dark:text-slate-300">{review.rating}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {review.text && (
                                                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed line-clamp-3">{review.text}</p>
                                            )}
                                            {review.relativeTime && (
                                                <p className="text-[10px] text-gray-400 dark:text-slate-500">{review.relativeTime}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Travel Tips (fallback content) */}
                            {placeData.travelTips && placeData.travelTips.length > 0 && (
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center">
                                            <Lightbulb size={14} className="text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <p className="font-bold text-amber-700 dark:text-amber-300 text-sm">初心者向けヒント</p>
                                    </div>
                                    <ul className="space-y-2">
                                        {placeData.travelTips.map((tip, index) => (
                                            <li key={index} className="text-sm text-amber-700 dark:text-amber-200 leading-relaxed">{tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Not Found */}
                            {!placeData.found && (
                                <div className="text-center py-6">
                                    <AlertCircle size={32} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 dark:text-slate-400">詳細情報が見つかりませんでした</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer - Google Maps Link */}
                {placeData && placeData.mapsUrl && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700 shrink-0 bg-gray-50 dark:bg-slate-700/50">
                        <a
                            href={placeData.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-colors touch-manipulation"
                        >
                            <ExternalLink size={18} />
                            Googleマップで開く
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaceInfoModal;
