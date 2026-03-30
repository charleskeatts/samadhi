/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#080806',
          card: '#0e0c0a',
          input: '#0a0806',
        },
        gold: {
          DEFAULT: '#e8b84b',
          dim: '#c8982b',
        },
        amber: {
          DEFAULT: '#f07830',
          dim: '#c85820',
        },
        border: {
          DEFAULT: '#2a2620',
          bright: '#4a4030',
        },
        ink: {
          DEFAULT: '#f5f2ee',
          dim: '#c8c0b4',
          muted: '#6a6058',
        },
        emerald: {
          DEFAULT: '#4aaa6a',
        },
        crimson: {
          DEFAULT: '#cc5548',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
        sans: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
