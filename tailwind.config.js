module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Add any theme extensions here, but NOT plugins
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}

