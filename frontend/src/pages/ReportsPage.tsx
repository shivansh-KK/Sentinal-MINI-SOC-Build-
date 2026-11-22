import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  ShieldAlert,
  Zap,
  FileCheck,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../services/api';
import { GlassCard } from '../components/common/GlassCard';
import { Badge } from '../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('daily_summary');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/summary?report_type=${reportType}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleDownloadCSV = async (dataType: string) => {
    try {
      const res = await api.get(`/reports/export-csv?data_type=${dataType}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sentinel_${dataType}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export CSV failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Cybersecurity Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Executive summaries, compliance posture assessments, and downloadable forensic exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={() => handleDownloadCSV('alerts')}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <GlassCard className="p-3 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'daily_summary', label: 'Daily SOC Summary' },
          { id: 'weekly', label: 'Weekly Threat Report' },
          { id: 'monthly', label: 'Monthly Operations Report' },
          { id: 'critical_incidents', label: 'Critical Incident Analysis' },
          { id: 'endpoint_health', label: 'Endpoint Posture Report' },
          { id: 'responses', label: 'Automated Response Report' },
        ].map((rep) => (
          <button
            key={rep.id}
            onClick={() => setReportType(rep.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
              reportType === rep.id
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-neon-cyan'
                : 'text-slate-400 hover:text-white bg-white/[0.02]'
            }`}
          >
            {rep.label}
          </button>
        ))}
      </GlassCard>

      {/* Generated Report Sheet */}
      {reportData && (
        <GlassCard className="p-8 space-y-8 bg-[#090e1d]/90 print:bg-white print:text-black">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold tracking-widest uppercase">
                CONFIDENTIAL • SENTINEL SOC SECURITY INTELLIGENCE
              </span>
              <h2 className="text-2xl font-black text-white mt-1">{reportData.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Evaluation Window: {reportData.time_window} • Generated at: {reportData.generated_at}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">Posture Rating:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">SECURE (COMPLIANT)</span>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-400 text-xs font-mono">Events Ingested</span>
              <p className="text-2xl font-bold font-mono text-white">
                {reportData.summary.total_events.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-400 text-xs font-mono">Threats Detected</span>
              <p className="text-2xl font-bold font-mono text-amber-400">
                {reportData.summary.total_alerts}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-400 text-xs font-mono">Incidents Managed</span>
              <p className="text-2xl font-bold font-mono text-red-400">
                {reportData.summary.total_incidents}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-slate-400 text-xs font-mono">SOAR Mitigations</span>
              <p className="text-2xl font-bold font-mono text-cyan-400">
                {reportData.summary.total_responses}
              </p>
            </div>
          </div>

          {/* Top Threat Sources & Detection Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider">Top Triggered Detection Rules</h3>
              <div className="space-y-2">
                {reportData.top_detection_rules?.map((r: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5">
                    <span className="text-slate-300 font-medium">{r.rule}</span>
                    <span className="font-mono font-bold text-cyan-400">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider">Top Source Attacker IPs</h3>
              <div className="space-y-2">
                {reportData.top_threat_sources?.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 font-mono">
                    <span className="text-cyan-300">{s.ip}</span>
                    <span className="font-bold text-amber-400">{s.count} alerts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Executive Analyst Assessment */}
          <div className="p-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-cyan-400 block">
              Lead SOC Analyst Security Assessment
            </span>
            <p className="text-slate-200 leading-relaxed text-sm">
              {reportData.analyst_assessment}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
