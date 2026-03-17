/**
 * 数据分析页面 - 增强版
 * 展示内容在各平台的表现数据，包含丰富的数据可视化和导出功能
 */

'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// 颜色配置
const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

// 类型定义
interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: string;
}

interface ChartData {
  name: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

interface PlatformData {
  name: string;
  value: number;
  color: string;
}

interface ContentData {
  name: string;
  views: number;
  likes: number;
  platform: string;
}

// 指标卡片组件
function MetricCard({ title, value, change, icon }: MetricCardProps) {
  const isPositive = change.startsWith('+');

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className={`text-sm mt-2 flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '↑' : '↓'} {change}
            <span className="text-gray-500 ml-1">vs 上期</span>
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

// 主页面组件
export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedChartType, setSelectedChartType] = useState('line');
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');

  // 模拟数据 - 趋势数据
  const trendData: ChartData[] = [
    { name: '周一', views: 4500, likes: 320, comments: 45, shares: 12 },
    { name: '周二', views: 5200, likes: 380, comments: 52, shares: 18 },
    { name: '周三', views: 4800, likes: 350, comments: 48, shares: 15 },
    { name: '周四', views: 6100, likes: 420, comments: 58, shares: 22 },
    { name: '周五', views: 7500, likes: 510, comments: 72, shares: 28 },
    { name: '周六', views: 8900, likes: 580, comments: 85, shares: 35 },
    { name: '周日', views: 8200, likes: 540, comments: 78, shares: 31 },
  ];

  // 平台分布数据
  const platformData: PlatformData[] = [
    { name: '抖音', value: 45, color: '#6366f1' },
    { name: 'B站', value: 35, color: '#ec4899' },
    { name: '小红书', value: 20, color: '#f59e0b' },
  ];

  // 内容排行数据
  const contentData: ContentData[] = [
    { name: 'iPhone 16评测', views: 8500, likes: 580, platform: '抖音' },
    { name: '春季护肤科普', views: 6200, likes: 420, platform: '小红书' },
    { name: '美妆教程', views: 5800, likes: 390, platform: 'B站' },
    { name: '美食推荐', views: 4900, likes: 310, platform: '抖音' },
    { name: '健身指南', views: 4200, likes: 280, platform: 'B站' },
  ];

  // 核心指标
  const metrics = [
    { title: '总浏览量', value: '45.2K', change: '+15.2%', icon: '👁️' },
    { title: '总点赞数', value: '3.1K', change: '+8.5%', icon: '👍' },
    { title: '总评论数', value: '438', change: '+22.1%', icon: '💬' },
    { title: '总转发数', value: '161', change: '+5.8%', icon: '🔄' },
  ];

  // 数据导出处理
  const handleExport = async () => {
    setLoading(true);

    try {
      // 模拟导出过程
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 生成CSV数据
      const csvHeaders = ['日期', '浏览量', '点赞数', '评论数', '转发数'];
      const csvData = trendData.map(d => [
        d.name,
        d.views.toString(),
        d.likes.toString(),
        d.comments.toString(),
        d.shares.toString()
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('报告导出成功！');
    } catch (error) {
      alert('导出失败，请重试');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 自定义报表生成
  const handleGenerateReport = () => {
    const reportConfig = {
      period: selectedPeriod,
      chartType: selectedChartType,
      metrics: ['views', 'likes', 'comments', 'shares'],
      platforms: ['douyin', 'bilibili', 'xiaohongshu']
    };

    console.log('生成报表配置:', reportConfig);
    alert('自定义报表已生成！配置已保存到控制台');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 数据分析中心</h1>
            <p className="text-gray-600 mt-2">全面掌握您的内容在各平台的表现数据</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleGenerateReport}
              className="bg-white text-indigo-600 border border-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              生成报表
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? '导出中...' : '📥 导出报告'}
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex space-x-2">
              {['today', 'week', 'month'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedPeriod === period
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period === 'today' ? '今日' : period === 'week' ? '本周' : '本月'}
                </button>
              ))}
            </div>

            {/* Chart Type Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">图表类型:</span>
              <select
                value={selectedChartType}
                onChange={(e) => setSelectedChartType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="line">折线图</option>
                <option value="bar">柱状图</option>
                <option value="area">面积图</option>
              </select>
            </div>

            {/* Export Format Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">导出格式:</span>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">数据趋势</h2>
              <div className="flex space-x-4 text-sm">
                <span className="flex items-center">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></span>
                  浏览
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 bg-pink-500 rounded-full mr-1"></span>
                  点赞
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              {selectedChartType === 'line' ? (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} />
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              ) : selectedChartType === 'bar' ? (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#6366f1" />
                  <Bar dataKey="likes" fill="#ec4899" />
                </BarChart>
              ) : (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="#6366f1" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Platform Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">平台分布</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {platformData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    {item.name}
                  </span>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Ranking */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🏆 内容排行 (浏览量 TOP 5)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={contentData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#6366f1" name="浏览量" />
              <Bar dataKey="likes" fill="#ec4899" name="点赞数" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Stats Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">📋 详细数据表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    内容名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    平台
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    浏览量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    点赞数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    互动率
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contentData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {item.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.likes.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {((item.likes / item.views) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 数据洞察</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 本周浏览量较上周增长 <strong>15.2%</strong>，表现优秀</li>
            <li>• 抖音平台贡献了 <strong>45%</strong> 的总浏览量，是主要流量来源</li>
            <li>• 周末时段互动率最高，建议在此时段发布内容</li>
            <li>• 视频类内容的平均互动率比图文类高 <strong>2.3倍</strong></li>
          </ul>
        </div>

        {/* Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ 注意：</strong>当前显示的是模拟数据。要查看真实数据，请先配置平台API凭证并发布内容。
            系统会自动同步各平台的真实统计数据。
          </p>
        </div>
      </div>
    </div>
  );
}
