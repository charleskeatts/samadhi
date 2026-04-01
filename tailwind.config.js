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
          DEFAULT: '#f5f0e8',
          card: '#ffffff',
          input: '#ffffff',
        },
        teal: {
          DEFAULT: '#00b8a0',
          dk: '#008f7c',
          pale: '#e0f5f2',
        },
        gold: {
          DEFAULT: '#00b8a0',
          dim: '#008f7c',
        },
        amber: {
          DEFAULT: '#e8a020',
          dim: '#c8820a',
        },
        border: {
          DEFAULT: '#d8d0c4',
          bright: '#b8af9f',
        },
        ink: {
          DEFAULT: '#1a1612',
          dim: '#3d3530',
          muted: '#7a6f65',
        },
        emerald: {
          DEFAULT: '#00897b',
        },
        crimson: {
          DEFAULT: '#c94040',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
