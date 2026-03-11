import { enableMapSet } from 'immer';
enableMapSet();
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/hooks/useAuth';
import '@/index.css';
import { HomePage } from '@/pages/HomePage';
import { ClaimsListPage } from '@/pages/ClaimsListPage';
import { ClaimDetailPage } from '@/pages/ClaimDetailPage';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/claims" element={<ClaimsListPage />} />
            <Route path="/claims/:instanceId" element={<ClaimDetailPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);