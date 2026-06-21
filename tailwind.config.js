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
        primary: '#c8ab7e', // Kashyap's Portfolio Gold
        dark: {
          bg: '#121212',
          surface: '#1e1e1e',
          border: '#2d2d2d',
          text: '#e0e0e0',
          muted: '#9e9e9e'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
