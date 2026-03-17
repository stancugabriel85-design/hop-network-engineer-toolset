import React from 'react';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PingSweep from './components/tools/PingSweep';
import PortScanner from './components/tools/PortScanner';
import MacScanner from './components/tools/MacScanner';
import PingMonitor from './components/tools/PingMonitor';
import RttMonitor from './components/tools/RttMonitor';
import BandwidthMonitor from './components/tools/BandwidthMonitor';
import AdvancedPing from './components/tools/AdvancedPing';
import TcpConnectTest from './components/tools/TcpConnectTest';
import Traceroute from './components/tools/Traceroute';
import Whois from './components/tools/Whois';
import SnmpGet from './components/tools/SnmpGet';
import SnmpWalk from './components/tools/SnmpWalk';
import SnmpGrapher from './components/tools/SnmpGrapher';
import SubnetCalc from './components/tools/SubnetCalc';
import PasswordGenerator from './components/tools/PasswordGenerator';
import WakeOnLan from './components/tools/WakeOnLan';
import IpGeolocation from './components/tools/IpGeolocation';
import SSHTerminal from './components/SSHTerminal';
import {
  Network, Radar, Search, Activity, BarChart3, Radio, Globe,
  Server, Calculator, Lock, Terminal
} from 'lucide-react';

const toolComponents: Record<string, React.FC> = {
  'ping-sweep': PingSweep,
  'port-scanner': PortScanner,
  'mac-scanner': MacScanner,
  'ping-monitor': PingMonitor,
  'rtt-monitor': RttMonitor,
  'bandwidth-monitor': BandwidthMonitor,
  'advanced-ping': AdvancedPing,
  'tcp-connect-test': TcpConnectTest,
  'traceroute': Traceroute,
  'whois': Whois,
  'snmp-get': SnmpGet,
  'snmp-walk': SnmpWalk,
  'snmp-grapher': SnmpGrapher,
  'subnet-calc': SubnetCalc,
  'ip-geolocation': IpGeolocation,
  'password-gen': PasswordGenerator,
  'wol': WakeOnLan,
  'ssh-terminal': SSHTerminal,
};

function WelcomePage() {
  const { addTab } = useStore();

  const quickTools = [
    { id: 'ping-sweep', title: 'Ping Sweep', icon: <Radar size={20} />, desc: 'Discover hosts on a network range' },
    { id: 'port-scanner', title: 'Port Scanner', icon: <Search size={20} />, desc: 'Scan for open ports on a target' },
    { id: 'ping-monitor', title: 'Ping Monitor', icon: <Radio size={20} />, desc: 'Real-time host monitoring' },
    { id: 'traceroute', title: 'Trace Route', icon: <Globe size={20} />, desc: 'Trace network path to a host' },
    { id: 'subnet-calc', title: 'Subnet Calculator', icon: <Calculator size={20} />, desc: 'Calculate subnet details' },
    { id: 'snmp-get', title: 'SNMP GET', icon: <Server size={20} />, desc: 'Query SNMP devices' },
    { id: 'ssh-terminal', title: 'SSH Terminal', icon: <Terminal size={20} />, desc: 'Connect to remote servers via SSH' },
    { id: 'tcp-connect-test', title: 'TCP Connect Test', icon: <Terminal size={20} />, desc: 'Test TCP connectivity to a port' },
    { id: 'ip-geolocation', title: 'IP Geolocation', icon: <Globe size={20} />, desc: 'Locate an IP on the map' },
    { id: 'mac-scanner', title: 'MAC Scanner', icon: <Network size={20} />, desc: 'Discover MAC addresses' },
    { id: 'whois', title: 'WHOIS', icon: <Globe size={20} />, desc: 'Domain and IP registration info' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-10">
        <div className="inline-flex p-4 bg-cyan-500/10 rounded-2xl mb-4">
          <Network size={48} className="text-cyan-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Hop!</h1>
        <p className="text-slate-400 text-sm max-w-md">
          Professional network diagnostics and monitoring dashboard. Select a tool from the sidebar or use a quick action below.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full">
        {quickTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => addTab({ id: tool.id, title: tool.title, tool: tool.id, icon: tool.id })}
            className="tool-card text-left hover:border-cyan-500/30 transition-all hover:translate-y-[-2px] group"
          >
            <div className="text-cyan-400 mb-2 group-hover:text-cyan-300 transition-colors">{tool.icon}</div>
            <div className="text-sm font-semibold text-white mb-0.5">{tool.title}</div>
            <div className="text-xs text-slate-500">{tool.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-10 flex items-center gap-6 text-xs text-slate-600">
        <div className="flex items-center gap-1.5"><Terminal size={12} /> 18 Tools</div>
        <div className="flex items-center gap-1.5"><Activity size={12} /> Real-time Monitoring</div>
        <div className="flex items-center gap-1.5"><BarChart3 size={12} /> Live Charts</div>
      </div>
    </div>
  );
}

function App() {
  const { tabs, activeTabId } = useStore();

  const activeTab = tabs.find(t => t.id === activeTabId);
  const ActiveComponent = activeTab ? toolComponents[activeTab.tool] : null;

  return (
    <div className="h-screen flex flex-col bg-[#0a0e1a] overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#151d32',
            color: '#e2e8f0',
            border: '1px solid #1e293b',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {ActiveComponent ? <ActiveComponent /> : <WelcomePage />}
        </main>
      </div>
    </div>
  );
}

export default App;
