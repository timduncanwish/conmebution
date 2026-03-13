/**
 * 模板库页面
 * 管理和使用内容模板
 */

'use client';

import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'image' | 'video' | 'all';
  prompt: string;
  platforms: string[];
  category: string;
  createdAt: string;
}

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock模板数据
  const templates: Template[] = [
    {
      id: '1',
      name: '产品评测模板',
      description: '用于生成产品评测文案，包含优缺点分析',
      type: 'all',
      prompt: '请为{产品名称}写一篇评测文案，包含以下内容：产品特点、使用体验、优缺点分析、购买建议',
      platforms: ['bilibili', 'xiaohongshu'],
      category: '电商',
      createdAt: '2026-03-10'
    },
    {
      id: '2',
      name: '美妆教程模板',
      description: '美妆教程视频脚本模板',
      type: 'video',
      prompt: '创建一个{化妆主题}教程视频，包含步骤说明和注意事项',
      platforms: ['douyin', 'xiaohongshu'],
      category: '美妆',
      createdAt: '2026-03-09'
    },
    {
      id: '3',
      name: '美食分享模板',
      description: '美食制作分享内容模板',
      type: 'all',
      prompt: '分享{菜品名称}的制作方法，包含食材、步骤和技巧',
      platforms: ['xiaohongshu', 'douyin'],
      category: '美食',
      createdAt: '2026-03-08'
    },
    {
      id: '4',
      name: '科技新闻模板',
      description: '科技资讯报道模板',
      type: 'text',
      prompt: '报道关于{科技主题}的最新消息，分析其影响和意义',
      platforms: ['wechat_mp', 'bilibili'],
      category: '科技',
      createdAt: '2026-03-07'
    }
  ];

  const categories = ['all', '电商', '美妆', '美食', '科技'];

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleUseTemplate = (template: Template) => {
    alert(`使用模板: ${template.name}\n\n提示词: ${template.prompt}\n\n跳转到创建页面...`);
    // 实际应用中应该跳转到创建页面并预填充模板内容
    window.location.href = `/zh/create?template=${template.id}`;
  };

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">模板库</h1>
            <p className="text-gray-600 mt-2">管理和使用内容模板，提高创作效率</p>
          </div>
          <button
            onClick={handleCreateTemplate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + 创建模板
          </button>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex space-x-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? '全部' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                  {template.category}
                </span>
              </div>

              {/* Template Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">类型:</span>
                  <span>
                    {template.type === 'all' ? '全部' :
                     template.type === 'text' ? '文本' :
                     template.type === 'image' ? '图片' : '视频'}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">平台:</span>
                  <div className="flex flex-wrap gap-1">
                    {template.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {platform === 'bilibili' ? 'B站' :
                         platform === 'douyin' ? '抖音' :
                         platform === 'xiaohongshu' ? '小红书' :
                         platform === 'wechat_mp' ? '公众号' : platform}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prompt Preview */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {template.prompt}
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  使用模板
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  编辑
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
              <h2 className="text-2xl font-bold mb-4">创建新模板</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    模板名称
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="例如：产品评测模板"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="模板的用途说明"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    提示词模板
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                    placeholder="使用{变量名}来表示可替换的部分，例如：为{产品名称}写一篇评测..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      内容类型
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="all">全部</option>
                      <option value="text">文本</option>
                      <option value="image">图片</option>
                      <option value="video">视频</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      分类
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="电商">电商</option>
                      <option value="美妆">美妆</option>
                      <option value="美食">美食</option>
                      <option value="科技">科技</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  创建模板
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 模板使用技巧</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 使用 <code className="bg-blue-100 px-1 rounded">{'{'}变量名{'}'}</code> 来表示可替换的内容</li>
            <li>• 模板可以预设目标平台，自动适配格式</li>
            <li>• 点击"使用模板"会自动跳转到创建页面并预填充内容</li>
            <li>• 建议为常用的内容类型创建模板，提高效率</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
