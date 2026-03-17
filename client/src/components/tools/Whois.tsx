import React, { useState } from 'react';
import { api } from '../../api';
import { FileText, Loader2, Search, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const Whois: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ raw: string; parsed: Record<string, any> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);

  const handleLookup = async () => {
    if (!query) { toast.error('Enter a domain or IP'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.whois(query);
      setResult(res.data);
      toast.success('WHOIS lookup complete');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'WHOIS lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const copyRaw = () => {
    if (result?.raw) {
      navigator.clipboard.writeText(result.raw);
      toast.success('Copied to clipboard');
    }
  };

  const importantKeys = [
    'Domain Name', 'Registrar', 'Creation Date', 'Updated Date', 'Registry Expiry Date',
    'Registrant Organization', 'Registrant Country', 'Name Server', 'DNSSEC',
    'domain', 'registrar', 'nserver', 'created', 'changed', 'expire',
    'NetName', 'NetRange', 'CIDR', 'Organization', 'OrgName', 'Country'
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">WHOIS Lookup</h2>
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Domain or IP Address</label>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="example.com or 8.8.8.8" className="w-full font-mono" />
          </div>
          <button onClick={handleLookup} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
      </div>

      {result && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button onClick={() => setViewRaw(false)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!viewRaw ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-300'}`}>Parsed</button>
              <button onClick={() => setViewRaw(true)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewRaw ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-300'}`}>Raw</button>
            </div>
            <button onClick={copyRaw} className="btn-secondary flex items-center gap-2">
              <Copy size={14} /> Copy Raw
            </button>
          </div>

          {viewRaw ? (
            <pre className="font-mono text-xs text-slate-300 bg-[#0a0e1a] rounded-lg p-4 overflow-auto max-h-[500px] whitespace-pre-wrap">{result.raw}</pre>
          ) : (
            <div className="overflow-auto max-h-[500px] rounded-lg border border-[#1e293b]">
              <table className="data-table">
                <thead><tr><th>Field</th><th>Value</th></tr></thead>
                <tbody>
                  {Object.entries(result.parsed)
                    .filter(([key]) => importantKeys.some(k => key.toLowerCase().includes(k.toLowerCase())))
                    .map(([key, value], i) => (
                      <tr key={i}>
                        <td className="font-semibold text-slate-300 whitespace-nowrap">{key}</td>
                        <td className="font-mono text-cyan-300">{Array.isArray(value) ? value.join(', ') : String(value)}</td>
                      </tr>
                    ))}
                  {Object.entries(result.parsed)
                    .filter(([key]) => !importantKeys.some(k => key.toLowerCase().includes(k.toLowerCase())))
                    .map(([key, value], i) => (
                      <tr key={`other-${i}`}>
                        <td className="text-slate-400 whitespace-nowrap">{key}</td>
                        <td className="font-mono">{Array.isArray(value) ? value.join(', ') : String(value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Whois;
