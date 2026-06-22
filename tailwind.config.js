/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"IBM Plex Sans"', 'sans-serif'],
      },
      colors: {
        ink: '#060A14',
        surface: '#0B1120',
        brand: { 400: '#38BDF8', 500: '#0EA5E9', 600: '#0369A1' },
        iris: '#8B5CF6',
        cyan: '#22D3EE',
      },
      maxWidth: { content: '1200px' },
      // the markup uses numeric weight utilities (font-500/600/700)
      fontWeight: { 300: '300', 400: '400', 500: '500', 600: '600', 700: '700' },
    },
  },
  plugins: [],
};
