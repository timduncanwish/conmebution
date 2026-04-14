/**
 * Login Page — Centered Bento Card
 */

'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authApi, setToken } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'zh';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = isLogin
        ? await authApi.login(email, password)
        : await authApi.register(email, password, name);
      if (result.success && result.data.token) {
        setToken(result.data.token);
        router.push(`/${locale}`);
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-12">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[var(--color-primary)]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Conmebution</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {locale === 'zh' ? 'AI 内容自动化创作平台' : 'AI Content Automation Platform'}
          </p>
        </div>

        {/* Card */}
        <div className="bento-card-static">
          <div className="flex gap-1 mb-6">
            <button onClick={() => { setIsLogin(true); setError(''); }} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${isLogin ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}>
              {locale === 'zh' ? '登录' : 'Login'}
            </button>
            <button onClick={() => { setIsLogin(false); setError(''); }} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${!isLogin ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]'}`}>
              {locale === 'zh' ? '注册' : 'Register'}
            </button>
          </div>

          {error && (
            <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl mb-4"><p className="text-sm text-red-600">{error}</p></div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder={locale === 'zh' ? '你的名字' : 'Your name'} />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder={locale === 'zh' ? '至少6位' : 'At least 6 characters'} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 transition-colors cursor-pointer">
              {loading ? (locale === 'zh' ? '请稍候...' : 'Please wait...') : isLogin ? (locale === 'zh' ? '登录' : 'Login') : (locale === 'zh' ? '注册' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
