import { createContext, useContext } from 'react';

export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

export interface FontSizeContextValue {
  fontSize: FontSize;
  setFontSize: (fontSize: FontSize) => void;
}

export const FontSizeContext = createContext<FontSizeContextValue | undefined>(undefined);

export function useFontSize(): FontSizeContextValue {
  const ctx = useContext(FontSizeContext);
  if (!ctx) {
    throw new Error('useFontSize must be used within FontSizeProvider');
  }
  return ctx;
}
