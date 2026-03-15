// tailwind.config.js
// NOTE: This project uses Tailwind CSS v4.
// All theme configuration (fonts, colours, animations) lives in app/globals.css
// using @theme / @theme inline blocks — this file is kept only for IDE tooling
// that still expects a v3-style config.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};
