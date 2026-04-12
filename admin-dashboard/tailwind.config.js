/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          900: '#1B5E20',
          800: '#2E7D32',
          700: '#388E3C',
          600: '#43A047',
        },
        dark: {
          950: '#080808',
          900: '#0D0D0D',
          800: '#111111',
          700: '#1A1A1A',
          600: '#222222',
          500: '#2A2A2A',
        }
      }
    }
  },
  plugins: []
}
