/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Minimalist Sage & Cream Palette (from reference image)
        paper: '#F6F7F3',       // warm cream background
        surface: '#FFFFFF',     // card white
        sage: {
          50: '#F4F7F4',
          100: '#E8EFE7',
          200: '#D2DFD1',
          300: '#B4C8B2',
          400: '#8FA98C',
          500: '#697A6D',      // primary sage
          600: '#556659',
          700: '#445147',
          800: '#353E37',
          900: '#232924'       // deep earthy charcoal
        },
        borderLight: '#E5EAE3',
        subtext: '#687369'
      }
    },
  },
  plugins: [],
}
