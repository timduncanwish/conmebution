/**
 * 设置页面
 * AI服务配置和平台管理
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState<'ai' | 'platforms' | 'account'>('ai');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('title')}
            </h1>
          </div>

          {/* 标签页 */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('ai')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ai'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.ai')}
              </button>
              <button
                onClick={() => setActiveTab('platforms')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'platforms'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.platforms')}
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'account'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t('tabs.account')}
              </button>
            </nav>
          </div>

          {/* AI服务配置 */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">GLM-4.7 (主力)</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
                    <input
                      type="password"
                      placeholder="sk-xxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">状态</div>
                      <div className="text-sm text-red-600">未连接</div>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      测试连接
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">OpenAI GPT-4</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API密钥</label>
                    <input
                      type="password"
                      placeholder="sk-xxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">状态</div>
                      <div className="text-sm text-red-600">未连接</div>
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      测试连接
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">成本控制</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">月度预算上限</label>
                    <input
                      type="number"
                      placeholder="500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto-select"
                      className="mr-2"
                    />
                    <label htmlFor="auto-select" className="text-sm text-gray-700">
                      自动选择最便宜的AI服务
                    </label>
                  </div>
                </div>
              </div>

              <button className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                保存设置
              </button>
            </div>
          )}

          {/* 平台管理 */}
          {activeTab === 'platforms' && (
            <div className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">已绑定平台</h2>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
                    + 添加平台
                  </button>
                </div>
                <div className="text-center py-8 text-gray-500">
                  暂无已绑定的平台账号
                </div>
              </div>
            </div>
          )}

          {/* 账号设置 */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">个人信息</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                    <input
                      type="text"
                      placeholder="请输入用户名"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                    <input
                      type="email"
                      placeholder="请输入邮箱"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                保存设置
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
