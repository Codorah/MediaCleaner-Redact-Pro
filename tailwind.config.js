/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Poppins', 'sans-serif']
            },
            colors: {
                primary: '#FF3B5C',
                accent: '#00F5A0',
                dark: '#0A0A0A',
                card: '#111111',
            }
        },
    },
    plugins: [],
}
