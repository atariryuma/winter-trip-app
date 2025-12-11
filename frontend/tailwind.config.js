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
                // レイヤー1: ベース要素 (0-10)
                'base': '0',           // 通常コンテンツ
                'content': '1',        // 相対位置付け
                'header': '10',        // ページヘッダー

                // レイヤー2: 固定要素 (20-39)
                'sticky': '20',        // スティッキーヘッダー
                'sticky-content': '21',// スティッキーヘッダー内要素
                'fixed': '30',         // 固定ナビゲーション

                // レイヤー3: オーバーレイ (40-59)
                'dropdown': '40',      // ドロップダウンメニュー
                'modal': '50',         // モーダルコンテナ
                'modal-content': '51', // モーダル内要素（オートコンプリート等）

                // レイヤー4: 通知・システムUI (60-89)
                'notification': '60',  // トースト通知
                'tooltip': '70',       // ツールチップ

                // レイヤー5: 最優先 (90-100)
                'overlay': '90',       // 全画面オーバーレイ
                'max': '100',          // 最前面要素
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
