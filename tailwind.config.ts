import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
          light: '#a5b4fc',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#06b6d4',
          dark: '#0891b2',
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        DEFAULT: '0.75rem',
      },
      screens: {
        'xs': '375px',
      },
    },
  },
  plugins: [],
}

export default config
