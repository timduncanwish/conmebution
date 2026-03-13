/**
 * 内容库页面
 * 显示所有生成的内容历史
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';
import api from '../../lib/api';

interface ContentItem {
  id: string;
  prompt: string;
  type: string;
  status: 'draft' | 'generated' | 'published';
  createdAt: string;
  cost?: number;
}

export default function ContentLibraryPage() {
  const t = useTranslations('content');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'generated' | 'published'>('all');

  useEffect(() => {
    // TODO: 从API获取内容列表
    // 目前使用模拟数据
    const mockContents: ContentItem[] = [
      {
        id: '1',
        prompt: '春季护肤新品推荐',
        type: 'all',
        status: 'published',
        createdAt: '2025-03-10T14:30:00Z',
        cost: 2.5
      },
      {
        id: '2',
        prompt: 'AI技术发展趋势分析',
        type: 'text',
        status: 'generated',
        createdAt: '2025-03-09T10:15:00Z',
        cost: 1.2
      }
    ];

    setContents(mockContents);
    setLoading(false);
  }, []);

  const filteredContents = contents.filter(content => {
    if (filter === 'all') return true;
    return content.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('title')}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('subtitle')}
            </p>
          </div>

          {/* 筛选器 */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('filter.all')}
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'draft'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('filter.draft')}
            </button>
            <button
              onClick={() => setFilter('generated')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'generated'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('filter.generated')}
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'published'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('filter.published')}
            </button>
          </div>

          {/* 内容列表 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">{t('loading')}</p>
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="bg-white shadow-sm rounded-lg p-12 text-center">
              <p className="text-gray-500">{t('empty')}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredContents.map((content) => (
                <div key={content.id} className="bg-white shadow-sm rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {content.prompt}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          content.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : content.status === 'generated'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`status.${content.status}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>类型: {content.type}</span>
                        <span>创建时间: {new Date(content.createdAt).toLocaleString()}</span>
                        {content.cost && <span>成本: ¥{content.cost.toFixed(2)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        {t('actions.view')}
                      </button>
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        {t('actions.edit')}
                      </button>
                      <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        {t('actions.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
