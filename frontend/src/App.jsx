import TravelApp from './components/TravelApp'
import './App.css'
import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <ToastProvider>
      <div className="w-full flex justify-center">
        <TravelApp />
      </div>
    </ToastProvider>
  )
}

export default App
