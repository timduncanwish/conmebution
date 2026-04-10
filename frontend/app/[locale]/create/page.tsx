/**
 * Content Creation Page - Enhanced
 * Main interface for AI content generation with API integration
 */

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useTranslations } from 'next-intl';
import api from '../../lib/api';

export default function CreatePage() {
  const t = useTranslations('create');
  const locale = useParams().locale as string;
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'all'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);

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
    localStorage.setItem('drafts', JSON.stringify(drafts.slice(0, 10)));
    setSavedDrafts(drafts.slice(0, 10));
  };

  const loadDrafts = () => {
    const drafts = JSON.parse(localStorage.getItem('drafts') || '[]');
    setSavedDrafts(drafts);
  };

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
      setError(t('minPromptError'));
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult(null);

    try {
      if (contentType === 'text' || contentType === 'all') {
        const response = await api.generateTextSync(prompt, 'doubao');
        if (response.success) {
          setResult({ type: 'text', data: response.data });
        } else {
          setError(response.error?.message || t('generating'));
        }
      } else if (contentType === 'image') {
        const response = await api.generateImage(prompt, { n: 1 });
        if (response.success) {
          setResult({ type: 'image', data: response.data });
        } else {
          setError(response.error?.message || t('generating'));
        }
      } else if (contentType === 'video') {
        const response = await api.generateVideo(prompt, { duration: 15 });
        if (response.success) {
          setResult({ type: 'video', data: response.data });
        } else {
          setError(response.error?.message || t('generating'));
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEstimateCost = async () => {
    if (!prompt.trim() || prompt.length < 10) {
      setError(t('minPromptError'));
      return;
    }

    try {
      const response = await api.estimateCost(prompt, 'doubao');
      if (response.success) {
        setEstimatedCost(response.data.estimatedCost);
      }
    } catch {
      // Cost estimation failure is non-critical
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
                  {prompt.length}{t('promptMaxLength')} ({t('promptMinLength')})
                </span>
                <button
                  onClick={handleEstimateCost}
                  disabled={prompt.length < 10}
                  className="text-sm text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {t('estimateCost')}
                </button>
              </div>
              {estimatedCost !== null && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    {t('estimatedCostLabel')}: ${estimatedCost.toFixed(4)} USD
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('contentType')}
              </label>
              <div className="flex flex-wrap gap-4">
                {(['text', 'image', 'video', 'all'] as const).map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      value={type}
                      checked={contentType === type}
                      onChange={(e) => setContentType(e.target.value as typeof contentType)}
                      className="mr-2"
                    />
                    {t(`types.${type}`)}
                  </label>
                ))}
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
                {t('clearResults')}
              </button>
            </div>
          </div>

          {/* Display Results */}
          {result && (
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{t('resultTitle')}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      saveDraft(result);
                      alert(t('draftSaved'));
                    }}
                    className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    {t('saveDraft')}
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
                    {isEditing ? t('cancelEdit') : t('editContent')}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t('confirmPublish'))) {
                        router.push(`/${locale}/publish?content=${encodeURIComponent(JSON.stringify(result))}`);
                      }
                    }}
                    className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                  >
                    {t('goPublish')}
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
                          {t('saveChanges')}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {t('cancel')}
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
                      <p className="font-medium">{t('provider')}</p>
                      <p>{result.data.provider}</p>
                    </div>
                    <div>
                      <p className="font-medium">{t('tokenUsage')}</p>
                      <p>{result.data.tokensUsed.total}</p>
                    </div>
                    <div>
                      <p className="font-medium">{t('cost')}</p>
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
                        <p className="text-sm text-gray-500 mt-2">{t('optimizedPrompt')}: {img.revisedPrompt}</p>
                      )}
                    </div>
                  ))}
                  {result.data.cost && (
                    <p className="text-sm text-gray-600">{t('cost')}: ${result.data.cost.toFixed(4)}</p>
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
                      <p className="text-gray-600">{t('generatingVideo')}</p>
                      <p className="text-sm text-gray-500 mt-2">{t('taskId')}: {result.data.videoId}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                    <div>
                      <p className="font-medium">{t('duration')}</p>
                      <p>{result.data.duration}{t('seconds')}</p>
                    </div>
                    {result.data.cost && (
                      <div>
                        <p className="font-medium">{t('cost')}</p>
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
                <h2 className="text-xl font-semibold text-gray-900">{t('draftTitle')}</h2>
                <button
                  onClick={loadDrafts}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {t('refresh')}
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
                          {new Date(draft.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => applyDraft(draft)}
                          className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          {t('load')}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('confirmDelete'))) {
                              const drafts = savedDrafts.filter(d => d.id !== draft.id);
                              localStorage.setItem('drafts', JSON.stringify(drafts));
                              setSavedDrafts(drafts);
                            }
                          }}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {draft.contentType === 'text' ? t('typeText') : draft.contentType === 'image' ? t('typeImage') : t('typeVideo')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('quickActions')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={loadDrafts}
                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm"
              >
                {t('loadDrafts')}
              </button>
              <button
                onClick={() => {
                  if (confirm(t('confirmClearDrafts'))) {
                    localStorage.removeItem('drafts');
                    setSavedDrafts([]);
                  }
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-sm"
              >
                {t('clearDrafts')}
              </button>
              <button
                onClick={() => router.push(`/${locale}/templates`)}
                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm"
              >
                {t('templateLibrary')}
              </button>
              <button
                onClick={() => router.push(`/${locale}/publish`)}
                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm"
              >
                {t('goPublish')}
              </button>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('recentTemplates')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['product', 'tutorial', 'entertainment', 'news'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setPrompt(t(`templateNames.${key}`))}
                  className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-sm"
                >
                  {t(`templateNames.${key}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
