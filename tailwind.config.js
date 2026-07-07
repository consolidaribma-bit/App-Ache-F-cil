/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ed',
          100: '#daf1d7',
          200: '#b8e4ab',
          300: '#8fd47a',
          400: '#5ac24f',
          500: '#1a8917',
          600: '#148412',
          700: '#0d6b0c',
          800: '#084d08',
          900: '#053105',
        },
        accent: {
          50: '#fff7eb',
          100: '#ffe8ce',
          200: '#ffd699',
          300: '#ffc266',
          400: '#ff9d3d',
          500: '#ff6b35',
          600: '#ff5500',
          700: '#d63700',
          800: '#a82900',
          900: '#841f00',
        },
      },
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
