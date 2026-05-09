import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './tokens.css'
import { TweaksProvider } from './context/TweaksContext'
import { applyTokens, TWEAKS_DEFAULT } from './theme/tweaksConfig'
import App from './App.tsx'

applyTokens(TWEAKS_DEFAULT)

// Limpieza one-shot tras migrar a Sanctum SPA cookies (PR feat/sanctum-spa-cookies):
// las pestañas que tenían sesión con el bearer token guardado en localStorage ya no lo
// usan; ahora es la cookie HttpOnly. Borramos esas claves al arrancar para no dejar
// residuos. Si en una versión futura no quedan instalaciones con esto, puede quitarse.
try {
  localStorage.removeItem('lw_token')
  localStorage.removeItem('lw-auth-store')
} catch {
  /* sandbox / privacy mode: ignorar */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TweaksProvider>
      <App />
    </TweaksProvider>
  </StrictMode>,
)
