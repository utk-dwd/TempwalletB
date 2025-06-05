/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#242424',
        'dark-text': 'rgba(255, 255, 255, 0.87)',
        'light-bg': '#ffffff',
        'light-text': '#213547',
        'purple': '#646cff',
        'purple-hover': '#535bf2',
        'light-purple': '#747bff',
        'success': '#00ff00',
        'error': '#ff0000',
      },
      borderColor: {
        'purple': '#646cff',
      },
      fontFamily: {
        sans: ['Roboto', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};