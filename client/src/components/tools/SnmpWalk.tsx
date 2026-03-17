import React, { useState } from 'react';
import { api } from '../../api';
import { exportCSV } from '../../utils';
import { Server, Download, Loader2, Play } from 'lucide-react';
import toast from 'react-hot-toast';

interface SnmpResult {
  oid: string;
  type: string;
  value: string;
}

const SnmpWalk: React.FC = () => {
  const [ip, setIp] = useState('');
  const [oid, setOid] = useState('1.3.6.1.2.1.1');
  const [community, setCommunity] = useState('public');
  const [results, setResults] = useState<SnmpResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleWalk = async () => {
    if (!ip || !oid) { toast.error('IP and OID required'); return; }
    setLoading(true);
    setResults([]);
    try {
      const res = await api.snmpWalk(ip, oid, community);
      setResults(res.data);
      toast.success(`Walk complete: ${res.data.length} result(s)`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'SNMP Walk failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Server className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">SNMP Walk</h2>
      </div>

      <div className="tool-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target IP</label>
            <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.1" className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">OID (base)</label>
            <input type="text" value={oid} onChange={(e) => setOid(e.target.value)} placeholder="1.3.6.1.2.1.1" className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Community String</label>
            <input type="text" value={community} onChange={(e) => setCommunity(e.target.value)} className="w-full font-mono" />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={handleWalk} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? 'Walking...' : 'Walk'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">{results.length} result(s)</h3>
            <button onClick={() => exportCSV(results, 'snmp_walk')} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto max-h-[500px] rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead><tr><th>OID</th><th>Type</th><th>Value</th></tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono text-cyan-300 text-xs">{r.oid}</td>
                    <td><span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-xs">{r.type}</span></td>
                    <td className="font-mono">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnmpWalk;
