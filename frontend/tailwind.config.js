/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Zen Kaku Gothic New"', 'Inter', 'system-ui', 'sans-serif'],
            },
            zIndex: {
                header: '10',
                sticky: '20',
                fixed: '30',
                dropdown: '40',
                modal: '50',
                'modal-content': '51',
                notification: '60',
            },
        },
    },
    plugins: [],
};
