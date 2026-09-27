import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { EASE_OUT } from '@/motion/variants';

/**
 * Tweens from the previous value to `target` (from 0 on mount), for
 * numbers that count up. Jumps straight to the value when the user
 * prefers reduced motion.
 */
export function useAnimatedNumber(target: number, duration = 0.9): number {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? target : 0);
  const from = useRef(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      from.current = target;
      setDisplay(target);
      return;
    }
    const controls = animate(from.current, target, {
      duration,
      ease: EASE_OUT,
      onUpdate: (latest) => {
        from.current = latest;
        setDisplay(latest);
      },
    });
    return () => controls.stop();
  }, [target, duration, reduceMotion]);

  return display;
}

/**
 * Animates a 0 → 1 progress value whenever `key` changes (and on mount),
 * for drawing-in effects such as a donut sweep.
 */
export function useDrawProgress(key: unknown, duration = 0.9): number {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      setProgress(1);
      return;
    }
    const controls = animate(0, 1, { duration, ease: EASE_OUT, onUpdate: setProgress });
    return () => controls.stop();
  }, [key, duration, reduceMotion]);

  return progress;
}
