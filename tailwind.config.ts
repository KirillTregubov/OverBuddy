import gradients from 'tailwind-easing-gradients'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      animation: {
        'spin-cog': 'spin-cog 1.5s ease 1'
      },
      keyframes: {
        'spin-cog': {
          from: { transform: 'rotate(30deg)' },
          to: { transform: 'rotate(390deg)' }
        }
      }
    }
  },
  plugins: [
    gradients({
      gradients: {
        'menu-bottom': {
          color: ['rgba(9, 9, 11, 0)', 'rgba(9, 9, 11, 0.5)']
        },
        'menu-top': {
          color: ['transparent', 'rgb(24, 24, 27)']
        },
        settings: {
          color: ['rgba(63, 63, 70, 0)', 'rgba(63, 63, 70, 1)']
        }
      },
      easing: 'ease-in-out'
    })
  ]
}
