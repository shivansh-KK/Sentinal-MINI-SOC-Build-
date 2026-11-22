import React, { useState, useEffect } from 'react';
import {
  Zap,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Play,
  Lock,
  Layers,
  Clock,
  ArrowRight,
} from 'lucide-react';
import api from '../services/api';
import { ResponseAction } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

export const AutomatedResponsePage: React.FC = () => {
  const [actions, setActions] = useState<ResponseAction[]>([]);
  const [currentMode, setCurrentMode] = useState<string>('simulation');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchResponseData = async () => {
    try {
      const [actRes, modeRes] = await Promise.all([
        api.get('/response/actions?limit=50'),
        api.get('/response/mode'),
      ]);
      setActions(actRes.data);
      setCurrentMode(modeRes.data.current_mode);
    } catch (err) {
      console.error('Error fetching response data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponseData();
  }, []);

  const handleModeChange = async (newMode: string) => {
    if (newMode === 'lab_enforcement') {
      const confirm = window.confirm(
        'WARNING: Lab Enforcement Mode will apply actual system firewall rules (iptables/netsh). Restrict to authorized isolated lab networks only. Proceed?'
      );
      if (!confirm) return;
    }

    try {
      await api.post('/response/mode', { mode: newMode });
      setCurrentMode(newMode);
      setMessage(`Global response mode switched to '${newMode.toUpperCase()}'`);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update response mode');
    }
  };

  const handleApprove = async (actionId: string) => {
    try {
      const res = await api.post(`/response/actions/${actionId}/approve`, { notes: 'Approved by analyst' });
      setActions((prev) => prev.map((a) => (a.action_id === actionId ? res.data : a)));
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleReject = async (actionId: string) => {
    try {
      const res = await api.post(`/response/actions/${actionId}/reject`, { notes: 'Rejected by analyst' });
      setActions((prev) => prev.map((a) => (a.action_id === actionId ? res.data : a)));
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  const handleRollback = async (actionId: string) => {
    try {
      const res = await api.post(`/response/actions/${actionId}/rollback`);
      setActions((prev) => prev.map((a) => (a.action_id === actionId ? res.data : a)));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Rollback failed');
    }
  };

  const pendingApprovals = actions.filter((a) => a.status === 'pending_approval');
  const executedActions = actions.filter((a) => a.status !== 'pending_approval');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>Automated Incident Response (SOAR) Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active incident playbooks, dynamic firewall containment, and rollback audit management
          </p>
        </div>

        {/* Global Response Operating Mode Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-panel">
          {[
            { id: 'simulation', label: 'Simulation' },
            { id: 'approval_required', label: 'Approval Required' },
            { id: 'lab_enforcement', label: 'Lab Enforcement' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                currentMode === mode.id
                  ? mode.id === 'lab_enforcement'
                    ? 'bg-red-500 text-white font-bold shadow-neon-red'
                    : 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-neon-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Mode Advisory Banner */}
      <div
        className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
          currentMode === 'simulation'
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
            : currentMode === 'approval_required'
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            : 'bg-red-500/15 border-red-500/30 text-red-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold uppercase font-mono tracking-wider">
              Active SOAR Policy: {currentMode.replace('_', ' ')}
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {currentMode === 'simulation' && 'Actions are recorded and verified using the Mock Firewall Adapter. Host systems are safely untouched.'}
              {currentMode === 'approval_required' && 'Threat mitigations require explicit analyst authorization before execution.'}
              {currentMode === 'lab_enforcement' && 'Enforcing real OS firewall rules (iptables / netsh) within authorized lab subnets only.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Configured Playbooks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cyan-400 font-bold">PLAYBOOK-01</span>
            <Badge size="sm" variant="cyan">ACTIVE</Badge>
          </div>
          <h3 className="font-bold text-sm text-white">SSH Brute-Force Containment</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically applies DROP rule for source IP exceeding 5 authentication failures in 60s. Temporary 2h block.
          </p>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5 flex justify-between">
            <span>Action: Block IP</span>
            <span className="text-cyan-400">Cooldown: 300s</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cyan-400 font-bold">PLAYBOOK-02</span>
            <Badge size="sm" variant="cyan">ACTIVE</Badge>
          </div>
          <h3 className="font-bold text-sm text-white">Port Reconnaissance Interception</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Detects multi-port service probing and isolates scanner at the network boundary.
          </p>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5 flex justify-between">
            <span>Action: Boundary Block</span>
            <span className="text-cyan-400">Cooldown: 300s</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-cyan-400 font-bold">PLAYBOOK-03</span>
            <Badge size="sm" variant="cyan">ACTIVE</Badge>
          </div>
          <h3 className="font-bold text-sm text-white">Endpoint Threat Quarantine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Marks compromised endpoint under investigation and isolates host from trusted subnet.
          </p>
          <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-white/5 flex justify-between">
            <span>Action: Host Isolation</span>
            <span className="text-cyan-400">Cooldown: 600s</span>
          </div>
        </GlassCard>
      </div>

      {/* Pending Approvals Section (When Approval-Required mode is active) */}
      {pendingApprovals.length > 0 && (
        <GlassCard className="p-5 space-y-4 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Pending Action Approvals ({pendingApprovals.length})</span>
            </h3>
            <span className="text-[11px] font-mono text-amber-400">Analyst Sign-off Required</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-white/5 font-mono text-[11px]">
                  <th className="pb-2">Action ID</th>
                  <th className="pb-2">Action Type</th>
                  <th className="pb-2">Target</th>
                  <th className="pb-2">Trigger Alert</th>
                  <th className="pb-2">Proposed By</th>
                  <th className="pb-2 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {pendingApprovals.map((act) => (
                  <tr key={act.action_id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono text-cyan-300 font-bold">{act.action_id}</td>
                    <td className="py-3 font-mono text-white capitalize">{act.action_type.replace('_', ' ')}</td>
                    <td className="py-3 font-mono text-amber-300 font-bold">{act.target}</td>
                    <td className="py-3 font-mono text-slate-400">{act.triggering_alert_id || 'SOC Rule'}</td>
                    <td className="py-3 text-slate-300">{act.proposed_by}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(act.action_id)}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-semibold"
                        >
                          Approve & Execute
                        </button>
                        <button
                          onClick={() => handleReject(act.action_id)}
                          className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Response Action Execution History & Rollback Controls */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Response Execution History & Rollback Ledger</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Append-Only Audit</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 font-mono text-[11px]">
                <th className="pb-3">Action ID</th>
                <th className="pb-3">Action Type</th>
                <th className="pb-3">Target Asset / IP</th>
                <th className="pb-3">Mode</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Executed At</th>
                <th className="pb-3">Output Result</th>
                <th className="pb-3 text-right">Reversal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {executedActions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No automated responses executed yet
                  </td>
                </tr>
              ) : (
                executedActions.map((act) => (
                  <tr key={act.action_id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono text-cyan-400 font-bold">{act.action_id}</td>
                    <td className="py-3 font-mono text-slate-200 capitalize">{act.action_type.replace('_', ' ')}</td>
                    <td className="py-3 font-mono text-white font-semibold">{act.target}</td>
                    <td className="py-3 font-mono text-slate-400 uppercase text-[10px]">{act.execution_mode}</td>
                    <td className="py-3">
                      <Badge
                        size="sm"
                        variant={
                          act.status === 'executed'
                            ? 'success'
                            : act.status === 'rolled_back'
                            ? 'default'
                            : act.status === 'failed'
                            ? 'critical'
                            : 'warning'
                        }
                      >
                        {act.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-slate-400 text-[11px]">
                      {act.executed_at ? new Date(act.executed_at).toLocaleTimeString() : '—'}
                    </td>
                    <td className="py-3 text-slate-300 font-mono text-[11px] truncate max-w-xs">
                      {act.output_details || 'Recorded'}
                    </td>
                    <td className="py-3 text-right">
                      {act.status === 'executed' && !act.is_reversed ? (
                        <button
                          onClick={() => handleRollback(act.action_id)}
                          className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 font-mono text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Rollback</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500">
                          {act.is_reversed ? 'Reversed' : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
