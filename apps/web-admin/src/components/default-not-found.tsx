export function DefaultNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="font-bold text-6xl text-gray-900">404</h1>
        <p className="mt-4 text-gray-600 text-xl">页面未找到</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90">
          返回首页
        </a>
      </div>
    </div>
  );
}
