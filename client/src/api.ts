import axios from 'axios';

const getBaseURL = () => {
  // Always use localhost:3001 since backend runs locally via Electron
  return 'http://localhost:3001/api';
};

const API = axios.create({ baseURL: getBaseURL(), timeout: 30000 });

export const api = {
  pingSweep: (range: string) => API.post('/ping-sweep', { range }),
  portScan: (target: string, ports: string) => API.post('/port-scan', { target, ports }),
  macScan: (subnet: string) => API.post('/mac-scan', { subnet }),
  traceroute: (target: string) => API.post('/traceroute', { target }),
  whois: (query: string) => API.post('/whois', { query }),
  snmpGet: (ip: string, oid: string, community: string) => API.post('/snmp/get', { ip, oid, community }),
  snmpWalk: (ip: string, oid: string, community: string) => API.post('/snmp/walk', { ip, oid, community }),
  subnetCalc: (ip: string, cidr: number) => API.post('/subnet-calc', { ip, cidr }),
  wol: (mac: string) => API.post('/wol', { mac }),
  ping: (target: string, count: number, size: number) => API.post('/ping', { target, count, size }),
  tcpTest: (target: string, port: number, timeout: number) => API.post('/tcp-test', { target, port, timeout }),
  ipGeolocation: (ip: string) => API.post('/ip-geolocation', { ip }),
  getHistory: () => API.get('/history'),
  getAlerts: () => API.get('/alerts'),
  acknowledgeAlert: (id: number) => API.post(`/alerts/${id}/acknowledge`),
};
