/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Zen Kaku Gothic New"', 'Inter', 'sans-serif'],
                display: ['Poppins', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    500: '#0ea5e9', // Sky blue equivalent
                    600: '#0284c7',
                    900: '#0c4a6e',
                },
                // Material Design インディゴパレット
                indigo: {
                    50: '#E8EAF6',
                    100: '#C5CAE9',
                    200: '#9FA8DA',
                    300: '#7986CB',
                    400: '#5C6BC0',
                    500: '#3F51B5',
                    600: '#3949AB',  // プライマリー
                    700: '#303F9F',
                    800: '#283593',
                    900: '#1A237E',
                },
                primary: {
                    DEFAULT: '#3949AB',
                    light: '#C5CAE9',
                    dark: '#303F9F',
                },
            },
            spacing: {
                '18': '4.5rem',   // 72px
                '22': '5.5rem',   // 88px
            },
            zIndex: {
                'dropdown': '10',
                'sticky': '20',
                'fixed': '30',
                'modal-backdrop': '40',
                'modal': '50',
                'notification': '80',
                'max': '100',
            },
            minHeight: {
                'touch': '44px',  // iOS最小タッチターゲット
            },
            minWidth: {
                'touch': '44px',
            },
        },
    },
    plugins: [],
}
