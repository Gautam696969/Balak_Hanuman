/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#fffcf7', // Warm ivory cream background matching the Balak Hanuman logo
        },
        cricket: {
          50: '#fff7ed',  // Warm orange-50
          100: '#ffedd5', // Warm orange-100
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f59e0b',  // Gold / warm yellow (helmet)
          600: '#ea580c',  // Saffron orange
          700: '#e57008',  // Logo shield primary orange
          800: '#c2410c',  // Deep warm orange
          900: '#9a3412',
          950: '#431407',
        },
        emerald: {
          50: '#fff7ed',   // Warm soft orange cream
          100: '#ffedd5',  // Warm amber accent
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',  // Bright orange
          500: '#f97316',  // Vibrant saffron
          600: '#ea580c',  // Logo orange
          700: '#e57008',  // Primary logo shield orange
          800: '#c2410c',  // Active button hover
          900: '#9a3412',  // Active button press
          950: '#431407',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
