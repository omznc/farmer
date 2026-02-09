/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'animate-shimmer',
    'animate-gradient', 
    'animate-pulse-glow'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Zed IDE inspired color palette - dark mode
        bg: {
          DEFAULT: '#1c1c1c',
          primary: '#1c1c1c',
          secondary: '#252525',
          tertiary: '#2d2d2d',
          hover: '#383838',
        },
        fg: {
          DEFAULT: '#c5c5c5',
          primary: '#c5c5c5',
          secondary: '#8b8b8b',
          muted: '#6b6b6b',
        },
        border: {
          DEFAULT: '#383838',
          hover: '#505050',
        },
        inactive: '#505050',
        accent: {
          DEFAULT: '#a855f7',
          hover: '#9333ea',
        },
        success: '#3d9b74',
        error: '#d95757',
        warning: '#e3b341',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-200%)' },
          '100%': { transform: 'translateX(200%)' }
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(167, 139, 250, 0.4), 0 0 24px rgba(167, 139, 250, 0.2)' },
          '50%': { boxShadow: '0 0 16px rgba(236, 72, 153, 0.5), 0 0 32px rgba(236, 72, 153, 0.25)' }
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        gradient: 'gradient 3s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}
