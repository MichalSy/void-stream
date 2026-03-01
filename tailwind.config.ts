import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: {
          dark: '#0a0a0f',
          purple: '#6366f1',
          accent: '#8b5cf6'
        }
      }
    }
  },
  plugins: [],
}

export default config
