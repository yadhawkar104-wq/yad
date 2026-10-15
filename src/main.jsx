import { createContext, useContext, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const ToastCtx = createContext(null)
let toastFn = () => {}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    toastFn = (msg, type = 'ok') => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, msg, type }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
    }
  }, [])
  return (
    <ToastCtx.Provider value={toastFn}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center">
        {toasts.map((t) => (
          <div key={t.id} className={`animate-fade-in rounded-xl px-5 py-3 text-sm font-semibold shadow-xl text-white ${t.type === 'err' ? 'bg-red-600' : 'bg-emerald-600'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const toast = (msg, type) => toastFn(msg, type)

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
)
