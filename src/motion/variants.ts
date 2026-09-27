import type { Variants } from 'framer-motion';

/**
 * Shared framer-motion variants. Reuse these instead of inlining
 * animation objects per component, so motion stays consistent. Wrap a
 * page in <MotionConfig reducedMotion="user"> to honour
 * `prefers-reduced-motion` for everything below it.
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

/** A soft deceleration for things settling into place. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Parent that reveals its `riseIn` children one after another. */
export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** A block rising gently into place — dashboard cards and sections. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};
