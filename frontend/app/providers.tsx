"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,      // 5 minutes — data stays fresh
            gcTime: 10 * 60 * 1000,         // 10 minutes garbage collection
            refetchOnWindowFocus: false,     // Don't refetch on tab switch
            refetchOnReconnect: false,       // Don't refetch on reconnect
            retry: 1,                        // Only retry once on failure
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
