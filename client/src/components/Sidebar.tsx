import React from 'react';
import { useStore } from '../store';
import {
  Network, Radio, Search, Activity, Server, Calculator, Wifi,
  ChevronLeft, ChevronRight, Radar, Globe, FileText, Lock,
  MonitorSpeaker, BarChart3, Terminal, Zap, Plug, MapPin, Gauge, Monitor
} from 'lucide-react';

interface ToolItem {
  id: string;
  title: string;
  icon: string;
}

interface ToolCategory {
  name: string;
  icon: React.ReactNode;
  tools: ToolItem[];
}

const categories: ToolCategory[] = [
  {
    name: 'Network Discovery',
    icon: <Radar size={16} />,
    tools: [
      { id: 'ping-sweep', title: 'Ping Sweep', icon: 'radar' },
      { id: 'port-scanner', title: 'Port Scanner', icon: 'search' },
      { id: 'mac-scanner', title: 'MAC Scanner', icon: 'network' },
    ]
  },
  {
    name: 'Real-Time Monitoring',
    icon: <Activity size={16} />,
    tools: [
      { id: 'ping-monitor', title: 'Ping Monitor', icon: 'radio' },
      { id: 'rtt-monitor', title: 'RTT Monitor', icon: 'activity' },
      { id: 'bandwidth-monitor', title: 'Bandwidth Monitor', icon: 'bar-chart' },
    ]
  },
  {
    name: 'Diagnostics',
    icon: <Terminal size={16} />,
    tools: [
      { id: 'advanced-ping', title: 'Advanced Ping', icon: 'radio' },
      { id: 'tcp-connect-test', title: 'TCP Connect Test', icon: 'plug' },
      { id: 'traceroute', title: 'Trace Route', icon: 'globe' },
      { id: 'whois', title: 'WHOIS', icon: 'file-text' },
    ]
  },
  {
    name: 'SNMP Tools',
    icon: <Server size={16} />,
    tools: [
      { id: 'snmp-get', title: 'SNMP GET', icon: 'server' },
      { id: 'snmp-walk', title: 'SNMP Walk', icon: 'server' },
      { id: 'snmp-grapher', title: 'SNMP Grapher', icon: 'bar-chart' },
    ]
  },
  {
    name: 'IP & Subnet Tools',
    icon: <Calculator size={16} />,
    tools: [
      { id: 'subnet-calc', title: 'Subnet Calculator', icon: 'calculator' },
      { id: 'ip-geolocation', title: 'IP Geolocation', icon: 'map-pin' },
      { id: 'password-gen', title: 'Password Generator', icon: 'lock' },
    ]
  },
  {
    name: 'Remote Management',
    icon: <Zap size={16} />,
    tools: [
      { id: 'wol', title: 'Wake-on-LAN', icon: 'zap' },
    ]
  },
  {
    name: 'Remote Access',
    icon: <Terminal size={16} />,
    tools: [
      { id: 'ssh-terminal', title: 'SSH Terminal', icon: 'terminal' },
    ]
  },
];

function getIcon(name: string, size: number = 18) {
  const icons: Record<string, React.ReactNode> = {
    'radar': <Radar size={size} />,
    'search': <Search size={size} />,
    'network': <Network size={size} />,
    'radio': <Radio size={size} />,
    'activity': <Activity size={size} />,
    'bar-chart': <BarChart3 size={size} />,
    'globe': <Globe size={size} />,
    'file-text': <FileText size={size} />,
    'server': <Server size={size} />,
    'calculator': <Calculator size={size} />,
    'lock': <Lock size={size} />,
    'zap': <Zap size={size} />,
    'plug': <Plug size={size} />,
    'map-pin': <MapPin size={size} />,
    'gauge': <Gauge size={size} />,
    'monitor': <Monitor size={size} />,
    'wifi': <Wifi size={size} />,
    'terminal': <Terminal size={size} />,
  };
  return icons[name] || <Terminal size={size} />;
}

const Sidebar: React.FC = () => {
  const { addTab, sidebarCollapsed, toggleSidebar } = useStore();

  const handleToolClick = (tool: ToolItem) => {
    addTab({ id: tool.id, title: tool.title, tool: tool.id, icon: tool.icon as string });
  };

  return (
    <div className={`h-full bg-[#0c1120] border-r border-[#1e293b] flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center justify-between p-3 border-b border-[#1e293b]">
        {!sidebarCollapsed && (
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tools</span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:bg-[#1e293b] text-slate-400 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {categories.map((cat) => (
          <div key={cat.name} className="mb-1">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {cat.icon}
                <span>{cat.name}</span>
              </div>
            )}
            {cat.tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className={`w-full flex items-center gap-3 py-2 text-sm text-slate-300 hover:bg-[#151d32] hover:text-cyan-400 transition-colors ${sidebarCollapsed ? 'px-4 justify-center' : 'px-6'}`}
                title={tool.title}
              >
                <span className="text-slate-400 flex-shrink-0">{getIcon(tool.icon, 16)}</span>
                {!sidebarCollapsed && <span className="truncate">{tool.title}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
