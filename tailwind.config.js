/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic colors are driven by CSS variables (see index.css). RGB-channel
        // variables let Tailwind opacity modifiers (e.g. border-gold/50) work, while
        // matching solid hex vars (--gold, --surface, …) are used for inline styles.
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        surface2: 'rgb(var(--surface-2-rgb) / <alpha-value>)',
        line: 'rgb(var(--border-rgb) / <alpha-value>)',
        content: 'rgb(var(--text-rgb) / <alpha-value>)',
        muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        gold: {
          DEFAULT: 'rgb(var(--gold-rgb) / <alpha-value>)',
          soft: 'rgb(var(--gold-soft-rgb) / <alpha-value>)',
        },
        good: 'rgb(var(--good-rgb) / <alpha-value>)',
        bad: 'rgb(var(--bad-rgb) / <alpha-value>)',
        rose: 'rgb(var(--rose-rgb) / <alpha-value>)',
        'cm-red': {
          DEFAULT: 'rgb(var(--cm-red-rgb) / <alpha-value>)',
          soft: 'rgb(var(--cm-red-soft-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'ui-serif', 'serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(0,0,0,0.18)',
        card: '0 8px 30px -12px rgba(0,0,0,0.35)',
        glow: '0 0 0 1px var(--gold), 0 8px 30px -8px rgba(224,185,92,0.35)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(224,185,92,0)' },
          '50%': { boxShadow: '0 0 0 8px rgba(224,185,92,0.18)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(120px) rotate(360deg)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        pop: 'pop 0.35s ease-out',
        'slide-up': 'slide-up 0.45s ease-out',
        'toast-in': 'toast-in 0.3s ease-out',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        confetti: 'confetti 1s ease-in forwards',
      },
    },
  },
  plugins: [],
}
