import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/toaster';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Outlet />
      <Toaster />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
