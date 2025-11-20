/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F6',
          100: '#FFD3D5',
          200: '#FFD3D5',
          300: '#E49BA6',
          400: '#E49BA6',
          500: '#E49BA6',
          600: '#92487A',
          700: '#92487A',
          800: '#540863',
          900: '#540863',
        },
      },
    },
  },
  plugins: [],
}

