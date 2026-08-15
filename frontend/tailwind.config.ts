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
          'green-dark': '#08752F',
          'green-darker': '#0a4d26',
          gold: '#D9A62E',
          'gold-light': '#F8EBC4',
          'gold-dark': '#b8891f',
        },
        light: {
          bg: '#FFFFFF',
          card: '#FFFFFF',
          text: '#17321F',
          secondary: '#557061',
          muted: '#718579',
          border: '#B9DFC7',
          'muted-surface': '#F3F9F5',
        },
        dark: {
          bg: '#081A10',
          card: '#0F281A',
          'card-elevated': '#12351F',
          text: '#FFFFFF',
          secondary: '#A9BCAF',
          muted: '#7F9989',
          border: '#1B5737',
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
