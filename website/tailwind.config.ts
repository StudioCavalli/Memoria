import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        brown: {
          DEFAULT: '#7D6340',     // darkened from #8B6F47 for AA on cream (5.34:1)
          dark: '#6B5235',
          light: '#8B6F47',       // original brown — use for decorative only
        },
        orange: {
          soft: '#E8A87C',        // decorative/bg only
          text: '#9A6429',        // AA-safe orange for text (4.97:1 on white)
        },
        rose: {
          dusty: '#D4A5A5',
        },
        green: {
          forest: '#4A7A35',      // darkened from #7FB069 for AA (5.09:1)
          light: '#7FB069',       // original green — decorative only
        },
        text: {
          dark: '#3D2C1E',
          muted: '#7A6555',
        },
      },
      fontFamily: {
        heading: ['Merriweather', 'Georgia', 'serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
