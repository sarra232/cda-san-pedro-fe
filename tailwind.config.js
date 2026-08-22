/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cda: {
          dark: {
            950: '#0A0A0A',
            900: '#111827',
            800: '#1E293B',
            700: '#334155',
          },
          yellow: {
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
          },
          silver: {
            100: '#F8FAFC',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
