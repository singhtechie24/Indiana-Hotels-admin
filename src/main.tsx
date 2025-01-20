import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './utils/setupAdmin'
import { checkAdminSetup } from './utils/setupAdmin'

// Make setup functions available globally
(window as any).checkAdminSetup = checkAdminSetup

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
