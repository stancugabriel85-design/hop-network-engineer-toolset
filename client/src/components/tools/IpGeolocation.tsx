import React, { useState } from 'react';
import { api } from '../../api';
import { exportCSV } from '../../utils';
import { MapPin, Download, Loader2, Play, Globe2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

// Fix for default marker icon in React-Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface GeoResult {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

interface HistoryItem extends GeoResult {
  timestamp: string;
}

const IpGeolocation: React.FC = () => {
  const [ip, setIp] = useState('');
  const [result, setResult] = useState<GeoResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLookup = async () => {
    if (!ip) { toast.error('Enter an IP address'); return; }

    setLoading(true);
    setResult(null);
    try {
      const res = await api.ipGeolocation(ip);
      setResult(res.data);
      
      setHistory(prev => [{
        ...res.data,
        timestamp: new Date().toLocaleString()
      }, ...prev].slice(0, 50));

      toast.success(`Location found: ${res.data.city}, ${res.data.country}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Geolocation lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <MapPin className="text-cyan-400" size={24} />
        <h2 className="text-lg font-bold text-white">IP Geolocation Lookup</h2>
      </div>

      <div className="tool-card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">IP Address</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="8.8.8.8"
              className="w-full font-mono"
            />
          </div>
          <button onClick={handleLookup} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Enter any public IP address to find its geographic location, ISP, and network information.
        </p>
      </div>

      {result && (
        <>
          {/* Location Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="tool-card">
              <div className="flex items-center gap-2 mb-2">
                <Globe2 size={16} className="text-cyan-400" />
                <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Location</div>
              </div>
              <div className="text-lg font-bold text-white">{result.city}, {result.region}</div>
              <div className="text-sm text-slate-400">{result.country} ({result.countryCode})</div>
              {result.zip && <div className="text-xs text-slate-500 mt-1">ZIP: {result.zip}</div>}
            </div>

            <div className="tool-card">
              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-2">ISP / Organization</div>
              <div className="text-lg font-bold text-cyan-400">{result.isp}</div>
              <div className="text-sm text-slate-400">{result.org}</div>
              {result.as && <div className="text-xs text-slate-500 mt-1">{result.as}</div>}
            </div>

            <div className="tool-card">
              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-2">Coordinates</div>
              <div className="text-sm font-mono text-white">
                Lat: <span className="text-cyan-400">{result.lat.toFixed(6)}</span>
              </div>
              <div className="text-sm font-mono text-white">
                Lon: <span className="text-cyan-400">{result.lon.toFixed(6)}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Timezone: {result.timezone}</div>
            </div>
          </div>

          {/* Map */}
          <div className="tool-card">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Map Location</h3>
            <div className="rounded-lg overflow-hidden border border-[#1e293b]" style={{ height: '400px' }}>
              <MapContainer
                center={[result.lat, result.lon]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[result.lat, result.lon]}>
                  <Popup>
                    <div className="text-sm">
                      <strong>{result.city}, {result.country}</strong><br />
                      IP: {result.ip}<br />
                      ISP: {result.isp}
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        </>
      )}

      {/* History Table */}
      {history.length > 0 && (
        <div className="tool-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Lookup History ({history.length})</h3>
            <button onClick={() => exportCSV(history, 'ip_geolocation_history')} className="btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-auto max-h-[400px] rounded-lg border border-[#1e293b]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Country</th>
                  <th>City</th>
                  <th>ISP</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td className="font-mono">{h.ip}</td>
                    <td>{h.country}</td>
                    <td>{h.city}</td>
                    <td className="text-slate-400">{h.isp}</td>
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

export default IpGeolocation;
