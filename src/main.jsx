import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { DbProvider } from './lib/store.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import './index.css'
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DbProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DbProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
