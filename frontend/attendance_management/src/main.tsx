import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Button } from './components/ui/button.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Button variant={'link'} color='primary'>Test Button fsdsdor lide</Button>
  </StrictMode>,
)
