import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAppStore } from './stores/useAppStore';
import { bindOnlineSync } from './lib/onlineSync';

let _queryClient: QueryClient | null = null;
function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          staleTime: 60000,
          gcTime: 10 * 60 * 1000,
          retry: 1,
        },
      },
    });
  }
  return _queryClient;
}

export const App: React.FC = () => {
  const language = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    // Synchronize HTML dir and lang
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => bindOnlineSync(), []);

  useEffect(() => {
    // Synchronize HTML theme class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={getQueryClient()}>
        <AppShell />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
