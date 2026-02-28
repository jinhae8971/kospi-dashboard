/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0f1a',
          card: '#0f1623',
          border: '#1e2d45',
          hover: '#162030',
        },
        accent: {
          cyan: '#00d4ff',
          green: '#00ff88',
          red: '#ff3366',
          amber: '#ffaa00',
          purple: '#9b59d0',
        },
        chart: {
          up: '#00c087',
          down: '#ff4060',
          ma5: '#FFD700',
          ma20: '#FF69B4',
          ma60: '#00BFFF',
          ma120: '#FF8C00',
          ma240: '#9370DB',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
