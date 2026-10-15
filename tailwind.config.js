/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0b162c', 700: '#0f1c37', 600: '#1B2A56', 500: '#24356b' },
        gold: { DEFAULT: '#f0c345', 600: '#d4af37', 700: '#b8952e' }
      },
      fontFamily: {
        sans: ['Poppins', '"Noto Sans Arabic"', 'sans-serif'],
        kufi: ['"Noto Kufi Arabic"', 'Poppins', 'sans-serif']
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        fadeIn: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'fade-in': 'fadeIn .6s ease both'
      }
    }
  },
  plugins: []
}
