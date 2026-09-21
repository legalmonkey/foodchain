/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#E23744",
          orange: "#FC8019",
          yellow: "#FFD600",
          green: "#00C853",
          dark: "#121212",
          paper: "#FDFBF7",
          muted: "#F0ECE1",
        },
      },
      boxShadow: {
        neo: "4px 4px 0px 0px #000000",
        "neo-lg": "6px 6px 0px 0px #000000",
        "neo-sm": "2px 2px 0px 0px #000000",
        "neo-hover": "2px 2px 0px 0px #000000",
      },
      borderWidth: {
        3: "3px",
        4: "4px",
      },
    },
  },
  plugins: [],
};
