/**
 * API测试页面
 * 用于验证前后端集成
 */

import ApiTestComponent from '../../lib/test-api';

export default function TestApiPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Conmebution API集成测试</h1>

        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-800 mb-2">测试说明</h2>
          <p className="text-blue-700 text-sm">
            此页面用于测试前端与后端API的连接。点击下方按钮将自动测试所有主要API端点。
            后端服务器应运行在 http://localhost:4000
          </p>
        </div>

        <ApiTestComponent />

        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API端点列表</h2>
          <div className="space-y-2 text-sm">
            <div><strong>健康检查</strong>: <code>GET /api/health</code></div>
            <div><strong>成本估算</strong>: <code>GET /api/generate/cost?prompt={文本}&provider={提供商}</code></div>
            <div><strong>文本生成</strong>: <code>POST /api/generate/text/sync</code></div>
            <div><strong>图片生成</strong>: <code>POST /api/generate/image</code></div>
            <div><strong>视频生成</strong>: <code>POST /api/generate/video</code></div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/zh" className="text-blue-600 hover:text-blue-800">
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
