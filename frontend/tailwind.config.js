/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 品牌色
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // 暖米色主题
        warm: {
          50:  '#fef9f3',
          100: '#fbefe3',
          200: '#f5dcc7',
          300: '#ecc6a3',
          400: '#e0a97a',
          500: '#d4905a',
          600: '#c0723b',
          700: '#a05a2e',
          800: '#834929',
          900: '#6b3d24',
        },
      },
      // 自定义字体
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
    },
  },
  plugins: [],
}
