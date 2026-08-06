/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0c10",
        surface: "#1f2833",
        primary: "#66fcf1",
        secondary: "#45f2c5",
        textMain: "#c5c6c7",
        textDim: "#8f9091",
        statusCritical: "#d90429",
        statusWarning: "#f77f00",
        statusStable: "#2a9d8f",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
