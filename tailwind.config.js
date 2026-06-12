/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1f1e1d',
          soft: '#3d3929',
          muted: '#6e6a5e',
          faint: '#a39f93',
        },
        cream: {
          50: '#fcfbf8',
          100: '#faf9f5',
          200: '#f0eee6',
          300: '#e8e6dc',
          400: '#dcd9cc',
        },
        clay: {
          50: '#fbf1ec',
          100: '#f5e0d5',
          200: '#ecc8b5',
          300: '#e3a98c',
          400: '#dd8b66',
          500: '#d97757',
          600: '#c05f3c',
          700: '#9d4a2f',
          800: '#7a3a26',
          900: '#5c2c1e',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Noto Serif KR', 'serif'],
        sans: ['IBM Plex Sans KR', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 10px 30px rgba(61, 57, 41, 0.07)',
      },
      keyframes: {
        riseIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        riseIn: 'riseIn 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
