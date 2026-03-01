import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-bold text-4xl">Oksai 管理后台</h1>
        <p className="mt-2 text-muted-foreground">基于 TanStack Start + radix-ui 的企业级管理平台</p>
      </div>
    </div>
  );
}
