/**
 * 平台发布页面
 * 选择平台并发布内容
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';

interface Platform {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export default function PublishPage() {
  const t = useTranslations('publish');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  const platforms: Platform[] = [
    { id: 'douyin', name: t('platforms.douyin'), icon: '🎵', enabled: true },
    { id: 'bilibili', name: t('platforms.bilibili'), icon: '📺', enabled: true },
    { id: 'xiaohongshu', name: t('platforms.xiaohongshu'), icon: '📕', enabled: false },
    { id: 'youtube', name: t('platforms.youtube'), icon: '▶️', enabled: false },
    { id: 'twitter', name: t('platforms.twitter'), icon: '🐦', enabled: false },
  ];

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      alert('请至少选择一个平台');
      return;
    }

    setPublishing(true);
    try {
      // TODO: 实现实际的发布逻辑
      console.log('发布到平台:', selectedPlatforms);
      alert('发布功能开发中...');
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setPublishing(false);
    }
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

          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('selectPlatforms')}
            </h2>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                {t('domesticPlatforms')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.filter(p => ['douyin', 'bilibili', 'xiaohongshu'].includes(p.id)).map(platform => (
                  <div
                    key={platform.id}
                    onClick={() => platform.enabled && togglePlatform(platform.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      !platform.enabled
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                        : selectedPlatforms.includes(platform.id)
                        ? 'bg-indigo-50 border-indigo-500'
                        : 'bg-white border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{platform.name}</div>
                          {!platform.enabled && (
                            <div className="text-xs text-gray-500">（未绑定账号）</div>
                          )}
                        </div>
                      </div>
                      {platform.enabled && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPlatforms.includes(platform.id)
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedPlatforms.includes(platform.id) && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                {t('internationalPlatforms')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.filter(p => ['youtube', 'twitter'].includes(p.id)).map(platform => (
                  <div
                    key={platform.id}
                    onClick={() => platform.enabled && togglePlatform(platform.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      !platform.enabled
                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                        : selectedPlatforms.includes(platform.id)
                        ? 'bg-indigo-50 border-indigo-500'
                        : 'bg-white border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">{platform.name}</div>
                          {!platform.enabled && (
                            <div className="text-xs text-gray-500">（未绑定账号）</div>
                          )}
                        </div>
                      </div>
                      {platform.enabled && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPlatforms.includes(platform.id)
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedPlatforms.includes(platform.id) && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 发布设置 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                {t('publishSettings')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('publishType')}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="publishType"
                        value="immediate"
                        defaultChecked
                        className="mr-2"
                      />
                      {t('immediate')}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="publishType"
                        value="scheduled"
                        className="mr-2"
                      />
                      {t('scheduled')}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 发布按钮 */}
            <div className="flex gap-4">
              <button
                onClick={handlePublish}
                disabled={selectedPlatforms.length === 0 || publishing}
                className={`flex-1 py-3 px-6 rounded-lg font-medium ${
                  selectedPlatforms.length === 0 || publishing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {publishing ? t('publishing') : t('publish')}
              </button>
              <button
                className="py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
