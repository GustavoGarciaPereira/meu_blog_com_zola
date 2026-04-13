/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./static/js/**/*.js",   // garante que classes usadas em search.js não sejam purgadas
  ],
  safelist: [
    // Classes geradas dinamicamente no search.js (strings concatenadas não detectadas pelo scanner)
    'hover:bg-steel-blue',
    'border-rust-copper/20',
    'last:border-0',
    'text-aqua-neon/60',
    'text-clay-tan/40',
    'text-clay-tan/25',
  ],
  theme: {
    extend: {
      colors: {
        'deep-shadow': '#20140D',
        'clay-tan':    '#E7C693',
        'aqua-neon':   '#00B5B5',
        'rust-copper': '#B57B50',
        'steel-blue':  '#1F3B4A',
      },
      fontFamily: {
        heading: ['Oswald', 'Barlow Condensed', 'sans-serif'],
        body:    ['Montserrat', 'sans-serif'],
        code:    ['"Fira Code"', 'ui-monospace', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
