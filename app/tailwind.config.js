/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        brown: {
          DEFAULT: '#7D6340',
          dark: '#6B5235',
          light: '#8B6F47',
        },
        orange: {
          soft: '#E8A87C',
          text: '#9A6429',
        },
        rose: {
          dusty: '#D4A5A5',
        },
        green: {
          forest: '#4A7A35',
          light: '#7FB069',
        },
        text: {
          dark: '#3D2C1E',
          muted: '#7A6555',
        },
      },
      fontFamily: {
        heading: ['serif'],
        body: ['System'],
      },
    },
  },
  plugins: [],
}
