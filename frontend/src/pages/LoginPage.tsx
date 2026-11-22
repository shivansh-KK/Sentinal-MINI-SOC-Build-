import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { GlassCard } from '../components/common/GlassCard';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('SentinelAdmin2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      const { access_token, role, username: authUser } = res.data;

      login(access_token, {
        id: 1,
        username: authUser,
        email: `${authUser}@sentinel-soc.local`,
        role: role,
        is_active: true,
        created_at: new Date().toISOString(),
      });

      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoUser = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#070a13] relative overflow-hidden">
      {/* Background ambient halos */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <GlassCard glow className="p-8 shadow-2xl border-white/10">
          {/* Logo and title */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-neon-cyan mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              SENTINEL <span className="text-cyan-400">SOC</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">
              Detect • Investigate • Respond • Protect
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username / Analyst ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500"
                  placeholder="analyst"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-neon-cyan transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to SOC Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick Role Demonstration
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectDemoUser('admin', 'SentinelAdmin2026!')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  username === 'admin'
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                    : 'border-white/10 hover:bg-white/5 text-slate-400'
                }`}
              >
                admin
              </button>
              <button
                type="button"
                onClick={() => selectDemoUser('analyst', 'SentinelAnalyst2026!')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  username === 'analyst'
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                    : 'border-white/10 hover:bg-white/5 text-slate-400'
                }`}
              >
                analyst
              </button>
              <button
                type="button"
                onClick={() => selectDemoUser('viewer', 'SentinelViewer2026!')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                  username === 'viewer'
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                    : 'border-white/10 hover:bg-white/5 text-slate-400'
                }`}
              >
                viewer
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
