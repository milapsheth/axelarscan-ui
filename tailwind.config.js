const withMT = require('@material-tailwind/react/utils/withMT')
const colors = require('tailwindcss/colors')

module.exports = withMT({
  content: [
    './components/**/*.js',
    './pages/**/*.js',
    './styles/globals.css',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...colors,
        dark: '#000000',
        light: '#ffffff',
        black: '#0f0f0f',
        white: '#f0f0f0',
        slate: {
          ...colors.slate,
          900: '#1f1f1f',
          800: '#2f2f2f',
          700: '#3f3f3f',
          600: '#4f4f4f',
          500: '#5f5f5f',
          400: '#b0b0b0',
          300: '#c0c0c0',
          200: '#d0d0d0',
          100: '#e0e0e0',
          50: '#e9e9e9',
        },
      },
      screens: {
        '3xl': '3000px',
      },
    },
  },
})