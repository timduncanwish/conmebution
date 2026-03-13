/**
 * API测试页面
 * 用于验证前后端集成
 */

'use client';

import { useState } from 'react';

interface TestResult {
  description: string;
  status: number | string;
  success: boolean;
  data: any;
  error: string | null;
}

export default function TestApiPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const testApi = async (endpoint: string, description: string): Promise<TestResult> => {
    try {
      const response = await fetch(`http://localhost:4000${endpoint}`);
      const data = await response.json();
      return {
        description,
        status: response.status,
        success: data.success,
        data: data,
        error: null
      };
    } catch (error: any) {
      return {
        description,
        status: 'Error',
        success: false,
        data: null,
        error: error.message
      };
    }
  };

  const runTests = async () => {
    setLoading(true);
    const tests = [
      { endpoint: '/api/health', desc: '健康检查' },
      { endpoint: '/api/generate/cost?prompt=测试', desc: '成本估算 (中文)' },
      { endpoint: '/api/generate/cost?prompt=test&provider=gpt-4', desc: '成本估算 (GPT-4)' },
      { endpoint: '/api/generate/cost?prompt=hello', desc: '成本估算 (默认)' },
    ];

    const results = await Promise.all(
      tests.map(test => testApi(test.endpoint, test.desc))
    );

    setTestResults(results);
    setLoading(false);
  };

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

        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">API集成测试</h2>

          <button
            onClick={runTests}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? '测试中...' : '运行API测试'}
          </button>

          {testResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-semibold">测试结果</h3>
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded ${
                    result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{result.description}</h4>
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {result.success ? '✓ 成功' : '✗ 失败'}
                    </span>
                  </div>

                  {result.data && (
                    <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}

                  {result.error && (
                    <p className="text-red-600 text-sm">错误: {result.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto mt-8 bg-gray-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API端点列表</h2>
          <div className="space-y-2 text-sm">
            <div><strong>健康检查</strong>: <code>GET /api/health</code></div>
            <div><strong>成本估算</strong>: <code>GET /api/generate/cost?prompt={'{'}文本{'}'}&amp;provider={'{'}提供商{'}'}</code></div>
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
