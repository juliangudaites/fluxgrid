import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n/context.tsx'
import { TierProvider } from './tiers/context.tsx'
import { AdminPortal } from './admin/AdminPortal.tsx'

const isAdmin = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? (
      <AdminPortal />
    ) : (
      <I18nProvider>
        <TierProvider>
          <App />
        </TierProvider>
      </I18nProvider>
    )}
  </StrictMode>,
)