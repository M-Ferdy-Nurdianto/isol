import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import 'aos/dist/aos.css'
import 'react-toastify/dist/ReactToastify.css'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA (Caching) with automatic reload on update
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
