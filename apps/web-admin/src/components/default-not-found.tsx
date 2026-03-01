export function DefaultNotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">页面未找到</p>
        <a
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}
