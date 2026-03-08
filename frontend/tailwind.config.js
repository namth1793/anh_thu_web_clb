/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Override indigo → FPT orange #F37021
        indigo: {
          50:  '#fff5ee',
          100: '#ffe6cc',
          200: '#fcc9a0',
          300: '#f9a872',
          400: '#f68c49',
          500: '#F37021',
          600: '#d45c16',
          700: '#b34c12',
          800: '#8c3a0c',
          900: '#6b2d09',
        },
        // Override violet → darker orange (dùng trong gradient btn-primary)
        violet: {
          50:  '#fff3e8',
          100: '#ffe0c0',
          200: '#ffc18a',
          300: '#ffa055',
          400: '#f87f28',
          500: '#e86010',
          600: '#c24e0d',
          700: '#9e3e0a',
          800: '#7a2f07',
          900: '#5c2205',
        },
        primary: {
          50:  '#fff5ee',
          100: '#ffe6cc',
          500: '#F37021',
          600: '#d45c16',
          700: '#b34c12',
        },
        accent: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};