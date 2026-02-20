/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor :{
        "Red":"#F28B82",
        "Orange":"#FBBC05",
        "Yellow":"#FFF475",
        "Green":"#CCFF90",
        "Teal":"#A7FFEB",
        "Blue":"#CBF0F8",
        "Dark Blue":"#AECBFA",
        "Purple":"#D7AEFB",
        "Pink":"#FDCFE8",
        "Brown":"#E6C9A8",
        "Gray":"#E8EAED",
      }
    },
  },

  plugins: [],
}