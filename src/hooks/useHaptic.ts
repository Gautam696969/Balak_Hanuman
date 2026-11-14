import { useCallback } from 'react';

export function useHaptic() {
  const triggerHaptic = useCallback((duration: number = 10) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Safe fallback
      }
    }
  }, []);

  const tap = useCallback(() => triggerHaptic(10), [triggerHaptic]);
  const boundary = useCallback(() => triggerHaptic(12), [triggerHaptic]);
  const wicket = useCallback(() => triggerHaptic(15), [triggerHaptic]);
  const undo = useCallback(() => triggerHaptic(10), [triggerHaptic]);

  return { triggerHaptic, tap, boundary, wicket, undo };
}
