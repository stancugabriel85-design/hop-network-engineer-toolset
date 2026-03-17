import React, { useState } from 'react';
import { api } from '../../api';
import { exportCSV } from '../../utils';
import { Plug, Download, Loader2, CheckCircle2, XCircle, Play } from 'lucide-react';
import toast from 'react-hot-toast';

interface TcpTestResult {
  tcpTestSucceeded: boolean;
  remoteAddress: string;
  remotePort: number;
  responseTime: number | null;
  error: string | null;
}

interface TestHistory extends TcpTestResult {
  target: string;
  timestamp: string;
}

const TcpConnectTest: React.FC = () => {
  const [target, setTarget] = useState('');
  const [port, setPort] = useState('80');
  const [timeout, setTimeout_] = useState('3000');
  const [result, setResult] = useState<TcpTestResult | null>(null);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!target) { toast.error('Enter a target host'); return; }
    if (!port) { toast.error('Enter a port number'); return; }

    setLoading(true);
    setResult(null);
    try {
      const res = await api.tcpTest(target, parseInt(port), parseInt(timeout));
      setResult(res.data);
      
      setHistory(prev => [{
        ...res.data,
        target,
        timestamp: new Date().toLocaleString()
      }, ...prev].slice(0, 50));

      if (res.data.tcpTestSucceeded) {
        toast.success(`TCP connection successful (${res.data.responseTime}ms)`);
      } else {
        toast.error(`Connection failed: ${res.data.error}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'TCP test failed');
    } finally {
      setLoading(false);
    }
  };

  const commonPorts = [
    { port: 22, name: 'SSH' },
    { port: 80, name: 'HTTP' },
    { port: 443, name: 'HTTPS' },
    { port: 3389, name: 'RDP' },
    { port: 21, name: 'FTP' },
    { port: 25, name: 'SMTP' },
    { port: 3306, name: 'MySQL' },
    { port: 5432, name: 'PostgreSQL' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Plug className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">TCP Connect Test</h2>
      </div>

      <div className="tool-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target (IP or Hostname)</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="google.com or 192.168.1.1"
              className="w-full font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Port Number</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              min="1"
              max="65535"
              placeholder="80"
              className="w-full font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Timeout (ms)</label>
            <input
              type="number"
              value={timeout}
              onChange={(e) => setTimeout_(e.target.value)}
              min="100"
              max="30000"
              placeholder="3000"
              className="w-full font-mono"
            />
          </div>
        </div>

        <div className="mt-4">
          <button onClick={handleTest} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-500 space-y-1">
          <p>• Check if a service is listening on a port</p>
          <p>• Verify firewall rules allow traffic</p>
          <p>• Test RDP (3389), SSH (22), HTTP (80), HTTPS (443)</p>
        </div>
      </div>

      {/* Common Ports Quick Select */}
      <div className="tool-card">
        <h3 className="text-xs font-semibold text-slate-400 mb-3">Common Ports</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {commonPorts.map(({ port: p, name }) => (
            <button
              key={p}
              onClick={() => setPort(String(p))}
              className="px-3 py-2 rounded bg-[#0a0e1a] text-xs text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors text-left"
            >
              <span className="font-mono font-semibold text-cyan-400">{p}</span>
              <span className="text-slate-500 ml-2">— {name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="tool-card">
          <div className="flex flex-col items-center justify-center py-8">
            {result.tcpTestSucceeded ? (
              <>
                <CheckCircle2 size={64} className="text-green-400 mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">TCP Connection Successful</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Connected to <span className="font-mono text-cyan-400">{result.remoteAddress}:{result.remotePort}</span>
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">Response Time</div>
                    <div className="text-2xl font-mono font-bold text-cyan-400">{result.responseTime}ms</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <XCircle size={64} className="text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-red-400 mb-2">Connection Failed</h3>
                <p className="text-slate-400 text-sm mb-2">
                  Target: <span className="font-mono text-cyan-400">{result.remoteAddress}:{result.remotePort}</span>
                </p>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
                  <p className="text-red-400 text-sm font-medium">{result.error}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* History Table */}
      {history.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Test History ({history.length})</h3>
            <button onClick={() => exportCSV(history, 'tcp_test_history')} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto max-h-[400px] rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Port</th>
                  <th>Result</th>
                  <th>Response Time</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td className="font-mono">{h.target}</td>
                    <td className="font-mono">{h.remotePort}</td>
                    <td>
                      {h.tcpTestSucceeded ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400">
                          <CheckCircle2 size={12} />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400">
                          <XCircle size={12} />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="font-mono">{h.responseTime !== null ? `${h.responseTime} ms` : '—'}</td>
                    <td className="text-slate-400 text-xs">{h.timestamp}</td>
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

export default TcpConnectTest;
