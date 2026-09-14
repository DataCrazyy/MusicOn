/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0A0A0F',
          surface: '#131318',
          raised: '#1A1A22',
          elevated: '#22222C',
        },
        line: '#2A2A38',
        lime: {
          DEFAULT: '#CAFF00',
          dark: '#A8D400',
        },
        violet: {
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
        },
        amber: {
          DEFAULT: '#FFBA08',
        },
        teal: {
          DEFAULT: '#05D8A0',
        },
        coral: {
          DEFAULT: '#FF5F5F',
        },
        ink: {
          primary: '#EFEFFA',
          muted: '#7A7A9A',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        input: '8px',
        pill: '100px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease',
        'slide-up': 'slideUp 0.4s ease',
        'slide-in': 'slideIn 0.4s ease',
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
        'grow-bar': 'growBar 0.8s ease forwards',
        'fill-timeline': 'fillTimeline 1.5s ease forwards',
        'progress-bar': 'progressBar 1s ease forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
        'step-enter': 'stepEnter 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'step-exit-left': 'stepExitLeft 0.3s cubic-bezier(0.4,0,1,1) forwards',
        'step-exit-right': 'stepExitRight 0.3s cubic-bezier(0.4,0,1,1) forwards',
        'toast-spring': 'toastSpring 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'pulse-glow': 'pulseGlow 1.8s ease-in-out infinite',
        'bar-grow': 'barGrow 0.8s cubic-bezier(0.22,1,0.36,1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(202,255,0,0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(202,255,0,0)' },
        },
        growBar: {
          '0%': { height: '0%' },
        },
        fillTimeline: {
          '0%': { height: '0%' },
          '100%': { height: '100%' },
        },
        progressBar: {
          '0%': { width: '0%' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stepEnter: {
          '0%': { opacity: '0', transform: 'translateX(40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        stepExitLeft: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-40px)' },
        },
        stepExitRight: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(40px)' },
        },
        toastSpring: {
          '0%': { opacity: '0', transform: 'translateX(120%) scale(0.8)' },
          '60%': { opacity: '1', transform: 'translateX(-12%) scale(1.03)' },
          '80%': { transform: 'translateX(4%) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px 0 rgba(202,255,0,0.3)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(202,255,0,0.5)' },
        },
        barGrow: {
          '0%': { height: '0%' },
          '100%': { height: 'var(--bar-height, 100%)' },
        },
      },
    },
  },
  plugins: [],
};
