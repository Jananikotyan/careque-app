/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pista-green': 'var(--pista-green)',
        'soft-green': 'var(--soft-green)',
        'light-green': 'var(--light-green)',
        'dark-green': 'var(--dark-green)',
        text: 'var(--text)',
        white: 'var(--white)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
