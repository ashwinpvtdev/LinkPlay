/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0d0d14',
          1: '#13131f',
          2: '#1a1a2e',
          3: '#20203a',
        },
        accent: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
          glow: '#7c3aed33',
        },
        cyan: {
          glow: '#06b6d433',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-purple': '0 0 40px 0 rgba(124, 58, 237, 0.25)',
        'glow-cyan': '0 0 40px 0 rgba(6, 182, 212, 0.15)',
        'glow-sm': '0 0 15px 0 rgba(124, 58, 237, 0.3)',
      }
    },
  },
  plugins: [],
}
