import React, { useState, useEffect } from 'react';
import {
  Network,
  Activity,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Search,
  Layers,
  Globe,
  Radio,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

export const NetworkPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const [ovRes, connRes] = await Promise.all([
          api.get('/network/overview'),
          api.get('/network/connections?limit=30'),
        ]);
        setOverview(ovRes.data);
        setConnections(connRes.data);
      } catch (err) {
        console.error('Error fetching network telemetry:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNetwork();
  }, []);

  const protocolColors = ['#00f0ff', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>Network Traffic & Reconnaissance Visibility</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time port probes, protocol distribution, and suspicious connection flows
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Destination Ports Bar Chart */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Targeted Ports Distribution
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">Service Probes</span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={overview?.top_ports?.map((p: any) => ({ port: `Port ${p.port}`, count: p.count })) || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="port" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel p-2 rounded-xl text-xs text-white">
                          <p className="font-bold text-cyan-300">{label}</p>
                          <p>Probe Count: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#00f0ff" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Top Attacker IPs */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Top Source Attacker IPs
            </h3>
            <span className="text-[10px] text-amber-400 font-mono">Frequency</span>
          </div>

          <div className="space-y-3 my-auto">
            {overview?.top_sources?.map((s: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-300 font-semibold">{s.ip}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]"
                      style={{ width: `${Math.min(100, s.count * 15)}%` }}
                    />
                  </div>
                  <span className="text-white font-bold w-6 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Protocol Distribution Donut */}
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Protocol Distribution
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Layer 4</span>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overview?.protocols || [{ protocol: 'TCP', count: 100 }]}
                  dataKey="count"
                  nameKey="protocol"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                >
                  {overview?.protocols?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={protocolColors[index % protocolColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel p-2 rounded-xl text-xs text-white">
                          <p className="font-bold text-cyan-300">{payload[0].name}</p>
                          <p>Connections: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Network Connection Flows Table */}
      <GlassCard className="p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Observed Network Connection Probes</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-white/10 font-mono text-[11px]">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Source IP & Port</th>
                <th className="pb-3">Destination IP & Port</th>
                <th className="pb-3">Protocol</th>
                <th className="pb-3">Target Host</th>
                <th className="pb-3">Telemetry Flow Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {connections.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 font-mono text-[11px] text-slate-400">
                    {new Date(c.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 font-mono text-cyan-300">
                    {c.source_ip || '192.168.56.x'}:{c.source_port || 'ephemeral'}
                  </td>
                  <td className="py-2.5 font-mono text-slate-200">
                    {c.destination_ip || '192.168.56.10'}:{c.destination_port || '22'}
                  </td>
                  <td className="py-2.5 font-mono text-emerald-400 font-semibold">{c.protocol}</td>
                  <td className="py-2.5 text-slate-300">{c.hostname}</td>
                  <td className="py-2.5 text-slate-400 truncate max-w-sm">{c.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
