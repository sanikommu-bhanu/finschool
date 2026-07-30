/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#FFF6F7',
          100: '#FFEDEF',
          200: '#FDD9DE',
          300: '#FBC1CA',
          400: '#F6A0AF',
          500: '#EE7A90',
          600: '#DD5C76',
          700: '#BE4460',
          800: '#8F3049',
          900: '#5C1E30',
        },
        rose: {
          soft: '#F7C6CE',
          dusty: '#E8A6B4',
        },
        cream: {
          50: '#FFFDFB',
          100: '#FFF9F2',
          200: '#FDF2E6',
          300: '#FBE8D6',
        },
        peach: {
          200: '#FBDCC9',
          300: '#F6C7AA',
          400: '#EFAF8C',
        },
        lavender: {
          200: '#E5DEF5',
          300: '#D3C6EC',
        },
        glass: {
          light: 'rgba(255,255,255,0.55)',
          lighter: 'rgba(255,255,255,0.35)',
          border: 'rgba(255,255,255,0.65)',
          dark: 'rgba(40,25,35,0.45)',
          darkBorder: 'rgba(255,255,255,0.12)',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.5rem',
        xl3: '2rem',
        xl4: '2.5rem',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(200,120,140,0.18), inset 0 1px 1px 0 rgba(255,255,255,0.6)',
        'glass-dark': '0 8px 32px 0 rgba(0,0,0,0.35), inset 0 1px 1px 0 rgba(255,255,255,0.08)',
        glow: '0 0 40px rgba(246,160,175,0.35)',
        'glow-lg': '0 0 60px rgba(246,160,175,0.45)',
        bloom: '0 20px 60px -10px rgba(238,122,144,0.35)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '48px',
      },
      backgroundImage: {
        'gradient-blush': 'linear-gradient(135deg, #FFEDEF 0%, #FBE8D6 50%, #E5DEF5 100%)',
        'gradient-blush-dark': 'linear-gradient(135deg, #3A2430 0%, #2E2230 50%, #241C2E 100%)',
        'gradient-cta': 'linear-gradient(135deg, #F6A0AF 0%, #DD5C76 100%)',
        shimmer: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.7) 50%, transparent 60%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'gradient-move': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'gradient-move': 'gradient-move 12s ease infinite',
        shimmer: 'shimmer 2.5s infinite',
        'scale-in': 'scale-in 0.3s ease-out',
        ripple: 'ripple 0.6s linear',
      },
      backgroundSize: {
        '200': '200% 200%',
      },
    },
  },
  plugins: [],
}
