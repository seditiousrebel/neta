
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import React, { useState, Suspense } from 'react'; // Import React and Suspense

// Conditionally import ReactQueryDevtools using React.lazy
// This will only attempt to load the module in the development environment.
const Devtools = process.env.NODE_ENV === 'development'
  ? React.lazy(() =>
      import('@tanstack/react-query-devtools').then(module => {
        // The ReactQueryDevtools component is typically a named export
        if (module.ReactQueryDevtools) {
          return { default: module.ReactQueryDevtools };
        }
        // Fallback if it's somehow a default export, though unlikely for this package
        return { default: module.default || (() => null) };
      })
    )
  : () => null; // In production, Devtools component renders nothing

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false, // Optional: disable refetch on window focus
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Suspense is required for React.lazy components */}
      {/* Only render Devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}> {/* fallback={null} means render nothing while loading */}
          <Devtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
}
