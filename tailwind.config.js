/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        panel: '0 10px 30px rgba(15, 23, 42, 0.08)',
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
