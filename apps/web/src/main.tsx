import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { setTokenStorage, apiClient } from '@mednova/api';

// Configure base URL from environment or fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://10.0.2.2:8000' || 'http://localhost:8000';
apiClient.defaults.baseURL = API_URL;

// Configure Web token storage (using LocalStorage for demo)
const webTokenStorage = {
  getAccessToken: () => localStorage.getItem('mednova_access_token'),
  getRefreshToken: () => localStorage.getItem('mednova_refresh_token'),
  saveTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('mednova_access_token', accessToken);
    localStorage.setItem('mednova_refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('mednova_access_token');
    localStorage.removeItem('mednova_refresh_token');
    localStorage.removeItem('mednova_user_profile');
  },
};

setTokenStorage(webTokenStorage);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
