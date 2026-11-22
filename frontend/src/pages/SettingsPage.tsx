import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Users,
  Server,
  CheckCircle2,
  AlertCircle,
  Copy,
  Plus,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const [settingsData, setSettingsData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [wazuhUrl, setWazuhUrl] = useState('');
  const [wazuhUser, setWazuhUser] = useState('');
  const [wazuhEnabled, setWazuhEnabled] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const [sRes, uRes, kRes] = await Promise.all([
        api.get('/settings'),
        api.get('/settings/users'),
        api.get('/settings/api-keys'),
      ]);
      setSettingsData(sRes.data);
      setUsers(uRes.data);
      setApiKeys(kRes.data);
      setWazuhUrl(sRes.data.wazuh.api_url);
      setWazuhUser(sRes.data.wazuh.username);
      setWazuhEnabled(sRes.data.wazuh.enabled);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveWazuh = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/wazuh', {
        enabled: wazuhEnabled,
        api_url: wazuhUrl,
        username: wazuhUser,
      });
      setStatusMsg('Wazuh connector configuration updated successfully.');
      setTimeout(() => setStatusMsg(null), 4000);
      fetchSettings();
    } catch (err) {
      console.error('Save Wazuh failed:', err);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const res = await api.post(`/settings/api-keys?name=${encodeURIComponent(newKeyName)}&role=agent`);
      setGeneratedKey(res.data);
      setNewKeyName('');
      fetchSettings();
    } catch (err) {
      console.error('Key generation failed:', err);
    }
  };

  const handleCopyKey = () => {
    if (generatedKey?.api_key) {
      navigator.clipboard.writeText(generatedKey.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Platform Settings & Integration Connectors</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage external SIEM connectors, API agent credentials, and role-based access control
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wazuh SIEM Connector Card */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                External Wazuh SIEM Connector
              </h2>
            </div>
            <Badge variant={wazuhEnabled ? 'cyan' : 'default'} size="sm">
              {wazuhEnabled ? 'READY / CONFIGURED' : 'STANDALONE MODE'}
            </Badge>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Connect an external Wazuh SIEM manager to stream Wazuh alerts into SENTINEL SOC. The platform operates independently in full standalone mode when Wazuh is unconfigured.
          </p>

          <form onSubmit={handleSaveWazuh} className="space-y-4 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <input
                type="checkbox"
                id="wazuhToggle"
                checked={wazuhEnabled}
                onChange={(e) => setWazuhEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-transparent border-white/20"
              />
              <label htmlFor="wazuhToggle" className="font-semibold text-slate-200 cursor-pointer">
                Enable Wazuh Alert Stream Connector
              </label>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono">Wazuh Manager API URL</label>
              <input
                type="text"
                value={wazuhUrl}
                onChange={(e) => setWazuhUrl(e.target.value)}
                placeholder="https://192.168.1.100:55000"
                className="w-full glass-input rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-mono">API Username</label>
              <input
                type="text"
                value={wazuhUser}
                onChange={(e) => setWazuhUser(e.target.value)}
                placeholder="wazuh"
                className="w-full glass-input rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-semibold transition-all"
            >
              Update Wazuh Configuration
            </button>
          </form>
        </GlassCard>

        {/* API Keys for Endpoint Agents */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Agent API Ingestion Keys
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{apiKeys.length} Registered</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Generate cryptographically hashed API keys for lightweight Python endpoint agents to submit logs to <code>/api/v1/events/ingest</code>.
          </p>

          <form onSubmit={handleGenerateKey} className="flex gap-2 text-xs">
            <input
              type="text"
              placeholder="Key description (e.g. Ubuntu-Lab-Agent)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 glass-input rounded-xl px-3 py-2 text-slate-200"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Key</span>
            </button>
          </form>

          {generatedKey && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-2 text-xs">
              <span className="font-bold text-cyan-300 block">New API Secret (Copy Now - Not Stored in Plaintext):</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-white p-2 rounded bg-black/60 break-all select-all">
                  {generatedKey.api_key}
                </code>
                <button
                  onClick={handleCopyKey}
                  className="p-2 rounded bg-cyan-500 text-slate-950 font-bold"
                  title="Copy Key"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && <span className="text-emerald-400 text-[11px]">Copied to clipboard!</span>}
            </div>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {apiKeys.map((k) => (
              <div
                key={k.key_id}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-slate-200 font-bold">{k.name}</span>
                  <span className="text-slate-500 block text-[10px]">{k.key_id} • Prefix: {k.prefix}...</span>
                </div>
                <Badge size="sm" variant="success">ACTIVE</Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Users & Role-Based Access Table */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Analyst Role-Based Access Control
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">{users.length} Active Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 font-mono text-[11px]">
                <th className="pb-3">Analyst ID</th>
                <th className="pb-3">Full Name / Description</th>
                <th className="pb-3">Email Address</th>
                <th className="pb-3">Access Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-mono text-cyan-300 font-bold">{u.username}</td>
                  <td className="py-3 text-slate-200 font-medium">{u.full_name || '—'}</td>
                  <td className="py-3 font-mono text-slate-400">{u.email}</td>
                  <td className="py-3">
                    <Badge
                      size="sm"
                      variant={u.role === 'admin' ? 'critical' : u.role === 'analyst' ? 'cyan' : 'default'}
                    >
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-400 text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
