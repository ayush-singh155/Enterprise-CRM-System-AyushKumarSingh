/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17233d',
        brand: { DEFAULT: '#3563e9', dark: '#234bc5', pale: '#edf2ff' }
      },
      boxShadow: {
        card: '0 10px 35px rgba(27, 45, 80, 0.06)'
      }
    }
  },
  plugins: []
};
