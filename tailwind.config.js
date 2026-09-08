/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'syid-forest': 'var(--syid-forest)',
        'syid-forest-dark': 'var(--syid-forest-dark)',
        'syid-forest-deep': 'var(--syid-forest-deep)',
        'syid-gold-light': 'var(--syid-gold-light)',
        'syid-gold': 'var(--syid-gold)',
        'syid-gold-dark': 'var(--syid-gold-dark)',
        'syid-umber': 'var(--syid-umber)',
        'border-subtle': 'var(--color-border-subtle)',
        'surface-elevated': 'var(--color-surface-elevated)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'var(--radius-lg)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        syid: 'var(--shadow-sm)',
        'syid-md': 'var(--shadow-md)',
        'syid-lg': 'var(--shadow-lg)',
      },
      fontFamily: {
        sans: ['Forest', 'IBM Plex Sans Arabic', 'Segoe UI', 'Tahoma', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        syid: '180ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
