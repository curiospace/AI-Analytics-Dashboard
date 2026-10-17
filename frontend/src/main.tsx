import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { ChatProvider } from './lib/chat'
import { DashboardProvider } from './lib/dashboard'
import { FiltersProvider } from './lib/filters'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FiltersProvider>
        <ChatProvider>
          <DashboardProvider>
            <App />
          </DashboardProvider>
        </ChatProvider>
      </FiltersProvider>
    </QueryClientProvider>
  </StrictMode>,
)
