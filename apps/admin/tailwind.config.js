/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'laurx': {
          50: '#fef9f0',
          100: '#fdf2e0',
          200: '#fae3c1',
          300: '#f6d097',
          400: '#f2b95f',
          500: '#E89B2B',
          600: '#d68320',
          700: '#b36a1a',
          800: '#8f551c',
          900: '#74471a',
          950: '#3e230c',
        },
      },
    },
  },
  plugins: [],
}
