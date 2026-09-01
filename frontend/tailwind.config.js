/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e5ff',
          200: '#b3ccff',
          300: '#82abff',
          400: '#4d7fff',
          500: '#2456f0',
          600: '#1a3fc4',
          700: '#17339c',
          800: '#172d7d',
          900: '#182968',
        },
      },
    },
  },
  plugins: [],
};
