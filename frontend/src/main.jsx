import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import 'aos/dist/aos.css'
import 'react-toastify/dist/ReactToastify.css'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA (Caching)
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
