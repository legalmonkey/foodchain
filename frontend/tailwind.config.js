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
          redHover: "#CB202D",
          redLight: "#FFF1F2",
          redBorder: "#FECDD3",
          dark: "#1C1C1C",
          black: "#0F0F0F",
          gray: "#F4F4F5",
          grayLight: "#F8F8F8",
          grayBorder: "#E4E4E7",
          grayMuted: "#71717A",
          white: "#FFFFFF",
          paper: "#FFFFFF",
          yellow: "#FFD600",
          green: "#00C853",
          greenLight: "#F0FDF4",
        },
      },
      boxShadow: {
        neo: "3px 3px 0px 0px #1C1C1C",
        "neo-lg": "5px 5px 0px 0px #1C1C1C",
        "neo-sm": "2px 2px 0px 0px #1C1C1C",
        "neo-red": "4px 4px 0px 0px #E23744",
        "zomato": "0 2px 8px rgba(28, 28, 28, 0.08)",
        "zomato-card": "0 4px 16px rgba(0, 0, 0, 0.08)",
      },
      borderWidth: {
        1.5: "1.5px",
        2: "2px",
        3: "3px",
        4: "4px",
      },
    },
  },
  plugins: [],
};
