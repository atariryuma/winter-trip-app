/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                // Seasonal accent; the palette is switched with [data-season] in index.css
                accent: Object.fromEntries(
                    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
                        .map((shade) => [shade, `rgb(var(--accent-${shade}) / <alpha-value>)`]),
                ),
            },
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
