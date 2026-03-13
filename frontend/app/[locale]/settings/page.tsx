/**
 * 设置页面
 * AI服务配置和平台管理
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Navigation from '../../components/Navigation';
import api from '../../lib/api';

interface AIServiceConfig {
  provider: string;
  apiKey: string;
  status: 'connected' | 'disconnected' | 'testing';
  priority: number;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [activeTab, setActiveTab] = useState<'ai' | 'platforms' | 'account'>('ai');

  // AI服务配置状态
  const [aiServices, setAiServices] = useState<AIServiceConfig[]>([
    { provider: 'glm-4', apiKey: '', status: 'disconnected', priority: 1 },
    { provider: 'gpt-4', apiKey: '', status: 'disconnected', priority: 2 },
    { provider: 'gemini-pro', apiKey: '', status: 'disconnected', priority: 3 },
  ]);

  const [monthlyBudget, setMonthlyBudget] = useState(500);
  const [autoSelect, setAutoSelect] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  // 从localStorage加载保存的配置
  useEffect(() => {
    loadSavedConfig();
  }, []);

  const loadSavedConfig = () => {
    const savedKeys = localStorage.getItem('ai_service_keys');
    if (savedKeys) {
      const keys = JSON.parse(savedKeys);
      setAiServices(prev => prev.map(service => ({
        ...service,
        apiKey: keys[service.provider] || '',
        status: keys[service.provider] ? 'connected' : 'disconnected'
      })));
    }

    const budget = localStorage.getItem('monthly_budget');
    if (budget) {
      setMonthlyBudget(JSON.parse(budget));
    }

    const autoSelectSaved = localStorage.getItem('auto_select_cheapest');
    if (autoSelectSaved) {
      setAutoSelect(JSON.parse(autoSelectSaved));
    }
  };

  const testConnection = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      alert('请先输入API密钥');
      return;
    }

    // 更新状态为测试中
    setAiServices(prev => prev.map(s =>
      s.provider === provider ? { ...s, status: 'testing' } : s
    ));

    try {
      // 使用API测试连接
      const response = await api.generateTextSync('测试连接', provider as any);

      if (response.success) {
        setAiServices(prev => prev.map(s =>
          s.provider === provider ? { ...s, status: 'connected' } : s
        ));
        alert(`${provider} 连接成功！`);
      } else {
        throw new Error(response.error?.message || '连接失败');
      }
    } catch (error: any) {
      console.error('连接测试失败:', error);
      setAiServices(prev => prev.map(s =>
        s.provider === provider ? { ...s, status: 'disconnected' } : s
      ));
      alert(`${provider} 连接失败: ${error.message}`);
    }
  };

  const saveConfig = () => {
    // 保存API密钥
    const keysToSave: any = {};
    aiServices.forEach(service => {
      if (service.apiKey.trim()) {
        keysToSave[service.provider] = service.apiKey;
      }
    });

    localStorage.setItem('ai_service_keys', JSON.stringify(keysToSave));
    localStorage.setItem('monthly_budget', JSON.stringify(monthlyBudget));
    localStorage.setItem('auto_select_cheapest', JSON.stringify(autoSelect));

    setSaveMessage('✅ 设置已保存！');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const getProviderName = (provider: string) => {
    const names: any = {
      'glm-4': 'GLM-4.7 (智谱AI)',
      'gpt-4': 'OpenAI GPT-4',
      'gemini-pro': 'Google Gemini Pro'
    };
    return names[provider] || provider;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '已连接';
      case 'testing': return '测试中...';
      default: return '未连接';
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
              {saveMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">{saveMessage}</p>
                </div>
              )}

              {aiServices.map((service) => (
                <div key={service.provider} className="bg-white shadow-sm rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getProviderName(service.provider)}
                      <span className="ml-2 text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                        优先级 {service.priority}
                      </span>
                    </h2>
                    <div className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                      {getStatusText(service.status)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API密钥
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={service.apiKey}
                          onChange={(e) => setAiServices(prev => prev.map(s =>
                            s.provider === service.provider ? { ...s, apiKey: e.target.value } : s
                          ))}
                          placeholder="sk-xxxxxxxxxxxxx"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          onClick={() => {
                            if (service.apiKey) {
                              navigator.clipboard.writeText(service.apiKey);
                              alert('密钥已复制到剪贴板');
                            }
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                          disabled={!service.apiKey}
                        >
                          复制
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {service.provider === 'glm-4' && '获取地址: https://open.bigmodel.cn/'}
                        {service.provider === 'gpt-4' && '获取地址: https://platform.openai.com/'}
                        {service.provider === 'gemini-pro' && '获取地址: https://aistudio.google.com/'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">当前状态</div>
                        <div className={`mt-1 ${getStatusColor(service.status)}`}>
                          {getStatusText(service.status)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => testConnection(service.provider, service.apiKey)}
                          disabled={service.status === 'testing' || !service.apiKey}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                        >
                          {service.status === 'testing' ? '测试中...' : '测试连接'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('确定要清除这个API密钥吗？')) {
                              setAiServices(prev => prev.map(s =>
                                s.provider === service.provider ? { ...s, apiKey: '', status: 'disconnected' as any } : s
                              ));
                            }
                          }}
                          className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm"
                          disabled={!service.apiKey}
                        >
                          清除密钥
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* 成本控制 */}
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 成本控制</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      月度预算上限 (USD)
                    </label>
                    <input
                      type="number"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">建议设置: $10-100/月</p>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto-select"
                      checked={autoSelect}
                      onChange={(e) => setAutoSelect(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="auto-select" className="text-sm text-gray-700">
                      自动选择最便宜的AI服务
                    </label>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">💡 成本优化建议</h3>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• GLM-4: 性价比最高，中文支持最好</li>
                      <li>• GPT-4: 质量最高，适合英文内容</li>
                      <li>• Gemini Pro: 多语言支持强</li>
                      <li>• 建议使用月度预算避免超支</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 保存按钮 */}
              <button
                onClick={saveConfig}
                className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                💾 保存所有设置
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
