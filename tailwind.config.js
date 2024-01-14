/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'spin-cog': 'spin-cog 1.5s ease infinite'
      },
      keyframes: {
        'spin-cog': {
          from: { transform: 'rotate(30deg)' },
          to: { transform: 'rotate(390deg)' }
        }
      }
    }
  },
  plugins: []
}
