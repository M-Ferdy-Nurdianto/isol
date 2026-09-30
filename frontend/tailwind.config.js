/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kohi Sekai Design Tokens
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        background: 'var(--background)',
        surface: 'var(--surface)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        border: 'var(--border)',
        success: 'var(--success)',
        danger: 'var(--danger)',

        // Semantic aliases & Brand helpers
        'ks-primary': 'var(--primary)',
        'ks-secondary': 'var(--secondary)',
        'ks-accent': 'var(--accent)',
        'ks-surface': 'var(--surface)',
        'ks-text-primary': 'var(--text-primary)',
        'ks-text-secondary': 'var(--text-secondary)',
        'ks-border': 'var(--border)',

        // Backward compatibility mappings transitioning to new palette
        'custom-green': 'var(--primary)',
        'custom-green-light': 'var(--accent)',
        'custom-green-dark': 'var(--primary)',
        'custom-mint': 'var(--secondary)',
        'custom-sage': 'var(--secondary)',
        'custom-cream': 'var(--surface)',
        'custom-ivory': 'var(--surface)',
        'bg-dark': 'var(--background)',
        'dark': 'var(--text-primary)',
        'bg-card': 'var(--surface)',
        'accent-yellow': 'var(--primary)',
        'accent-blue': 'var(--accent)',
        'accent-emerald': 'var(--success)',
        'aca-blue': 'var(--accent)',
      },
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'marker': ['Permanent Marker', 'cursive'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        'gradient-green': 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        'gradient-green-light': 'linear-gradient(135deg, var(--secondary) 0%, var(--surface) 100%)',
        'gradient-green-radial': 'radial-gradient(circle, var(--primary) 0%, var(--secondary) 100%)',
        'gradient-dark': 'linear-gradient(180deg, var(--background) 0%, var(--surface) 100%)',
      },
      animation: {
        'pulse-custom': 'pulse-custom 2s infinite cubic-bezier(0.4, 0, 0.6, 1)',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'bounce-slow': 'bounce 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-custom': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(7, 145, 8, 0.6)' },
          '50%': { boxShadow: '0 0 0 10px rgba(7, 145, 8, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glow: {
          'from': { 'box-shadow': '0 0 5px #38bdf8, 0 0 10px #38bdf8' },
          'to': { 'box-shadow': '0 0 15px #38bdf8, 0 0 25px #0ea5e9' },
        }
      },
    },
  },
  plugins: [],
}
