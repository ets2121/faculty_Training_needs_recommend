import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#159447',
          'green-dark': '#0f6b35',
          'green-darker': '#0a4d26',
          gold: '#D9A62E',
          'gold-light': '#f0c75e',
          'gold-dark': '#b8891f',
        },
        light: {
          bg: '#FFFFFF',
          card: '#FFFFFF',
          text: '#159447',
          muted: '#5c6e63',
          border: 'rgba(21, 148, 71, 0.2)',
        },
        dark: {
          bg: '#071A10',
          card: '#0D2819',
          text: '#FFFFFF',
          muted: '#a3b8ab',
          border: 'rgba(21, 148, 71, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontWeight: {
        heading: '700',
        subheading: '600',
        body: '400',
        button: '600',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
