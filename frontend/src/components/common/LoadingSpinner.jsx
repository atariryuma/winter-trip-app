import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
);

export default LoadingSpinner;
