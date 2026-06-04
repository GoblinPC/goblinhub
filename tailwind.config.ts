import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'serif'],
      },
      colors: {
        ember: {
          50: '#fff8f0',
          100: '#feecda',
          200: '#fcd5b0',
          300: '#f9b67a',
          400: '#f5903f',
          500: '#f2701a',
          600: '#e3560f',
          700: '#bc3f0e',
          800: '#963314',
          900: '#7a2d14',
        },
        stone: {
          850: '#1c1917',
          950: '#0c0a09',
        },
      },
      animation: {
        'dice-spin': 'diceSpin 0.08s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        diceSpin: {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.1) rotate(180deg)' },
          '100%': { transform: 'scale(1) rotate(360deg)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px 2px rgba(242, 112, 26, 0.3)' },
          '50%': { boxShadow: '0 0 20px 6px rgba(242, 112, 26, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
