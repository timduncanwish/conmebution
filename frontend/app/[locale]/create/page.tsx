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
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // 从URL参数获取模板ID
  const [templateId, setTemplateId] = useState<string | null>(null);

  // 保存草稿到localStorage
  const saveDraft = (content: any) => {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '[]');
    const newDraft = {
      id: Date.now(),
      prompt,
      contentType,
      content,
      timestamp: new Date().toISOString()
    };
    drafts.unshift(newDraft);
    localStorage.setItem('drafts', JSON.stringify(drafts.slice(0, 10))); // 只保留最近10个
    setSavedDrafts(drafts.slice(0, 10));
  };

  // 加载草稿
  const loadDrafts = () => {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '[]');
    setSavedDrafts(drafts);
  };

  // 应用草稿
  const applyDraft = (draft: any) => {
    setPrompt(draft.prompt);
    setContentType(draft.contentType);
    if (draft.content) {
      setResult(draft.content);
      setEditedContent(draft.content.data?.content || draft.content.data?.url || '');
    }
  };

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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">✨ 生成结果</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      saveDraft(result);
                      alert('草稿已保存！');
                    }}
                    className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    💾 保存草稿
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(!isEditing);
                      if (!isEditing && result.type === 'text') {
                        setEditedContent(result.data.content);
                      }
                    }}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    ✏️ {isEditing ? '取消编辑' : '编辑内容'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定要发布此内容吗？')) {
                        window.location.href = `/zh/publish?content=${encodeURIComponent(JSON.stringify(result))}`;
                      }
                    }}
                    className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                  >
                    🚀 去发布
                  </button>
                </div>
              </div>
              {result.type === 'text' && (
                <div>
                  {isEditing ? (
                    <div>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => {
                            setResult({
                              ...result,
                              data: { ...result.data, content: editedContent }
                            });
                            setIsEditing(false);
                          }}
                                                          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          保存修改
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                                                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{result.data.content}</p>
                    </div>
                  )}
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

          {/* Saved Drafts */}
          {savedDrafts.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">📝 草稿箱</h2>
                <button
                  onClick={loadDrafts}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  刷新
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {draft.prompt.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(draft.timestamp).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => applyDraft(draft)}
                          className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          加载
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('确定删除此草稿吗？')) {
                              const drafts = savedDrafts.filter(d => d.id !== draft.id);
                              localStorage.setItem('drafts', JSON.stringify(drafts));
                              setSavedDrafts(drafts);
                            }
                          }}
                                                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      类型: {draft.contentType === 'text' ? '文本' : draft.contentType === 'image' ? '图片' : '视频'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ 快速操作</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={loadDrafts}
                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm"
              >
                📂 加载草稿
              </button>
              <button
                onClick={() => {
                  if (confirm('确定清除所有草稿吗？')) {
                    localStorage.removeItem('drafts');
                    setSavedDrafts([]);
                  }
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-sm"
              >
                🗑️ 清除草稿
              </button>
              <button
                onClick={() => window.location.href = '/zh/templates'}
                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm"
              >
                📋 模板库
              </button>
              <button
                onClick={() => window.location.href = '/zh/publish'}
                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm"
              >
                🚀 去发布
              </button>
            </div>
          </div>

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
