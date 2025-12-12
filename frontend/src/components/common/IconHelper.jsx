import React from 'react';
import {
    Plane, Train, Bus, MapPin, BedDouble,
    Camera, Utensils, Mountain, ShoppingBag, Car
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
