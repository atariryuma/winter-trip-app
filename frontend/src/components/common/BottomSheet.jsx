import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * iOS-style Bottom Sheet Modal Component
 * Based on Apple Human Interface Guidelines:
 * - Detents: medium (50%) and large (90%) 
 * - Grabber indicator for resize hint
 * - Backdrop blur and dimming
 * - Swipe down to dismiss
 * - Smooth spring-like animations
 */
const BottomSheet = ({
    isOpen,
    onClose,
    title,
    children,
    detent = 'medium', // 'medium' | 'large' | 'full'
    showGrabber = true,
    showCloseButton = true,
    allowBackdropClose = true
}) => {
    const sheetRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const startY = useRef(0);
    const currentY = useRef(0);

    // Detent heights (percentage of viewport)
    const detentHeights = {
        medium: '50vh',
        large: '85vh',
        full: '95vh'
    };

    // Handle touch start
    const handleTouchStart = (e) => {
        startY.current = e.touches[0].clientY;
        currentY.current = startY.current;
        setIsDragging(true);
    };

    // Handle touch move
    const handleTouchMove = (e) => {
        if (!isDragging) return;
        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;
        // Only allow dragging down
        if (diff > 0) {
            setDragOffset(diff);
        }
    };

    // Handle touch end
    const handleTouchEnd = () => {
        setIsDragging(false);
        // If dragged more than 100px, close the sheet
        if (dragOffset > 100) {
            onClose();
        }
        setDragOffset(0);
    };

    // Prevent body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-overlay">
            {/* Backdrop with blur */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                    }`}
                onClick={allowBackdropClose ? onClose : undefined}
            />

            {/* Sheet */}
            <div
                ref={sheetRef}
                className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${isDragging ? '' : 'transition-all'
                    }`}
                style={{
                    maxHeight: detentHeights[detent],
                    height: detentHeights[detent],
                    transform: `translateY(${dragOffset}px)`,
                    paddingBottom: 'env(safe-area-inset-bottom)'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Grabber */}
                {showGrabber && (
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-9 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-800">
                    <div className="w-10">
                        {/* Placeholder for symmetry */}
                    </div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white text-center flex-1">
                        {title}
                    </h2>
                    {showCloseButton ? (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X size={18} className="text-gray-500 dark:text-slate-400" />
                        </button>
                    ) : (
                        <div className="w-10" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BottomSheet;
