/** @type {import('tailwindcss').Config} */
module.exports = {
  // The 'content' array tells Tailwind which files to scan for class names.
  // It's crucial to include all files where you'll be using Tailwind classes.
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // 'darkMode: "class"' enables manual dark mode toggling.
  // You will create a button in your app that adds or removes the 'dark' class
  // from the `<html>` element to switch themes.
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
}