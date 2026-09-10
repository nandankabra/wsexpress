import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        border: colors.zinc[200],
        input: colors.zinc[200],
        ring: colors.indigo[500],
        background: colors.white,
        foreground: colors.zinc[950],
        primary: {
          DEFAULT: colors.indigo[600],
          foreground: colors.white,
          hover: colors.indigo[700],
        },
        secondary: {
          DEFAULT: colors.zinc[100],
          foreground: colors.zinc[900],
          hover: colors.zinc[200],
        },
        destructive: {
          DEFAULT: colors.red[500],
          foreground: colors.white,
          hover: colors.red[600],
        },
        muted: {
          DEFAULT: colors.zinc[100],
          foreground: colors.zinc[500],
        },
        accent: {
          DEFAULT: colors.zinc[100],
          foreground: colors.zinc[900],
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};
