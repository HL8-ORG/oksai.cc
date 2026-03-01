import type { ErrorComponentProps } from "@tanstack/react-router";

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-bold text-4xl text-red-600">出错了</h1>
        <p className="mt-4 text-gray-600">{error.message || "发生了一个错误"}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90">
          刷新页面
        </button>
      </div>
    </div>
  );
}
