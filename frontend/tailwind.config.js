/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      animation: {
        shine: 'shine 2s infinite', // Tambahkan ini
      },
      keyframes: {
        shine: { // Tambahkan blok ini
          '100%': { left: '125%' },
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
