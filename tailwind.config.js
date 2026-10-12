/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0d807d',
          tealDark: '#085d5b',
          tealLight: '#169b97',
          mint: '#e6f5f4',
          slate: '#2c3e50',
          red: '#d9534f',
          green: '#27ae60'
        }
      }
    },
  },
  plugins: [],
}
