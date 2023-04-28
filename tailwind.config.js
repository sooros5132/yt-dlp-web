/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: 'media',
  theme: {
    screens: {
      sm: '510px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        recording: 'linear-gradient(to left, #d70fdd, #ff0075, #ff6b00, #caba00, #12eb40)'
      },
      animation: {
        recording: 'recording 10s linear infinite'
      },
      keyframes: {
        recording: {
          '0%': {
            'background-position': '0% 50%'
          },
          '50%': {
            'background-position': '100% 50%'
          },
          '100%': {
            'background-position': '0% 50%'
          }
        }
      }
    }
  },
  daisyui: {
    darkTheme: 'forest',
    themes: ['emerald', 'forest']
  },
  plugins: [require('daisyui')]
};
