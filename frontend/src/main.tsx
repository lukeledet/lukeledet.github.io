import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { SupabaseProvider } from './contexts/SupabaseContext'
import App from './App'
import { AuthCallback } from './components/AuthCallback'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider>
        <SupabaseProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </SupabaseProvider>
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>,
) 