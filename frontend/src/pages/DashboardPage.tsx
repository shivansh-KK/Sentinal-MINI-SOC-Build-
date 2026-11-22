import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Flame,
  Radio,
  Laptop,
  Zap,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';
import { DashboardSummary } from '../types';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';
import { SplineTimeChart } from '../components/common/SplineTimeChart';
import { DualBarChart } from '../components/common/DualBarChart';
import { RadialGauge } from '../components/common/RadialGauge';
import { ThreatHeatmap } from '../components/common/ThreatHeatmap';
import { useWebSocket } from '../contexts/WebSocketContext';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<number>(24);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [sumRes, trendRes, distRes, evRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get(`/dashboard/trends?range_hours=${timeRange}`),
        api.get('/dashboard/distribution'),
        api.get('/events?limit=7'),
      ]);
      setSummary(sumRes.data);
      setTrends(trendRes.data);
      setDistributions(distRes.data);
      setRecentEvents(evRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  // Handle incoming live websocket updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'NEW_EVENT') {
        setRecentEvents((prev) => [lastMessage.data, ...prev.slice(0, 6)]);
        setSummary((prev) => prev ? { ...prev, total_events: prev.total_events + 1 } : prev);
      } else if (lastMessage.type === 'NEW_ALERT') {
        setSummary((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            total_alerts: prev.total_alerts + 1,
            critical_alerts: lastMessage.data.severity === 'critical' ? prev.critical_alerts + 1 : prev.critical_alerts,
            high_alerts: lastMessage.data.severity === 'high' ? prev.high_alerts + 1 : prev.high_alerts,
          };
        });
      }
    }
  }, [lastMessage]);

  const dualBarSampleData = [
    { label: 'Mon', val1: 45, val2: 12 },
    { label: 'Tue', val1: 68, val2: 24 },
    { label: 'Wed', val1: 52, val2: 18 },
    { label: 'Thu', val1: 74, val2: 30 },
    { label: 'Fri', val1: 60, val2: 22 },
    { label: 'Sat', val1: 35, val2: 8 },
    { label: 'Sun', val1: 82, val2: 36 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. TOP STATS KPI CARDS (From Reference Image 2) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* KPI 1 */}
        <GlassCard hover className="p-4" onClick={() => navigate('/app/events')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Events
            </span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {summary ? summary.total_events.toLocaleString() : '...'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +8.4%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Live ingestion telemetry</span>
        </GlassCard>

        {/* KPI 2 */}
        <GlassCard hover className="p-4" onClick={() => navigate('/app/alerts')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Threat Alerts
            </span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {summary ? summary.total_alerts : '...'}
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
              {summary ? `${summary.critical_alerts} crit` : '0'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Rule detections</span>
        </GlassCard>

        {/* KPI 3 */}
        <GlassCard hover className="p-4" onClick={() => navigate('/app/incidents')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Incidents
            </span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {summary ? summary.active_incidents : '...'}
            </span>
            <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
              Prioritized
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Correlated incidents</span>
        </GlassCard>

        {/* KPI 4 */}
        <GlassCard hover className="p-4" onClick={() => navigate('/app/endpoints')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Endpoints
            </span>
            <Laptop className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {summary ? `${summary.online_endpoints}/${summary.monitored_endpoints}` : '...'}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Online
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Monitored lab assets</span>
        </GlassCard>

        {/* KPI 5 */}
        <GlassCard hover className="p-4" onClick={() => navigate('/app/response')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Responses Run
            </span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {summary ? summary.responses_executed : '...'}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
              Mitigations
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Playbooks triggered</span>
        </GlassCard>

        {/* KPI 6 */}
        <GlassCard hover className="p-4" onClick={() => navigate('/app/response')}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Approvals
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-white font-mono">
              {summary ? summary.pending_approvals : '0'}
            </span>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              Pending
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Analyst authorizations</span>
        </GlassCard>
      </div>

      {/* 2. MAIN TIME SERIES SPLINE CHART (From Reference Image 1 & 2) */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Threat Activity & Telemetry Ingestion Trends</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual spline monitoring: Security Alerts (Electric Cyan) vs Ingested Telemetry (Silver Curve)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { label: '1 Hour', hours: 1 },
              { label: '24 Hours', hours: 24 },
              { label: '7 Days', hours: 168 },
            ].map((btn) => (
              <button
                key={btn.hours}
                onClick={() => setTimeRange(btn.hours)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                  timeRange === btn.hours
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-neon-cyan'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <SplineTimeChart data={trends} height={280} showComparison={true} />
      </GlassCard>

      {/* 3. MULTI-WIDGET ROW: ALLOCATION BARS + RADIAL DIALS + ATTACK MATRIX (From Reference Image 1 & 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dual Bar Chart: Resource & Incident Allocation (From Image 1) */}
        <GlassCard className="p-5 lg:col-span-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Threat Mitigation Allocation
              </h3>
              <p className="text-[11px] text-slate-400">Normal Ingestion vs Automated Blocks</p>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
              Weekly Cadence
            </span>
          </div>

          <DualBarChart
            data={dualBarSampleData}
            height={210}
            label1="Clean Telemetry"
            label2="Threat Probes"
            color1="#10b981"
            color2="#e2e8f0"
          />
        </GlassCard>

        {/* Circular Dials: Health Score & Data Integrity (From Image 1) */}
        <GlassCard className="p-5 lg:col-span-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Security Posture Gauges
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">Continuous Eval</span>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center justify-center my-auto">
            <RadialGauge
              value={summary ? summary.health_score : 90}
              title="Health Score"
              subtitle="Posture"
              color="cyan"
              size={135}
            />
            <RadialGauge
              value={summary ? summary.data_integrity : 98}
              title="Data Integrity"
              subtitle="Verified"
              color="silver"
              size={135}
            />
          </div>
        </GlassCard>

        {/* Target Heatmap Grid (From Image 2) */}
        <GlassCard className="p-5 lg:col-span-3">
          <ThreatHeatmap title="Target Attack Matrix" />
        </GlassCard>
      </div>

      {/* 4. LIVE SECURITY ACTIVITY FEED & SYSTEM HEALTH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Event Stream (2 cols) */}
        <GlassCard className="p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Security Activity Stream
              </h3>
            </div>
            <button
              onClick={() => navigate('/app/live-monitor')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Full Live Monitor</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-white/5 font-mono text-[11px]">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Severity</th>
                  <th className="pb-2">Event Type</th>
                  <th className="pb-2">Source IP</th>
                  <th className="pb-2">Target Host</th>
                  <th className="pb-2">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-500">
                      No recent security events observed
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 font-mono text-[11px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5">
                        <Badge size="sm" variant={ev.severity as any}>
                          {ev.severity}
                        </Badge>
                      </td>
                      <td className="py-2.5 font-mono font-medium text-slate-200">
                        {ev.event_type}
                      </td>
                      <td className="py-2.5 font-mono text-cyan-300">
                        {ev.source_ip || 'N/A'}
                      </td>
                      <td className="py-2.5 text-slate-300">
                        {ev.hostname}
                      </td>
                      <td className="py-2.5 text-slate-400 truncate max-w-xs">
                        {ev.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* System Health Subsystems (1 col) */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Subsystem Health</span>
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
          </div>

          <div className="space-y-3 text-xs">
            {[
              { name: 'Core FastAPI Engine', status: 'ONLINE', icon: Server, color: 'text-emerald-400' },
              { name: 'Relational Database', status: 'HEALTHY (0ms)', icon: Database, color: 'text-emerald-400' },
              { name: 'Detection Rule Pipeline', status: 'ACTIVE (8 RULES)', icon: Cpu, color: 'text-cyan-400' },
              { name: 'Log Ingestion Gateway', status: 'LISTENING', icon: Radio, color: 'text-emerald-400' },
              { name: 'SOAR Response Playbooks', status: 'SIMULATION MODE', icon: Zap, color: 'text-cyan-400' },
              { name: 'Wazuh SIEM Connector', status: 'EXTENSIBLE READY', icon: ShieldCheck, color: 'text-slate-400' },
            ].map((sub, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-2.5">
                  <sub.icon className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-200">{sub.name}</span>
                </div>
                <span className={`font-mono text-[10px] font-bold ${sub.color}`}>
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
