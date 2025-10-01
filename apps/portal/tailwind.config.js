/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        laurx: {
          50: '#faf7fb',
          100: '#f4eef6',
          200: '#e9ddec',
          300: '#d8c1dd',
          400: '#c19bc8',
          500: '#a67ba8',
          600: '#8b5a96',
          700: '#734a7c',
          800: '#5f3e66',
          900: '#513556',
          950: '#321c35',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
