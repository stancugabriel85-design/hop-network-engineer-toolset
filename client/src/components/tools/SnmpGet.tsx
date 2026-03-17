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

const SnmpGet: React.FC = () => {
  const [ip, setIp] = useState('');
  const [oid, setOid] = useState('1.3.6.1.2.1.1.1.0');
  const [community, setCommunity] = useState('public');
  const [results, setResults] = useState<SnmpResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGet = async () => {
    if (!ip || !oid) { toast.error('IP and OID required'); return; }
    setLoading(true);
    try {
      const res = await api.snmpGet(ip, oid, community);
      setResults(res.data);
      toast.success('SNMP GET successful');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'SNMP GET failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Server className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">SNMP GET</h2>
      </div>

      <div className="tool-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target IP</label>
            <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.1" className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">OID</label>
            <input type="text" value={oid} onChange={(e) => setOid(e.target.value)} placeholder="1.3.6.1.2.1.1.1.0" className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Community String</label>
            <input type="text" value={community} onChange={(e) => setCommunity(e.target.value)} className="w-full font-mono" />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={handleGet} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? 'Fetching...' : 'GET'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Results</h3>
            <button onClick={() => exportCSV(results, 'snmp_get')} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead><tr><th>OID</th><th>Type</th><th>Value</th></tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i}>
                    <td className="font-mono text-cyan-300">{r.oid}</td>
                    <td><span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-xs">{r.type}</span></td>
                    <td className="font-mono">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="tool-card">
        <h3 className="text-xs font-semibold text-slate-400 mb-2">Common OIDs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs font-mono">
          {[
            ['1.3.6.1.2.1.1.1.0', 'sysDescr'],
            ['1.3.6.1.2.1.1.3.0', 'sysUpTime'],
            ['1.3.6.1.2.1.1.5.0', 'sysName'],
            ['1.3.6.1.2.1.1.6.0', 'sysLocation'],
            ['1.3.6.1.2.1.2.1.0', 'ifNumber'],
            ['1.3.6.1.2.1.1.4.0', 'sysContact'],
          ].map(([o, name]) => (
            <button key={o} onClick={() => setOid(o)} className="text-left px-2 py-1 rounded hover:bg-[#1e293b] text-slate-400 hover:text-cyan-400 transition-colors">
              <span className="text-cyan-400/60">{o}</span> <span className="text-slate-500">— {name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SnmpGet;
