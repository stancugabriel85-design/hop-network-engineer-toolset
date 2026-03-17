import React, { useState } from 'react';
import { api } from '../../api';
import { Calculator, Loader2, Play } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubnetResult {
  network: string;
  broadcast: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  cidr: number;
  ipClass: string;
  isPrivate: boolean;
}

const SubnetCalc: React.FC = () => {
  const [ip, setIp] = useState('192.168.1.0');
  const [cidr, setCidr] = useState('24');
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalc = async () => {
    if (!ip) { toast.error('Enter an IP address'); return; }
    setLoading(true);
    try {
      const res = await api.subnetCalc(ip, parseInt(cidr));
      setResult(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Calculator className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">Subnet Calculator</h2>
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">IP Address</label>
            <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.0" className="w-full font-mono" />
          </div>
          <div className="w-28">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">CIDR</label>
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-lg">/</span>
              <input type="number" value={cidr} onChange={(e) => setCidr(e.target.value)} min="0" max="32" className="w-full font-mono" />
            </div>
          </div>
          <button onClick={handleCalc} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Calculate
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Network Address', value: result.network, color: 'text-cyan-400' },
            { label: 'Broadcast Address', value: result.broadcast, color: 'text-cyan-400' },
            { label: 'Subnet Mask', value: result.subnetMask, color: 'text-white' },
            { label: 'Wildcard Mask', value: result.wildcardMask, color: 'text-white' },
            { label: 'First Usable Host', value: result.firstHost, color: 'text-green-400' },
            { label: 'Last Usable Host', value: result.lastHost, color: 'text-green-400' },
            { label: 'Total Usable Hosts', value: result.totalHosts.toLocaleString(), color: 'text-yellow-400' },
            { label: 'CIDR Notation', value: `/${result.cidr}`, color: 'text-purple-400' },
            { label: 'IP Class', value: `Class ${result.ipClass}`, color: 'text-orange-400' },
          ].map((item, i) => (
            <div key={i} className="tool-card">
              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-1">{item.label}</div>
              <div className={`text-lg font-mono font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
          <div className="tool-card">
            <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-1">Address Type</div>
            <div className={`text-lg font-bold ${result.isPrivate ? 'text-green-400' : 'text-yellow-400'}`}>
              {result.isPrivate ? 'Private (RFC 1918)' : 'Public'}
            </div>
          </div>
        </div>
      )}

      {/* Quick CIDR reference */}
      <div className="tool-card">
        <h3 className="text-xs font-semibold text-slate-400 mb-3">Quick CIDR Reference</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {[8, 12, 16, 20, 22, 24, 26, 28, 29, 30, 31, 32].map(c => (
            <button key={c} onClick={() => setCidr(String(c))} className="px-2 py-1.5 rounded bg-[#0a0e1a] text-xs font-mono text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
              /{c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubnetCalc;
