/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        surface: "#ffffff",
        primary: "#2563eb",
        secondary: "#0d9488",
        textMain: "#0f172a",
        textDim: "#64748b",
        statusCritical: "#ef4444",
        statusWarning: "#f97316",
        statusStable: "#10b981",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
