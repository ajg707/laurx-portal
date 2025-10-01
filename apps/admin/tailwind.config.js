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
          50: '#f8f6ff',
          100: '#f0ebff',
          200: '#e3daff',
          300: '#d0bfff',
          400: '#b899ff',
          500: '#9d6bff',
          600: '#8b47f7',
          700: '#7c3aed',
          800: '#6b21c7',
          900: '#581c87',
        },
      },
    },
  },
  plugins: [],
}
