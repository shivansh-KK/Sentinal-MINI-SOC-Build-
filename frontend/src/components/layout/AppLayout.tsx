import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  FileText,
  Bell,
  AlertTriangle,
  Flame,
  Laptop,
  Network,
  Cpu,
  Zap,
  Crosshair,
  BarChart3,
  ScrollText,
  FlaskConical,
  Settings,
  LogOut,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Menu,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { Badge } from '../common/Badge';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, liveNotifications, clearNotifications } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString().slice(17, 25) + ' UTC');

  // Update clock every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(17, 25) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navGroups = [
    {
      group: 'MONITORING',
      items: [
        { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/app/live-monitor', label: 'Live Monitor', icon: Radio, pulse: true },
        { path: '/app/events', label: 'Security Events', icon: FileText },
      ],
    },
    {
      group: 'THREAT MANAGEMENT',
      items: [
        { path: '/app/alerts', label: 'Alerts', icon: Bell },
        { path: '/app/incidents', label: 'Incidents', icon: Flame },
        { path: '/app/investigation', label: 'Investigation', icon: Crosshair },
      ],
    },
    {
      group: 'INFRASTRUCTURE',
      items: [
        { path: '/app/endpoints', label: 'Endpoints', icon: Laptop },
        { path: '/app/network', label: 'Network Monitor', icon: Network },
      ],
    },
    {
      group: 'AUTOMATION & RULES',
      items: [
        { path: '/app/response', label: 'Automated Response', icon: Zap },
        { path: '/app/detection-rules', label: 'Detection Rules', icon: Cpu },
      ],
    },
    {
      group: 'COMPLIANCE & TESTING',
      items: [
        { path: '/app/reports', label: 'Reports & Analytics', icon: BarChart3 },
        { path: '/app/audit-logs', label: 'Audit Logs', icon: ScrollText },
        { path: '/app/demo-lab', label: 'Demo Lab', icon: FlaskConical, highlight: true },
        { path: '/app/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070a13] text-slate-100">
      {/* 1. SLIM GLOWING ICON RAIL (FAR LEFT - From Reference Image 1 & 2) */}
      <aside className="w-16 flex-shrink-0 flex flex-col items-center py-5 border-r border-white/[0.08] bg-[#090d1a]/80 backdrop-blur-xl z-30">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-neon-cyan mb-8 cursor-pointer"
             onClick={() => navigate('/app/dashboard')}>
          <Shield className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 flex flex-col items-center space-y-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-white/[0.05] transition-all"
            title={sidebarCollapsed ? "Expand Navigation" : "Collapse Navigation"}
          >
            <Menu className="w-5 h-5" />
          </button>

          <NavLink
            to="/app/dashboard"
            className={({ isActive }) =>
              `p-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/15 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`
            }
            title="SOC Command Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
          </NavLink>

          <NavLink
            to="/app/live-monitor"
            className={({ isActive }) =>
              `p-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/15 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`
            }
            title="Real-Time Threat Stream"
          >
            <Radio className="w-5 h-5" />
          </NavLink>

          <NavLink
            to="/app/response"
            className={({ isActive }) =>
              `p-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/15 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`
            }
            title="Automated Incident Response"
          >
            <Zap className="w-5 h-5" />
          </NavLink>

          <NavLink
            to="/app/demo-lab"
            className={({ isActive }) =>
              `p-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-cyan-400 bg-cyan-500/15 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`
            }
            title="Demo Lab Attack Simulator"
          >
            <FlaskConical className="w-5 h-5 text-cyan-300" />
          </NavLink>
        </div>

        {/* Bottom logout icon */}
        <button
          onClick={logout}
          className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all mt-auto"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </aside>

      {/* 2. SECONDARY NAVIGATION PANE (COLLAPSIBLE) */}
      {!sidebarCollapsed && (
        <aside className="w-64 flex-shrink-0 flex flex-col border-r border-white/[0.08] bg-[#0c1222]/70 backdrop-blur-2xl z-20 transition-all duration-300">
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <h1 className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase">
                SENTINEL SOC
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
                v1.0.0 • AI-SOAR PLATFORM
              </p>
            </div>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                <span className="px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  {group.group}
                </span>
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.2)] font-semibold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                        } ${item.highlight ? 'border border-cyan-500/20 text-cyan-300' : ''}`
                      }
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                      {item.pulse && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      )}
                      {item.highlight && (
                        <span className="ml-auto text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                          DEMO
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* User profile footer */}
          <div className="p-3 border-t border-white/[0.08] bg-black/20">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-xs text-white">
                {user?.username?.slice(0, 2).toUpperCase() || 'SO'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.full_name || user?.username || 'Security Analyst'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    {user?.role || 'analyst'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 3. MAIN CONTENT CONTAINER & TOP HEADER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP GLASS HEADER (From Reference Image 1 & 2) */}
        <header className="h-16 flex-shrink-0 px-6 border-b border-white/[0.08] bg-[#090d1a]/85 backdrop-blur-xl flex items-center justify-between z-10">
          {/* Left search */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search events, IPs, hostnames, alerts, hashes..."
                className="w-full glass-input text-xs rounded-xl pl-10 pr-4 py-2 text-slate-200 placeholder-slate-500 font-sans"
              />
            </div>
          </div>

          {/* Right Status Indicators & Profile */}
          <div className="flex items-center gap-3">
            {/* Real-time WebSocket connection badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[11px] font-mono text-slate-300">
                {isConnected ? 'LIVE WS CONNECTED' : 'WS RECONNECTING'}
              </span>
            </div>

            {/* System Clock UTC */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[11px] font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentTime}</span>
            </div>

            {/* Notification bell dropdown toggle */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-300 hover:text-cyan-400 hover:bg-white/[0.05] transition-colors border border-white/[0.08]"
              >
                <Bell className="w-4 h-4" />
                {liveNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                    {liveNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl glass-panel-glow p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Live Security Alerts
                    </span>
                    <button
                      onClick={clearNotifications}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {liveNotifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No recent live alerts</p>
                    ) : (
                      liveNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-cyan-300 truncate">{notif.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{notif.timestamp}</span>
                          </div>
                          {notif.target && (
                            <p className="text-[11px] text-slate-400 font-mono">Target: {notif.target}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-neon-cyan">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* 4. SCROLLABLE PAGE BODY */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#070a13]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
