"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  // Stable QueryClient (Pattern recomendado do react-query pra Next.js).
  // Sem useState, o QueryClient pode ser recriado em re-renders ou
  // double-mounts do React Strict Mode em dev, perdendo cache e
  // causando refetches em loop.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}