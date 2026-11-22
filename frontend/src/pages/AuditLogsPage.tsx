import React, { useState, useEffect } from 'react';
import { ScrollText, Search, Filter, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import api from '../services/api';
import { AuditLog } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const fetchAuditLogs = async () => {
    try {
      let url = '/audit-logs?limit=100';
      if (outcomeFilter !== 'all') url += `&outcome=${outcomeFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get(url);
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [outcomeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-cyan-400" />
            <span>Immutable Governance & System Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamper-resistant append-only operational log of all analyst actions, authorizations, and rule edits
          </p>
        </div>
      </div>

      <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search actor, action, resource, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAuditLogs()}
            className="w-full glass-input text-xs rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'success', 'failure', 'denied'].map((oc) => (
            <button
              key={oc}
              onClick={() => setOutcomeFilter(oc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase transition-all ${
                outcomeFilter === oc
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {oc}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 font-mono text-[11px]">
                <th className="pb-3">Timestamp (UTC)</th>
                <th className="pb-3">Actor / Principal</th>
                <th className="pb-3">Action Type</th>
                <th className="pb-3">Resource Target</th>
                <th className="pb-3">Outcome</th>
                <th className="pb-3">Operational Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit records matching query
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono font-semibold text-cyan-300">
                      {log.actor}
                    </td>
                    <td className="py-3 font-mono text-white font-medium">
                      {log.action}
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {log.resource_type} {log.resource_id ? `(${log.resource_id})` : ''}
                    </td>
                    <td className="py-3">
                      <Badge
                        size="sm"
                        variant={
                          log.outcome === 'success'
                            ? 'success'
                            : log.outcome === 'denied'
                            ? 'warning'
                            : 'critical'
                        }
                      >
                        {log.outcome}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-300 text-[11px] truncate max-w-md">
                      {log.details || '—'}
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
