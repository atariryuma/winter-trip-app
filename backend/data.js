var TRIP_DATA = {
    "tripInfo": {
        "title": "冬の飛騨高山・下呂温泉・名古屋 4泊5日",
        "period": "2024/12/28 - 2025/1/1",
        "travelers": "家族旅行"
    },
    "schedules": [
        {
            "date": "2024-12-28",
            "day": "日",
            "location": "高山 (連泊)",
            "events": [
                { "time": "10:05", "type": "transport", "title": "那覇空港 発", "detail": "SKY 552 (フォワードシート) [12:00 中部着]" },
                { "time": "13:17", "type": "transport", "title": "中部国際空港 発", "detail": "名鉄ミュースカイ (1号車 1A-1D) [13:54 名古屋着]" },
                { "time": "14:48", "type": "transport", "title": "JR名古屋駅 発", "detail": "特急ひだ 13号 [17:23 高山着]" },
                { "time": "18:30", "type": "meal", "title": "飛騨牛ディナー", "detail": "要予約・チェックイン後移動" },
                { "time": "20:00", "type": "stay", "title": "ホテル宿泊", "detail": "高山泊 (1泊目)" }
            ]
        },
        {
            "date": "2024-12-29",
            "day": "月",
            "location": "高山 (連泊)",
            "events": [
                { "time": "08:50", "type": "transport", "title": "高山濃飛バスセンター 発", "detail": "白川郷行き (要予約確認) [09:40着]" },
                { "time": "09:40", "type": "sightseeing", "title": "白川郷 散策", "detail": "合掌造り集落、展望台、雪遊び" },
                { "time": "13:15", "type": "transport", "title": "白川郷 発", "detail": "高山行きバス [14:05頃着]" },
                { "time": "15:00", "type": "sightseeing", "title": "高山 古い町並み", "detail": "さんまち通り散策、食べ歩き" },
                { "time": "18:00", "type": "meal", "title": "夕食・フリータイム", "detail": "高山ラーメンなど" }
            ]
        },
        {
            "date": "2024-12-30",
            "day": "火",
            "location": "下呂温泉",
            "events": [
                { "time": "09:00", "type": "sightseeing", "title": "宮川朝市", "detail": "年末の市場散策" },
                { "time": "12:35", "type": "transport", "title": "JR高山駅 発", "detail": "特急ひだ 10号 [13:20 下呂着]" },
                { "time": "15:00", "type": "sightseeing", "title": "下呂温泉街 散策", "detail": "足湯、温泉寺、下呂プリン" },
                { "time": "16:00", "type": "stay", "title": "旅館チェックイン", "detail": "日本三名泉の湯" },
                { "time": "18:30", "type": "meal", "title": "会席料理", "detail": "豪華夕食" }
            ]
        },
        {
            "date": "2024-12-31",
            "day": "水",
            "location": "名古屋",
            "events": [
                { "time": "11:00", "type": "sightseeing", "title": "下呂温泉街", "detail": "お土産購入など" },
                { "time": "12:22", "type": "transport", "title": "JR下呂駅 発", "detail": "特急ひだ 8号 [14:02 名古屋着]" },
                { "time": "15:30", "type": "sightseeing", "title": "名古屋城 (外観)", "detail": "年末休園中、外周散策" },
                { "time": "19:00", "type": "meal", "title": "年越しそば", "detail": "きしめん等を堪能" },
                { "time": "23:55", "type": "other", "title": "カウントダウン", "detail": "ホテルまたは近隣にて" }
            ]
        },
        {
            "date": "2025-01-01",
            "day": "木",
            "location": "帰路",
            "events": [
                { "time": "09:00", "type": "sightseeing", "title": "熱田神宮 初詣", "detail": "三種の神器、大混雑注意" },
                { "time": "12:00", "type": "meal", "title": "名古屋めしランチ", "detail": "ひつまぶし・手羽先" },
                { "time": "14:30", "type": "transport", "title": "名鉄名古屋駅 発", "detail": "ミュースカイ [中部着]" },
                { "time": "16:50", "type": "transport", "title": "中部国際空港 発", "detail": "SKY 557 (フォワードシート) [19:20 那覇着]" }
            ]
        }
    ]
};

function getTripData() {
    return TRIP_DATA;
}
