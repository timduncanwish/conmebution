/**
 * Content Creation Page - Enhanced
 * Main interface for AI content generation with API integration
 */

'use client';

import { useState } from 'react';
import Navigation from '../../components/Navigation';
import { useTranslations } from 'next-intl';
import api from '../../lib/api';

export default function CreatePage() {
  const t = useTranslations('create');
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'all'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.length < 10) {
      setError('请输入至少10个字符的描述');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      if (contentType === 'text' || contentType === 'all') {
        const response = await api.generateTextSync(prompt, 'glm-4');
        if (response.success) {
          setResult({ type: 'text', data: response.data });
        } else {
          setError(response.error?.message || '文本生成失败');
        }
      } else if (contentType === 'image') {
        const response = await api.generateImage(prompt, { n: 1 });
        if (response.success) {
          setResult({ type: 'image', data: response.data });
        } else {
          setError(response.error?.message || '图片生成失败');
        }
      } else if (contentType === 'video') {
        const response = await api.generateVideo(prompt, { duration: 15 });
        if (response.success) {
          setResult({ type: 'video', data: response.data });
        } else {
          setError(response.error?.message || '视频生成失败');
        }
      }
    } catch (err: any) {
      console.error('生成失败:', err);
      setError(err.message || '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEstimateCost = async () => {
    if (!prompt.trim() || prompt.length < 10) {
      setError('请输入至少10个字符的描述');
      return;
    }

    try {
      const response = await api.estimateCost(prompt, 'glm-4');
      if (response.success) {
        setEstimatedCost(response.data.estimatedCost);
      }
    } catch (err: any) {
      console.error('成本估算失败:', err);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError('');
    setEstimatedCost(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('title')}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('subtitle')}
            </p>
          </div>

          {/* Content Creation Form */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('describeContent')}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t('promptPlaceholder')}
              />
              <div className="mt-2 flex justify-between items-center">
                <span className={`text-sm ${prompt.length < 10 ? 'text-red-500' : 'text-gray-500'}`}>
                  {prompt.length}/5000 (最少10个字符)
                </span>
                <button
                  onClick={handleEstimateCost}
                  disabled={prompt.length < 10}
                  className="text-sm text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  预估成本
                </button>
              </div>
              {estimatedCost !== null && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    预估成本: ${estimatedCost.toFixed(4)} USD
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('contentType')}
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="text"
                    checked={contentType === 'text'}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="mr-2"
                  />
                  {t('types.text')}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="image"
                    checked={contentType === 'image'}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="mr-2"
                  />
                  {t('types.image')}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="video"
                    checked={contentType === 'video'}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="mr-2"
                  />
                  {t('types.video')}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={contentType === 'all'}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="mr-2"
                  />
                  {t('types.all')}
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || prompt.length < 10 || isGenerating}
                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('generating')}
                  </span>
                ) : (
                  t('startCreating')
                )}
              </button>
              <button
                onClick={clearResults}
                className="py-3 px-6 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                清除结果
              </button>
            </div>
          </div>

          {/* Display Results */}
          {result && (
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">✨ 生成结果</h2>
              {result.type === 'text' && (
                <div>
                  <div className="p-4 bg-gray-50 rounded-lg mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{result.data.content}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">提供商</p>
                      <p>{result.data.provider}</p>
                    </div>
                    <div>
                      <p className="font-medium">Token使用</p>
                      <p>{result.data.tokensUsed.total}</p>
                    </div>
                    <div>
                      <p className="font-medium">成本</p>
                      <p>${result.data.cost.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              )}
              {result.type === 'image' && result.data.images && (
                <div>
                  {result.data.images.map((img: any, idx: number) => (
                    <div key={idx} className="mb-4">
                      <img
                        src={img.url}
                        alt={`Generated ${idx + 1}`}
                        className="max-w-full h-auto rounded-lg border"
                      />
                      {img.revisedPrompt && (
                        <p className="text-sm text-gray-500 mt-2">优化提示: {img.revisedPrompt}</p>
                      )}
                    </div>
                  ))}
                  {result.data.cost && (
                    <p className="text-sm text-gray-600">成本: ${result.data.cost.toFixed(4)}</p>
                  )}
                </div>
              )}
              {result.type === 'video' && (
                <div>
                  {result.data.videoUrl ? (
                    <video controls className="max-w-full h-auto rounded-lg mb-4 border">
                      <source src={result.data.videoUrl} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="p-8 bg-gray-100 rounded-lg text-center">
                      <p className="text-gray-600">视频生成中...</p>
                      <p className="text-sm text-gray-500 mt-2">任务ID: {result.data.videoId}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                    <div>
                      <p className="font-medium">时长</p>
                      <p>{result.data.duration}秒</p>
                    </div>
                    {result.data.cost && (
                      <div>
                        <p className="font-medium">成本</p>
                        <p>${result.data.cost.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Templates */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('recentTemplates')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['产品介绍', '教程视频', '娱乐搞笑', '新闻资讯'].map((template) => (
                <button
                  key={template}
                  onClick={() => setPrompt(template)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
