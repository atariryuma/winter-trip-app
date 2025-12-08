import { useState, useEffect } from 'react'
import { postToGAS } from './api/gas'
import Timeline from './components/Timeline'
import './App.css'

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // doGet is standard for fetching, but our helper is postToGAS.
        // GAS Web App often requires POST for JSON payloads or proper CORS handling if simple GET is complex.
        // However, standard GAS GET works for simple queries.
        // Let's modify api/gas.js to support GET or use a workaround.
        // For now, let's try fetch directly or keep using postToGAS but sending action param.
        // Actually, our backend Code.js checks e.parameter. Let's construct URL.

        const gasUrl = import.meta.env.VITE_GAS_API_URL;
        if (!gasUrl) {
          // Mock data for dev without env
          setTimeout(() => {
            setData({
              tripInfo: { title: "Mock Trip", period: "2024" },
              schedules: []
            });
            setLoading(false);
          }, 1000);
          return;
        }

        const response = await fetch(`${gasUrl}?action=getItinerary`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch trip data:", err);
        setError("旅程データの取得に失敗しました。");

        // Fallback or retry? For now detail error.
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="app-container">
      {loading && <div className="loading-spinner">読み込み中...</div>}
      {error && <div className="error-message">{error}</div>}
      {data && <Timeline tripData={data} />}
    </div>
  )
}

export default App
