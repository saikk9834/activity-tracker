import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthGate } from '@/components/AuthGate';
import { AuthProvider } from '@/state/AuthProvider';
import '@/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  </StrictMode>,
);
