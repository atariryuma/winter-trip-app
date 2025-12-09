import React from 'react';
import {
    Plane, Train, Bus, MapPin, BedDouble, Calendar,
    Sun, Cloud, Snowflake, Camera, ArrowRight, Utensils,
    CheckCircle2, Circle, AlertCircle, Ticket, Mountain,
    Waves, Coffee, ShoppingBag, Car, Music, Anchor
} from 'lucide-react';

export const getIcon = (category, type, props = {}) => {
    const iconProps = { size: 16, ...props };
    if (category === 'flight') return <Plane {...iconProps} />;
    if (category === 'train') return <Train {...iconProps} />;
    if (category === 'bus') return <Bus {...iconProps} />;
    if (category === 'hotel') return <BedDouble {...iconProps} />;
    if (category === 'meal') return <Utensils {...iconProps} />;
    if (category === 'sightseeing') return <Camera {...iconProps} />;
    if (category === 'activity') return <Mountain {...iconProps} />;
    if (category === 'shopping') return <ShoppingBag {...iconProps} />;
    if (category === 'car' || category === 'transfer') return <Car {...iconProps} />;

    // Type fallbacks
    if (type === 'flight') return <Plane {...iconProps} />;
    if (type === 'train') return <Train {...iconProps} />;

    return <MapPin {...iconProps} />;
};

export const getWeatherIcon = (condition, props = {}) => {
    const iconProps = { size: 16, className: "text-gray-500", ...props };
    switch (condition) {
        case 'Sunny': return <Sun {...iconProps} className="text-orange-500" />;
        case 'Cloudy': return <Cloud {...iconProps} className="text-gray-400" />;
        case 'Rain': return <Cloud {...iconProps} className="text-blue-400" />;
        case 'Snow': return <Snowflake {...iconProps} className="text-blue-300" />;
        case 'Clear': return <Sun {...iconProps} className="text-yellow-500" />;
        default: return <Sun {...iconProps} className="text-gray-400" />;
    }
};
