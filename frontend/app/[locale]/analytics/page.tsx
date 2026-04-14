/**
 * Analytics Page — Bento Metric Dashboard
 */

'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

const trendData = [
  { name: 'Mon', views: 4500, likes: 320, comments: 45, shares: 12 },
  { name: 'Tue', views: 5200, likes: 380, comments: 52, shares: 18 },
  { name: 'Wed', views: 4800, likes: 350, comments: 48, shares: 15 },
  { name: 'Thu', views: 6100, likes: 420, comments: 58, shares: 22 },
  { name: 'Fri', views: 7500, likes: 510, comments: 72, shares: 28 },
  { name: 'Sat', views: 8900, likes: 580, comments: 85, shares: 35 },
  { name: 'Sun', views: 8200, likes: 540, comments: 78, shares: 31 },
];

const platformData = [
  { name: 'Douyin', value: 45, color: '#6366f1' },
  { name: 'Bilibili', value: 35, color: '#ec4899' },
  { name: 'XHS', value: 20, color: '#f59e0b' },
];

const contentData = [
  { name: 'iPhone 16', views: 8500, likes: 580, platform: 'Douyin' },
  { name: 'Spring Skincare', views: 6200, likes: 420, platform: 'XHS' },
  { name: 'Makeup Tutorial', views: 5800, likes: 390, platform: 'Bilibili' },
  { name: 'Food Guide', views: 4900, likes: 310, platform: 'Douyin' },
  { name: 'Fitness Tips', views: 4200, likes: 280, platform: 'Bilibili' },
];

const metrics = [
  { title: 'Total Views', value: '45.2K', change: '+15.2%', positive: true, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
  { title: 'Total Likes', value: '3.1K', change: '+8.5%', positive: true, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
  { title: 'Comments', value: '438', change: '+22.1%', positive: true, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  { title: 'Shares', value: '161', change: '+5.8%', positive: true, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('week');

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <nav className="h-20" /> {/* spacer */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Analytics</h1>
          <div className="flex gap-1">
            {['today', 'week', 'month'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`pill cursor-pointer ${period === p ? 'pill-active' : ''}`}>
                {p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {metrics.map(m => (
            <div key={m.title} className="bento-card-static">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[var(--color-primary)]">{m.icon}</div>
                <span className="text-xs text-[var(--color-text-muted)]">{m.title}</span>
              </div>
              <p className="text-2xl font-bold num-accent text-[var(--color-text)]">{m.value}</p>
              <p className={`text-xs mt-1 ${m.positive ? 'text-emerald-600' : 'text-red-600'}`}>{m.change}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bento-card-static">
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Trends</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#E5E1F0" /><XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#A5A0D2" /><YAxis tick={{ fontSize: 12 }} stroke="#A5A0D2" /><Tooltip /><Legend /><Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bento-card-static">
            <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Platform Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart><Pie data={platformData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">{platformData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {platformData.map(p => <span key={p.name} className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />{p.name} {p.value}%</span>)}
            </div>
          </div>
        </div>

        {/* Top Content */}
        <div className="bento-card-static">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Top Content</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-[var(--color-border)]">
                {['Content', 'Platform', 'Views', 'Likes', 'Rate'].map(h => <th key={h} className="pb-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>{contentData.map((item, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors">
                  <td className="py-3 text-sm font-medium text-[var(--color-text)]">{item.name}</td>
                  <td className="py-3"><span className="pill text-xs">{item.platform}</span></td>
                  <td className="py-3 text-sm num-accent text-[var(--color-text)]">{item.views.toLocaleString()}</td>
                  <td className="py-3 text-sm num-accent text-[var(--color-text)]">{item.likes.toLocaleString()}</td>
                  <td className="py-3 text-sm num-accent text-emerald-600">{((item.likes / item.views) * 100).toFixed(1)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
