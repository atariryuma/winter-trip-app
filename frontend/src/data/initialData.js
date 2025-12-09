export const initialItinerary = [
    {
        id: 'day-1',
        date: '12/28', dayOfWeek: '日', title: '沖縄から飛騨高山への大移動',
        location: '那覇 → 名古屋 → 高山',
        weather: { temp: '8°C', condition: 'Cloudy' },
        summary: '日本を縦断する移動日。那覇から名古屋を経て、雪の飛騨高山へ。移動そのものを楽しむ一日。',
        events: [
            { id: 'e1-1', type: 'transport', category: 'flight', name: 'JTA 044便', time: '11:10', endTime: '13:15', status: 'confirmed', bookingRef: 'JTA-1228-044', details: '那覇 (OKA) -> 名古屋 (NGO)' },
            { id: 'e1-2', type: 'activity', category: 'meal', name: '名古屋めしランチ', time: '13:30', description: '中部国際空港内で味噌カツまたはきしめん', status: 'planned' },
            { id: 'e1-3', type: 'transport', category: 'train', name: '名鉄ミュースカイ', time: '14:30', endTime: '15:10', status: 'planned', details: '中部国際空港 -> 名古屋駅' },
            { id: 'e1-4', type: 'transport', category: 'train', name: '特急ひだ 15号', time: '15:43', endTime: '18:10', status: 'confirmed', bookingRef: 'JR-HIDA-15', details: '名古屋 -> 高山 (指定席 3号車 5-A,B,C)' },
            { id: 'e1-5', type: 'stay', category: 'hotel', name: '力車イン', time: '15:00', checkIn: '15:00-18:00', status: 'confirmed', bookingRef: '6321591551', details: '和室 ファミリールーム 101 BAMBOO' },
        ]
    },
    {
        id: 'day-2',
        date: '12/29', dayOfWeek: '月', title: '世界遺産・白川郷の雪景色',
        location: '高山 ⇔ 白川郷',
        weather: { temp: '-2°C', condition: 'Snow' },
        summary: '白銀の世界遺産、白川郷へ。合掌造りの集落と雪景色を堪能し、高山の古い町並みで食べ歩き。',
        events: [
            { id: 'e2-1', type: 'activity', category: 'transfer', name: '宿移動', time: '08:30', description: '力車インをチェックアウトし、荷物を次のホテルへ預ける', status: 'planned' },
            { id: 'e2-2', type: 'transport', category: 'bus', name: '濃飛バス', time: '09:50', endTime: '10:40', status: 'confirmed', bookingRef: 'BUS-29-01', details: '高山濃飛バスセンター -> 白川郷' },
            { id: 'e2-3', type: 'activity', category: 'sightseeing', name: '白川郷散策', time: '10:40', description: '和田家、明善寺、展望台からの眺め', status: 'planned' },
            { id: 'e2-4', type: 'transport', category: 'bus', name: '濃飛バス', time: '14:30', endTime: '15:20', status: 'confirmed', bookingRef: 'BUS-29-02', details: '白川郷 -> 高山' },
            { id: 'e2-5', type: 'activity', category: 'sightseeing', name: '古い町並み散策', time: '15:30', description: '三町通り、高山陣屋、飛騨牛寿司', status: 'suggested' },
            { id: 'e2-6', type: 'stay', category: 'hotel', name: 'ホテル ウッド 高山', time: '15:00', checkIn: '15:00', status: 'confirmed', bookingRef: '5444724807', details: 'スタンダード ツインルーム 2部屋' },
        ]
    },
    {
        id: 'day-3',
        date: '12/30', dayOfWeek: '火', title: '北アルプスの絶景と下呂温泉',
        location: '高山 → 新穂高 → 下呂',
        weather: { temp: '-5°C', condition: 'Clear' },
        summary: '新穂高ロープウェイで雲上の絶景へ。その後、日本三名泉の一つ、下呂温泉で旅の疲れを癒やす。',
        events: [
            { id: 'e3-1', type: 'activity', category: 'sightseeing', name: '宮川朝市（早朝）', time: '07:30', description: '出発前に少しだけ朝市を覗く', status: 'suggested' },
            { id: 'e3-2', type: 'transport', category: 'bus', name: '濃飛バス', time: '08:40', endTime: '10:16', status: 'planned', details: '高山 -> 新穂高ロープウェイ' },
            { id: 'e3-3', type: 'activity', category: 'sightseeing', name: '新穂高ロープウェイ', time: '10:30', description: '第1・第2ロープウェイを乗り継ぎ山頂展望台へ', status: 'confirmed' },
            { id: 'e3-4', type: 'transport', category: 'bus', name: '濃飛バス & JR', time: '13:46', endTime: '16:00', status: 'planned', details: '新穂高 -> 高山 -> 下呂' },
            { id: 'e3-5', type: 'activity', category: 'sightseeing', name: '下呂温泉街散策', time: '16:30', description: '足湯めぐり、温泉寺', status: 'suggested' },
            { id: 'e3-6', type: 'stay', category: 'hotel', name: '温泉宿廣司', time: '17:00', checkIn: '17:00', status: 'confirmed', bookingRef: '6178769046', details: '飛騨牛朴葉味噌定食セット / 和室' },
        ]
    },
    {
        id: 'day-4',
        date: '12/31', dayOfWeek: '水', title: '日本三名泉と名古屋の年越し',
        location: '下呂 → 名古屋',
        weather: { temp: '5°C', condition: 'Sunny' },
        summary: '下呂温泉の朝湯を楽しみ、名古屋へ。大晦日の名古屋でショッピングとグルメを楽しみ、賑やかに年越し。',
        events: [
            { id: 'e4-1', type: 'activity', category: 'sightseeing', name: '下呂温泉合掌村', time: '09:00', description: '朝の散策', status: 'suggested' },
            { id: 'e4-2', type: 'transport', category: 'train', name: '特急ひだ 10号', time: '11:28', endTime: '13:12', status: 'confirmed', bookingRef: 'JR-HIDA-10', details: '下呂 -> 名古屋' },
            { id: 'e4-3', type: 'activity', category: 'meal', name: 'ひつまぶしランチ', time: '13:30', description: 'あつた蓬莱軒 松坂屋店（要予約）', status: 'planned' },
            { id: 'e4-4', type: 'activity', category: 'shopping', name: '栄・大須でお買い物', time: '15:00', description: '年末の賑わいを感じながらショッピング', status: 'planned' },
            { id: 'e4-5', type: 'stay', category: 'hotel', name: 'ホテルリブマックス名古屋', time: '15:00', checkIn: '15:00-22:00', status: 'confirmed', bookingRef: '5704883964', details: 'ファミリールーム 禁煙' },
        ]
    },
    {
        id: 'day-5',
        date: '1/1', dayOfWeek: '木', title: '初詣と帰路',
        location: '名古屋 → 那覇',
        weather: { temp: '7°C', condition: 'Sunny' },
        summary: '新年の幕開けは熱田神宮での初詣から。旅の思い出と共に、沖縄への帰路につく。',
        events: [
            { id: 'e5-1', type: 'activity', category: 'sightseeing', name: '熱田神宮 初詣', time: '09:00', description: '三種の神器の一つを祀る神社で新年のお参り', status: 'confirmed' },
            { id: 'e5-2', type: 'transport', category: 'train', name: '名鉄ミュースカイ', time: '12:00', endTime: '12:35', status: 'planned', details: '名古屋 -> 中部国際空港' },
            { id: 'e5-3', type: 'transport', category: 'flight', name: 'JTA 047便', time: '14:15', endTime: '16:50', status: 'confirmed', bookingRef: 'JTA-0101-047', details: '名古屋 (NGO) -> 那覇 (OKA)' },
        ]
    },
];
