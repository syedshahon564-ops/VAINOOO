/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#dc2626',
          dark: '#b91c1c',
          light: '#ef4444',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#0f172a',
          foreground: '#ffffff',
        },
        dark: {
          bg: '#07070a',
          card: 'rgba(18, 18, 28, 0.85)',
          hover: 'rgba(26, 26, 40, 0.95)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
        light: {
          bg: '#f8fafc',
          card: '#ffffff',
          hover: '#f1f5f9',
          border: '#e2e8f0',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f1c40f',
          glow: 'rgba(212, 175, 55, 0.25)',
          border: 'rgba(212, 175, 55, 0.3)',
        },
        neon: {
          cyan: '#00ffd5',
          blue: '#00aaff',
          glow: 'rgba(0, 255, 213, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Baloo Da 2', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px rgba(212, 175, 55, 0.35)',
        cyanGlow: '0 0 20px rgba(0, 255, 213, 0.4)',
        redGlow: '0 0 20px rgba(220, 38, 38, 0.4)',
      },
    },
  },
  plugins: [],
};
