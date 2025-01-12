/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        secondary: "#4f46e5",
        dark: {
          100: "#1f2937",
          200: "#111827",
          300: "#0f172a",
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}

