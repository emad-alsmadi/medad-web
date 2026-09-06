import type { Variants } from 'framer-motion';

/**
 * Shared framer-motion variants. Reuse these instead of inlining
 * animation objects per component, so motion stays consistent and easy
 * to make `prefers-reduced-motion`-aware in one place later.
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};
