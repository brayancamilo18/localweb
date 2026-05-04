import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './tokens.css'
import { TweaksProvider } from './context/TweaksContext'
import { applyTokens, TWEAKS_DEFAULT } from './theme/tweaksConfig'
import App from './App.tsx'

applyTokens(TWEAKS_DEFAULT)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TweaksProvider>
      <App />
    </TweaksProvider>
  </StrictMode>,
)
