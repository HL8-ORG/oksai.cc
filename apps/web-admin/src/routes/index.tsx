import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Oksai 管理后台</h1>
        <p className="mt-2 text-muted-foreground">
          基于 TanStack Start + radix-ui 的企业级管理平台
        </p>
      </div>
    </div>
  );
}
