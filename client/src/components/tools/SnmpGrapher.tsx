import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { getSocket } from '../../socket';
import { BarChart3, Play, Square } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const SnmpGrapher: React.FC = () => {
  const [ip, setIp] = useState('');
  const [oid, setOid] = useState('1.3.6.1.2.1.1.3.0');
  const [community, setCommunity] = useState('public');
  const [interval, setInterval_] = useState('5');
  const [monitoring, setMonitoring] = useState(false);
  const { snmpUpdates, addSnmpUpdate, clearSnmpUpdates } = useStore();

  const handleStart = useCallback(() => {
    if (!ip || !oid) { toast.error('IP and OID required'); return; }
    const socket = getSocket();
    clearSnmpUpdates();
    socket.emit('snmp:subscribe', { ip, oid, community, interval: parseInt(interval) * 1000 });
    setMonitoring(true);
    toast.success('SNMP polling started');
  }, [ip, oid, community, interval, clearSnmpUpdates]);

  const handleStop = useCallback(() => {
    const socket = getSocket();
    socket.emit('snmp:unsubscribe');
    setMonitoring(false);
    toast.success('SNMP polling stopped');
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = (data: any) => addSnmpUpdate(data);
    socket.on('snmp:update', handleUpdate);
    return () => {
      socket.off('snmp:update', handleUpdate);
      if (monitoring) socket.emit('snmp:unsubscribe');
    };
  }, [addSnmpUpdate, monitoring]);

  const chartData = snmpUpdates.map(u => ({
    time: new Date(u.timestamp).toLocaleTimeString(),
    value: typeof u.value === 'number' ? u.value : parseFloat(String(u.value)) || 0,
  }));

  const latest = snmpUpdates[snmpUpdates.length - 1];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">SNMP Grapher</h2>
        {monitoring && <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />LIVE</span>}
      </div>

      <div className="tool-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Target IP</label>
            <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.1" className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">OID</label>
            <input type="text" value={oid} onChange={(e) => setOid(e.target.value)} placeholder="1.3.6.1.2.1.1.3.0" className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Community</label>
            <input type="text" value={community} onChange={(e) => setCommunity(e.target.value)} className="w-full font-mono" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Interval (sec)</label>
            <input type="number" value={interval} onChange={(e) => setInterval_(e.target.value)} min="1" className="w-full font-mono" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          {!monitoring ? (
            <button onClick={handleStart} className="btn-primary flex items-center gap-2"><Play size={16} /> Start</button>
          ) : (
            <button onClick={handleStop} className="btn-secondary flex items-center gap-2 !border-red-500/50 !text-red-400"><Square size={16} /> Stop</button>
          )}
        </div>
      </div>

      {latest && (
        <div className="tool-card text-center">
          <div className="text-xs text-slate-400 mb-1">Current Value</div>
          <div className="text-3xl font-mono font-bold text-cyan-400">{String(latest.value)}</div>
          <div className="text-xs text-slate-500 mt-1">OID: {latest.oid}</div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="tool-card">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Value over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f1525', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default SnmpGrapher;
