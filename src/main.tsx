import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import 'react-day-picker/dist/style.css'
import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from './components/auth/auth-provider'
import { Toaster } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider attribute="class" defaultTheme="dark" storageKey="vite-ui-theme">
            <AuthProvider>
                <App />
                <Toaster position="top-center" richColors />
            </AuthProvider>
        </ThemeProvider>
    </React.StrictMode>,
)
