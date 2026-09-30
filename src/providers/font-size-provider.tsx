import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { FontSizeContext, type FontSize } from '@/contexts/font-size-context';

const FONT_SIZE_STORAGE_KEY = 'medad-font-size';
const FONT_SIZES: readonly FontSize[] = ['sm', 'md', 'lg', 'xl'];

function readStoredFontSize(): FontSize {
  try {
    const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    return FONT_SIZES.find((size) => size === stored) ?? 'md';
  } catch {
    return 'md';
  }
}

/**
 * The app-wide text size chosen on the profile page. Sizes are in rem, so the
 * `font-size-*` class on <html> (styles/globals.css) scales text, spacing and
 * controls together. A layout effect applies it before the first paint.
 */
export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>(readStoredFontSize);

  useLayoutEffect(() => {
    const root = document.documentElement;
    FONT_SIZES.forEach((size) => root.classList.toggle(`font-size-${size}`, size === fontSize));
    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
    } catch {
      // Storage blocked: the choice still holds until the page is reloaded.
    }
  }, [fontSize]);

  const value = useMemo(() => ({ fontSize, setFontSize }), [fontSize]);

  return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>;
}
