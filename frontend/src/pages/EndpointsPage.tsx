import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Search,
  Activity,
  ShieldAlert,
  Clock,
  HardDrive,
  Cpu,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import api from '../services/api';
import { Endpoint } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { SlideOverDrawer } from '../components/common/SlideOverDrawer';

export const EndpointsPage: React.FC = () => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpointDetails, setSelectedEndpointDetails] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchEndpoints = async () => {
    try {
      let url = '/endpoints?limit=50';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await api.get(url);
      setEndpoints(res.data);
    } catch (err) {
      console.error('Error fetching endpoints:', err);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, [statusFilter]);

  const openEndpointDetails = async (endpointId: number) => {
    try {
      const res = await api.get(`/endpoints/${endpointId}`);
      setSelectedEndpointDetails(res.data);
    } catch (err) {
      console.error('Error fetching endpoint details:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Laptop className="w-5 h-5 text-blue-400" />
            <span>Endpoint Asset Inventory & Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time health, posture, and detection telemetry from connected laboratory nodes
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hostname, IP address, OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchEndpoints()}
            className="w-full glass-input text-xs rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'online', 'warning', 'under_investigation', 'offline'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Endpoint Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {endpoints.map((ep) => (
          <GlassCard
            key={ep.id}
            hover
            onClick={() => openEndpointDetails(ep.id)}
            className="p-5 flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{ep.hostname}</h3>
                  <span className="font-mono text-xs text-cyan-300">{ep.ip_address}</span>
                </div>
              </div>
              <Badge
                size="sm"
                variant={
                  ep.status === 'online'
                    ? 'success'
                    : ep.status === 'warning'
                    ? 'warning'
                    : ep.status === 'under_investigation'
                    ? 'critical'
                    : 'default'
                }
              >
                {ep.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-2 text-xs border-t border-b border-white/5 py-3">
              <div className="flex justify-between text-slate-400">
                <span>Operating System:</span>
                <span className="text-slate-200 font-medium truncate max-w-[140px]">{ep.os_version}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono">
                <span>Agent Version:</span>
                <span className="text-cyan-400">v{ep.agent_version}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono">
                <span>Active Threat Alerts:</span>
                <span className="text-amber-400 font-bold">{ep.alert_count}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 font-mono">Risk Posture Score</span>
                <span className={`font-mono font-bold ${ep.risk_score > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {ep.risk_score}/100
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    ep.risk_score > 70 ? 'bg-red-500' : ep.risk_score > 40 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${ep.risk_score}%` }}
                />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* SlideOver Drawer for Endpoint Telemetry */}
      <SlideOverDrawer
        isOpen={!!selectedEndpointDetails}
        onClose={() => setSelectedEndpointDetails(null)}
        title={`Endpoint Telemetry: ${selectedEndpointDetails?.endpoint?.hostname}`}
        subtitle={`IP: ${selectedEndpointDetails?.endpoint?.ip_address} • OS: ${selectedEndpointDetails?.endpoint?.os_version}`}
        width="max-w-2xl"
      >
        {selectedEndpointDetails && (
          <div className="space-y-6 text-xs">
            {/* Quick Status Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <span className="text-slate-400 font-mono block mb-1">Status</span>
                <Badge variant={selectedEndpointDetails.endpoint.status === 'online' ? 'success' : 'warning'}>
                  {selectedEndpointDetails.endpoint.status.toUpperCase()}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <span className="text-slate-400 font-mono block mb-1">Risk Rating</span>
                <span className="text-lg font-bold font-mono text-cyan-300">
                  {selectedEndpointDetails.endpoint.risk_score} / 100
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <span className="text-slate-400 font-mono block mb-1">Total Alerts</span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  {selectedEndpointDetails.endpoint.alert_count}
                </span>
              </div>
            </div>

            {/* Recent Endpoint Security Alerts */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Associated Threat Detections
              </span>
              <div className="space-y-2">
                {selectedEndpointDetails.recent_alerts?.length === 0 ? (
                  <p className="text-slate-500 py-3 text-center">No security alerts associated with this host</p>
                ) : (
                  selectedEndpointDetails.recent_alerts?.map((al: any) => (
                    <div
                      key={al.alert_id}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{al.title}</div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          Source: {al.source_ip || 'Internal'} • {new Date(al.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <Badge size="sm" variant={al.severity as any}>
                        {al.severity}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Endpoint Telemetry Events */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Recent Ingested Logs
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedEndpointDetails.recent_events?.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-cyan-400">{ev.event_type}</span>
                      <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 truncate">{ev.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};
