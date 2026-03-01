import { ErrorComponentProps } from '@tanstack/react-router';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600">出错了</h1>
        <p className="mt-4 text-gray-600">
          {error.message || '发生了一个错误'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          刷新页面
        </button>
      </div>
    </div>
  );
}
