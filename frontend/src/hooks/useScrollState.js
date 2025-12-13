import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for scroll direction detection
 * Optimized to avoid unnecessary re-renders
 */
export function useScrollState() {
    const [scrollDirection, setScrollDirection] = useState('up');
    const [isScrolled, setIsScrolled] = useState(false);

    // Use refs to avoid dependency issues in the effect
    const scrollDirectionRef = useRef(scrollDirection);
    const lastScrollYRef = useRef(0);

    useEffect(() => {
        // Initialize lastScrollY
        lastScrollYRef.current = window.scrollY;

        const updateScrollDirection = () => {
            const scrollY = window.scrollY;
            const direction = scrollY > lastScrollYRef.current && scrollY > 50 ? 'down' : 'up';

            // Only update state if direction actually changed
            if (direction !== scrollDirectionRef.current) {
                scrollDirectionRef.current = direction;
                setScrollDirection(direction);
            }

            setIsScrolled(scrollY > 10);
            lastScrollYRef.current = scrollY > 0 ? scrollY : 0;
        };

        // Use passive listener for better scroll performance
        window.addEventListener('scroll', updateScrollDirection, { passive: true });

        return () => window.removeEventListener('scroll', updateScrollDirection);
    }, []); // Empty deps - handler uses refs

    return { scrollDirection, isScrolled };
}

/**
 * Custom hook for day tab auto-scroll
 * Scrolls selected day tab into view within container
 */
export function useDayTabScroll(selectedDayId) {
    const dayTabRefs = useRef({});
    const dayTabContainerRef = useRef(null);
    const prevSelectedDayId = useRef(null);

    useEffect(() => {
        if (selectedDayId && selectedDayId !== prevSelectedDayId.current) {
            const tabEl = dayTabRefs.current[selectedDayId];
            const container = dayTabContainerRef.current;

            if (tabEl && container) {
                const tabLeft = tabEl.offsetLeft;
                const tabWidth = tabEl.offsetWidth;
                const containerWidth = container.offsetWidth;
                const scrollTarget = tabLeft - (containerWidth / 2) + (tabWidth / 2);

                container.scrollTo({
                    left: scrollTarget,
                    behavior: 'smooth',
                });
            }
            prevSelectedDayId.current = selectedDayId;
        }
    }, [selectedDayId]);

    // Callback ref setter for day tabs
    const setDayTabRef = useCallback((dayId, el) => {
        dayTabRefs.current[dayId] = el;
    }, []);

    return {
        dayTabContainerRef,
        setDayTabRef,
    };
}

export default useScrollState;
