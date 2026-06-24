/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta do design Alvorada
        brand: {
          DEFAULT: "#0FB99A",
          dark: "#0A9E84",
          mint: "#16E0BD",
        },
        ink: "#122019",
        panel: "#0A1613",
        panel2: "#06100D",
        cloud: "#F4F7F6",
      },
      fontFamily: {
        sora: ["Sora", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
