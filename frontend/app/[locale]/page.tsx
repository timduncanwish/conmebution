/**
 * Home Page - Dashboard
 * Simplified version to debug routing issues
 */

import Navigation from '../components/Navigation';
import Link from 'next/link';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await params;

  const quickActions = [
    {
      title: '创建内容',
      description: '使用AI生成新内容',
      href: '/create',
      icon: '✨',
    },
    {
      title: '内容库',
      description: '查看和管理所有内容',
      href: '/content',
      icon: '📚',
    },
    {
      title: '发布内容',
      description: '分发到多个平台',
      href: '/publish',
      icon: '🚀',
    },
    {
      title: '数据分析',
      description: '查看统计数据和报告',
      href: '/analytics',
      icon: '📊',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              欢迎使用Conmebution
            </h1>
            <p className="mt-2 text-gray-600">
              从提示词到多平台分发的一站式AI内容自动化系统
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={`/${locale}${action.href}`}
                className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{action.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              最近活动
            </h2>
            <div className="text-center py-8 text-gray-500">
              暂无最近活动
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-indigo-600">0</div>
              <div className="text-sm text-gray-600 mt-2">总内容数</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600 mt-2">已发布</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-600">¥0</div>
              <div className="text-sm text-gray-600 mt-2">本月成本</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
