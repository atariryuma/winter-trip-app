import { useEffect, useState } from 'react';
import { Check, Copy, MapPin, Navigation, Pencil, Search, Trash2, Wallet } from 'lucide-react';
import Sheet from '../../ui/Sheet';
import { CategoryIcon, NeedsBookingPill, StatusPill } from '../../ui/atoms';
import api from '../../lib/api';
import {
    categoryMeta, eventTitle, formatDateJa, formatMinutes, formatYen, gapMinutes, isBookable, isFlight,
    isTransport, mapsDirectionsUrl, mapsSearchUrl, needsBooking, startPlace,
} from '../../lib/trip';

/** selection: { event, day, routeFrom } */
export default function EventDetailSheet({ selection, onClose, onEdit, onDelete }) {
    const event = selection?.event;
    return (
        <Sheet open={!!event} onClose={onClose} title={event ? eventTitle(event) : ''}>
            {event && <Detail key={event.id} {...selection} onClose={onClose} onEdit={onEdit} onDelete={onDelete} />}
        </Sheet>
    );
}

function Detail({ event, day, routeFrom, onClose, onEdit, onDelete }) {
    const meta = categoryMeta(event.category);
    const place = startPlace(event);
    const [placeInfo, setPlaceInfo] = useState(null);
    const [mapImage, setMapImage] = useState(null);
    const [mapState, setMapState] = useState(place ? 'loading' : 'none');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!place) return undefined;
        let cancelled = false;
        (async () => {
            const info = await api.getPlaceInfo(place);
            if (cancelled) return;
            setPlaceInfo(info);
            const image = await api.getStaticMap(info?.formattedAddress || place);
            if (cancelled) return;
            setMapImage(image);
            setMapState(image ? 'ready' : 'none');
        })();
        return () => {
            cancelled = true;
        };
    }, [place]);

    const duration = event.endTime ? gapMinutes({ time: event.time }, { time: event.endTime }) : null;
    const directions = !isFlight(event) && routeFrom && place && routeFrom !== place
        ? mapsDirectionsUrl([routeFrom, place])
        : null;
    const mapUrl = placeInfo?.mapsUrl || (place ? mapsSearchUrl(place) : null);

    const copyRef = async () => {
        try {
            await navigator.clipboard.writeText(event.bookingRef);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard unavailable */
        }
    };

    const searchBooking = () => {
        const q = [event.name, event.from, event.to, isBookable(event) ? '予約' : ''].filter(Boolean).join(' ');
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener');
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <CategoryIcon category={event.category} size={14} className="w-7 h-7" />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{meta.label}</span>
                <StatusPill status={event.status} />
                {needsBooking(event) && <NeedsBookingPill event={event} />}
            </div>

            <div className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">{formatDateJa(day.fullDate)}</span>
                {event.time && (
                    <span className="ml-2 tabular-nums">
                        {event.time}{event.endTime ? ` – ${event.endTime}` : ''}
                        {duration > 0 && <span className="text-slate-400">（{formatMinutes(duration)}）</span>}
                    </span>
                )}
            </div>

            {isTransport(event) && (event.from || event.to) && (
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 flex gap-3">
                    <div className="flex flex-col items-center pt-1.5">
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400" />
                        <span className="w-px flex-1 bg-slate-300 dark:bg-slate-600 my-1" />
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.toneClasses.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-300 break-words">
                            {event.from || '未設定'} {event.time && <span className="tabular-nums text-slate-400 ml-1">{event.time}</span>}
                        </p>
                        <p className="font-bold text-slate-900 dark:text-white break-words">
                            {event.to || '未設定'} {event.endTime && <span className="tabular-nums text-slate-400 font-normal ml-1">{event.endTime}</span>}
                        </p>
                    </div>
                </div>
            )}

            {mapState === 'loading' && (
                <div className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400">
                    <MapPin size={20} />
                </div>
            )}
            {mapState === 'ready' && mapImage && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
                    <img src={mapImage} alt={`${place} の地図`} className="w-full h-36 object-cover" />
                </a>
            )}
            {placeInfo?.formattedAddress && (
                <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 break-words">
                    <MapPin size={12} className="mt-0.5 shrink-0" /> {placeInfo.formattedAddress}
                </p>
            )}

            {event.bookingRef && (
                <button
                    onClick={copyRef}
                    className="w-full flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-left"
                >
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-emerald-700/80 dark:text-emerald-300/80">予約番号（タップでコピー）</p>
                        <p className="font-mono font-bold text-lg text-emerald-800 dark:text-emerald-200 break-all">{event.bookingRef}</p>
                    </div>
                    {copied ? <Check className="text-emerald-600 shrink-0" size={20} /> : <Copy className="text-emerald-600/70 shrink-0" size={18} />}
                </button>
            )}

            {event.details && (
                <p className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words">
                    {event.details}
                </p>
            )}

            {Number(event.budgetAmount) > 0 && (
                <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Wallet size={16} className="text-slate-400" />
                    <span className="font-bold tabular-nums">{formatYen(Number(event.budgetAmount))}</span>
                    {event.budgetPaidBy && <span className="text-slate-400">· {event.budgetPaidBy} が支払い</span>}
                </p>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
                {directions && (
                    <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                        <Navigation size={16} /> ルート案内
                    </a>
                )}
                {mapUrl && (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                        <MapPin size={16} /> 地図で見る
                    </a>
                )}
                {needsBooking(event) && (
                    <button onClick={searchBooking} className="btn-secondary text-amber-700 dark:text-amber-300">
                        <Search size={16} /> 予約を探す
                    </button>
                )}
                <button onClick={() => { onClose(); onEdit(event, day); }} className="btn-secondary">
                    <Pencil size={16} /> 編集
                </button>
                <button onClick={() => { onClose(); onDelete(event); }} className="btn-secondary text-rose-600 dark:text-rose-400">
                    <Trash2 size={16} /> 削除
                </button>
            </div>
        </div>
    );
}
