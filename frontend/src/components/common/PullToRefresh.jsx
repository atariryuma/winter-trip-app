import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * iOS-style Pull-to-Refresh Component
 * 
 * Best practices applied:
 * - Touch gesture detection with touchstart/touchmove/touchend
 * - Elastic pull effect with diminishing returns
 * - iOS-style spinner animation
 * - Preserves previous data during refresh
 */

const THRESHOLD = 70; // Pull distance to trigger refresh
const RESISTANCE = 2.5; // Resistance factor for elastic effect

export default function PullToRefresh({
    onRefresh,
    disabled = false,
    children
}) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);

    const containerRef = useRef(null);
    const startY = useRef(0);
    const currentY = useRef(0);

    const handleTouchStart = useCallback((e) => {
        if (disabled || isRefreshing) return;

        // Only allow pull when scrolled to top
        const scrollTop = containerRef.current?.scrollTop || window.scrollY;
        if (scrollTop > 5) return;

        startY.current = e.touches[0].clientY;
        setIsPulling(true);
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e) => {
        if (!isPulling || disabled || isRefreshing) return;

        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        if (diff > 0) {
            // Apply resistance for elastic feel (iOS style)
            const elasticDistance = diff / RESISTANCE;
            setPullDistance(Math.min(elasticDistance, 120));

            // Prevent default scroll when pulling
            if (window.scrollY === 0) {
                e.preventDefault();
            }
        }
    }, [isPulling, disabled, isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling) return;

        setIsPulling(false);

        if (pullDistance >= THRESHOLD / RESISTANCE && onRefresh) {
            // Trigger refresh
            setIsRefreshing(true);
            setPullDistance(THRESHOLD / RESISTANCE); // Keep spinner visible

            try {
                await onRefresh();
            } catch (err) {
                console.error('Refresh error:', err);
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            // Spring back
            setPullDistance(0);
        }
    }, [isPulling, pullDistance, onRefresh]);

    const progress = Math.min(pullDistance / (THRESHOLD / RESISTANCE), 1);
    const shouldTrigger = progress >= 1;

    return (
        <div
            ref={containerRef}
            className="relative min-h-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: pullDistance > 0 ? 'none' : 'auto' }}
        >
            {/* Pull indicator - iOS style */}
            <div
                className="absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
                style={{
                    top: 0,
                    height: `${Math.max(pullDistance, 0)}px`,
                    opacity: pullDistance > 10 ? 1 : 0,
                    zIndex: 50
                }}
            >
                <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 transition-all duration-200 ${shouldTrigger ? 'scale-110' : 'scale-100'
                        }`}
                >
                    <RefreshCw
                        size={20}
                        className={`text-indigo-600 dark:text-indigo-400 transition-transform duration-300 ${isRefreshing
                            ? 'animate-spin'
                            : shouldTrigger
                                ? 'rotate-180'
                                : ''
                            }`}
                        style={{
                            transform: isRefreshing
                                ? undefined
                                : `rotate(${progress * 180}deg)`
                        }}
                    />
                </div>
            </div>

            {/* Content with pull offset */}
            <div
                className="transition-transform duration-200 ease-out"
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transitionDuration: isPulling ? '0ms' : '300ms'
                }}
            >
                {children}
            </div>
        </div>
    );
}
