import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
// import { Button } from './components/ui/button.tsx'
import { Dashboard } from './components/Dashboard.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App /> */}
    <Dashboard />
  </StrictMode>,
)
