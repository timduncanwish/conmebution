/**
 * 数据分析页面
 * 展示内容在各平台的表现数据
 */

'use client';

import { useState, useEffect } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
}

function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const isPositive = change.startsWith('+');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <p className={`text-sm mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change}
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

interface PlatformDistributionProps {
  platform: string;
  percentage: number;
  color: string;
}

function PlatformDistribution({ platform, percentage, color }: PlatformDistributionProps) {
  const barWidth = `${percentage}%`;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{platform}</span>
        <span className="text-gray-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: barWidth }}
        />
      </div>
    </div>
  );
}

interface ContentItemProps {
  id: string;
  title: string;
  type: string;
  views: string;
  date: string;
}

function ContentItem({ title, type, views, date }: ContentItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow mb-3">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{type}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{views}</p>
        <p className="text-sm text-gray-600">{date}</p>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(false);

  // Mock data - 在实际应用中应该从API获取
  const metrics = [
    { title: '总浏览', value: '12.5K', change: '+15%', icon: '👁️' },
    { title: '总点赞', value: '3.2K', change: '+8%', icon: '👍' },
    { title: '总评论', value: '856', change: '+22%', icon: '💬' },
    { title: '总转发', value: '423', change: '+5%', icon: '🔄' },
  ];

  const platformData = [
    { platform: '抖音', percentage: 45, color: 'bg-blue-500' },
    { platform: 'B站', percentage: 35, color: 'bg-pink-500' },
    { platform: '小红书', percentage: 20, color: 'bg-red-500' },
  ];

  const topContents = [
    { id: '1', title: '🎬 iPhone 16产品介绍', type: '类型: 视频 | 时长: 15秒', views: '8.5K浏览', date: '2025-03-09' },
    { id: '2', title: '📝 春季护肤知识科普', type: '类型: 图文 | 字数: 520', views: '3.2K浏览', date: '2025-03-08' },
    { id: '3', title: '🎬 美妆教程短视频', type: '类型: 视频 | 时长: 30秒', views: '2.1K浏览', date: '2025-03-07' },
  ];

  const handleExportReport = async () => {
    setLoading(true);
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    alert('报告导出成功！');
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    // 在实际应用中，这里会重新获取数据
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">数据分析</h1>
            <p className="text-gray-600 mt-2">查看您的内容在各平台的表现</p>
          </div>
          <button
            onClick={handleExportReport}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? '导出中...' : '导出报告'}
          </button>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex space-x-4">
            {['today', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-4 py-2 rounded-lg ${
                  selectedPeriod === period
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period === 'today' ? '今日' : period === 'week' ? '本周' : '本月'}
              </button>
            ))}
          </div>
        </div>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              icon={metric.icon}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">平台分布</h2>
            {platformData.map((data) => (
              <PlatformDistribution
                key={data.platform}
                platform={data.platform}
                percentage={data.percentage}
                color={data.color}
              />
            ))}
          </div>

          {/* Trend Chart Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">趋势图</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">趋势图表</p>
              <p className="text-gray-400 text-sm ml-2">(数据可视化组件待集成)</p>
            </div>
            <div className="mt-4 text-center text-sm text-gray-600">
              <p>一 二 三 四 五 六 日</p>
            </div>
          </div>
        </div>

        {/* Top Content */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">内容排行 (浏览量)</h2>
          {topContents.map((content) => (
            <ContentItem
              key={content.id}
              title={content.title}
              type={content.type}
              views={content.views}
              date={content.date}
            />
          ))}
        </div>

        {/* Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>提示：</strong>当前显示的是模拟数据。要查看真实数据，请先配置平台API凭证并发布内容。
          </p>
        </div>
      </div>
    </div>
  );
}
