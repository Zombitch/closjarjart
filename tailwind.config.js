/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/views/**/*.ejs",   // tes vues EJS
      "./src/public/**/*.js"    // si tu as du JS côté client
    ],
    theme: {
      extend: {
        colors: { brand: { 50:'#f5f7ff', 100:'#e9edff', 200:'#cdd6ff', 300:'#aab9ff', 400:'#7a90ff', 500:'#526bff', 600:'#3b50e6', 700:'#2f3fc0', 800:'#243395', 900:'#1d2a75'}},
        boxShadow: { soft: '0 10px 25px -10px rgba(0,0,0,0.2)' }
      },
    },
    plugins: [],
  }
  