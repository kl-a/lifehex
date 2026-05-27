/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'night-sky':     '#1a1a2e',
        'deep-indigo':   '#16213e',
        'soft-lilac':    '#c9b8f0',
        'lilac-shadow':  '#a096c8',
        'blush-pink':    '#f7cac9',
        'blush-shadow':  '#c98a88',
        'mint-green':    '#b5ead7',
        'mint-shadow':   '#6aab90',
        'butter':        '#ffeaa7',
        'butter-shadow': '#c9a84c',
        'peach':         '#ffb7b2',
        'cloud-white':   '#fdfcff',
        'muted-purple':  '#c0b2e0',
        'star-gold':     '#ffe066',
        'pixel-black':   '#2d2b3d',
      },
      fontFamily: {
        pixel: ['Nunito', 'sans-serif'],
        body:  ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        lilac:  '0 4px 20px rgba(122,111,160,0.3)',
        mint:   '0 4px 20px rgba(106,171,144,0.3)',
        blush:  '0 4px 20px rgba(201,138,136,0.3)',
        butter: '0 4px 20px rgba(201,168,76,0.3)',
        nav:    '0 -1px 0 rgba(155,137,196,0.3)',
        card:   '0 4px 20px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};

