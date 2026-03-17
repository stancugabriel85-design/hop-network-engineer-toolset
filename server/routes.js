const express = require('express');
const router = express.Router();
const ping = require('ping');
const net = require('net');
const dns = require('dns');
const whois = require('whois');
const axios = require('axios');
const os = require('os');
const db = require('./db');

function saveHistory(tool, params, results) {
  try {
    db.prepare('INSERT INTO scan_history (tool, params, results) VALUES (?, ?, ?)')
      .run(tool, JSON.stringify(params), JSON.stringify(results));
  } catch (e) {
    console.error('Failed to save history:', e.message);
  }
}

// ─── PING SWEEP ───
router.post('/ping-sweep', async (req, res) => {
  try {
    const { range } = req.body;
    if (!range) return res.status(400).json({ error: 'Range is required (e.g. 192.168.1.1-254)' });

    const match = range.match(/^(\d+\.\d+\.\d+\.)(\d+)-(\d+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid range format. Use: 192.168.1.1-254' });

    const base = match[1];
    const start = parseInt(match[2]);
    const end = parseInt(match[3]);

    if (start > end || end > 254) return res.status(400).json({ error: 'Invalid range values' });

    const results = [];
    const promises = [];

    for (let i = start; i <= end; i++) {
      const ip = base + i;
      promises.push(
        ping.promise.probe(ip, { timeout: 2 }).then(r => {
          results.push({
            ip,
            status: r.alive ? 'up' : 'down',
            responseTime: r.alive ? parseFloat(r.time) || 0 : null
          });
        }).catch(() => {
          results.push({ ip, status: 'down', responseTime: null });
        })
      );
    }

    await Promise.all(promises);
    results.sort((a, b) => {
      const aNum = parseInt(a.ip.split('.').pop());
      const bNum = parseInt(b.ip.split('.').pop());
      return aNum - bNum;
    });

    saveHistory('ping-sweep', { range }, results);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PORT SCANNER ───
router.post('/port-scan', async (req, res) => {
  try {
    const { target, ports } = req.body;
    if (!target || !ports) return res.status(400).json({ error: 'Target and ports required' });

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const hostnameRegex = /^[a-zA-Z0-9][a-zA-Z0-9.\-]*[a-zA-Z0-9]$/;
    if (!ipRegex.test(target) && !hostnameRegex.test(target)) {
      return res.status(400).json({ error: 'Invalid target format' });
    }

    const match = ports.match(/^(\d+)-(\d+)$/);
    if (!match) return res.status(400).json({ error: 'Ports format: 1-1024' });

    const start = parseInt(match[1]);
    const end = parseInt(match[2]);
    if (start > end || end > 65535) return res.status(400).json({ error: 'Invalid port range' });

    const maxPorts = Math.min(end - start + 1, 1024);
    const actualEnd = start + maxPorts - 1;

    const results = [];
    const batchSize = 100;

    for (let batchStart = start; batchStart <= actualEnd; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, actualEnd);
      const promises = [];

      for (let port = batchStart; port <= batchEnd; port++) {
        promises.push(new Promise((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(1500);
          socket.on('connect', () => {
            results.push({ port, status: 'open', service: getServiceName(port) });
            socket.destroy();
            resolve();
          });
          socket.on('timeout', () => { socket.destroy(); resolve(); });
          socket.on('error', () => { socket.destroy(); resolve(); });
          socket.connect(port, target);
        }));
      }
      await Promise.all(promises);
    }

    results.sort((a, b) => a.port - b.port);
    saveHistory('port-scan', { target, ports }, results);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getServiceName(port) {
  const services = {
    21: 'FTP', 22: 'SSH', 23: 'Telnet', 25: 'SMTP', 53: 'DNS',
    80: 'HTTP', 110: 'POP3', 143: 'IMAP', 443: 'HTTPS', 445: 'SMB',
    993: 'IMAPS', 995: 'POP3S', 3306: 'MySQL', 3389: 'RDP',
    5432: 'PostgreSQL', 5900: 'VNC', 8080: 'HTTP-Proxy', 8443: 'HTTPS-Alt',
    161: 'SNMP', 162: 'SNMP-Trap', 389: 'LDAP', 636: 'LDAPS',
    1433: 'MSSQL', 1521: 'Oracle', 6379: 'Redis', 27017: 'MongoDB'
  };
  return services[port] || '';
}

// ─── MAC ADDRESS SCANNER ───
router.post('/mac-scan', async (req, res) => {
  try {
    const { subnet } = req.body;
    if (!subnet) return res.status(400).json({ error: 'Subnet required (e.g. 192.168.1.1-254)' });

    const match = subnet.match(/^(\d+\.\d+\.\d+\.)(\d+)-(\d+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid format. Use: 192.168.1.1-254' });

    const base = match[1];
    const start = parseInt(match[2]);
    const end = parseInt(match[3]);

    const results = [];
    const promises = [];

    for (let i = start; i <= end; i++) {
      const ip = base + i;
      promises.push(
        ping.promise.probe(ip, { timeout: 1 }).then(async (r) => {
          if (r.alive) {
            try {
              const arp = require('node-arp');
              const mac = await new Promise((resolve) => {
                arp.getMAC(ip, (err, mac) => {
                  resolve(err ? 'N/A' : mac);
                });
              });
              results.push({
                ip,
                mac: mac || 'N/A',
                manufacturer: getManufacturer(mac)
              });
            } catch {
              results.push({ ip, mac: 'N/A', manufacturer: '' });
            }
          }
        }).catch(() => {})
      );
    }

    await Promise.all(promises);
    results.sort((a, b) => {
      const aNum = parseInt(a.ip.split('.').pop());
      const bNum = parseInt(b.ip.split('.').pop());
      return aNum - bNum;
    });

    saveHistory('mac-scan', { subnet }, results);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getManufacturer(mac) {
  if (!mac || mac === 'N/A') return '';
  const prefix = mac.substring(0, 8).toUpperCase().replace(/-/g, ':');
  const oui = {
    '00:50:56': 'VMware', '00:0C:29': 'VMware', '00:1A:A0': 'Dell',
    '00:1E:68': 'Quanta', '00:25:B5': 'Cisco', 'AC:DE:48': 'Cisco',
    'D8:CB:8A': 'Micro-Star', '00:1B:21': 'Intel', '00:1E:37': 'Universal',
    '08:00:27': 'Oracle VBox', 'B4:2E:99': 'Glenyre', 'DC:A6:32': 'Raspberry Pi',
    '00:0D:B9': 'PC Engines', '00:16:3E': 'Xen'
  };
  return oui[prefix] || '';
}

// ─── TRACEROUTE ───
router.post('/traceroute', async (req, res) => {
  try {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: 'Target is required' });

    const sanitizedTarget = target.replace(/[^a-zA-Z0-9.\-:]/g, '');
    if (sanitizedTarget !== target) {
      return res.status(400).json({ error: 'Invalid characters in target' });
    }

    const { exec } = require('child_process');
    const isWin = process.platform === 'win32';
    const cmd = isWin ? `tracert -d -w 2000 -h 30 ${sanitizedTarget}` : `traceroute -n -w 2 -m 30 ${sanitizedTarget}`;

    exec(cmd, { timeout: 60000 }, (err, stdout) => {
      if (err && !stdout) return res.status(500).json({ error: 'Traceroute failed: ' + err.message });

      const lines = stdout.split('\n').filter(l => l.trim());
      const hops = [];

      for (const line of lines) {
        let hopMatch;
        if (isWin) {
          hopMatch = line.match(/^\s*(\d+)\s+(?:([<\d]+)\s*ms\s+([<\d]+)\s*ms\s+([<\d]+)\s*ms|(\*\s+\*\s+\*))\s+([\d.]+|\*)/);
        } else {
          hopMatch = line.match(/^\s*(\d+)\s+([\d.]+|\*)\s+([\d.]+)\s*ms/);
        }

        if (hopMatch) {
          if (isWin) {
            const hop = parseInt(hopMatch[1]);
            const ip = hopMatch[6] || '*';
            const rtt1 = hopMatch[2] ? hopMatch[2].replace('<', '') : '*';
            const rtt2 = hopMatch[3] ? hopMatch[3].replace('<', '') : '*';
            const rtt3 = hopMatch[4] ? hopMatch[4].replace('<', '') : '*';
            const avgRtt = [rtt1, rtt2, rtt3]
              .filter(r => r !== '*')
              .map(Number)
              .reduce((a, b, _, arr) => a + b / arr.length, 0);

            hops.push({
              hop,
              ip: ip === '*' ? '*' : ip,
              hostname: ip,
              rtt: avgRtt > 0 ? parseFloat(avgRtt.toFixed(2)) : null
            });
          } else {
            hops.push({
              hop: parseInt(hopMatch[1]),
              ip: hopMatch[2],
              hostname: hopMatch[2],
              rtt: parseFloat(hopMatch[3])
            });
          }
        }
      }

      saveHistory('traceroute', { target }, hops);
      res.json(hops);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── WHOIS ───
router.post('/whois', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const sanitizedQuery = query.replace(/[^a-zA-Z0-9.\-:\/]/g, '');
    if (sanitizedQuery !== query) {
      return res.status(400).json({ error: 'Invalid characters in query' });
    }

    whois.lookup(sanitizedQuery, (err, data) => {
      if (err) return res.status(500).json({ error: 'WHOIS lookup failed: ' + err.message });

      const lines = data.split('\n').filter(l => l.trim() && !l.startsWith('%') && !l.startsWith('#'));
      const results = {};
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.substring(0, colonIdx).trim();
          const value = line.substring(colonIdx + 1).trim();
          if (key && value) {
            if (results[key]) {
              results[key] = Array.isArray(results[key])
                ? [...results[key], value]
                : [results[key], value];
            } else {
              results[key] = value;
            }
          }
        }
      }

      saveHistory('whois', { query }, results);
      res.json({ raw: data, parsed: results });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SNMP GET ───
router.post('/snmp/get', async (req, res) => {
  try {
    const { ip, oid, community } = req.body;
    if (!ip || !oid) return res.status(400).json({ error: 'IP and OID required' });

    const snmp = require('net-snmp');
    const session = snmp.createSession(ip, community || 'public');

    session.get([oid], (err, varbinds) => {
      session.close();
      if (err) return res.status(500).json({ error: 'SNMP GET failed: ' + err.message });

      const results = varbinds.map(vb => ({
        oid: vb.oid,
        type: snmp.ObjectType[vb.type] || vb.type,
        value: vb.value ? vb.value.toString() : ''
      }));

      saveHistory('snmp-get', { ip, oid, community: community || 'public' }, results);
      res.json(results);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SNMP WALK ───
router.post('/snmp/walk', async (req, res) => {
  try {
    const { ip, oid, community } = req.body;
    if (!ip || !oid) return res.status(400).json({ error: 'IP and OID required' });

    const snmp = require('net-snmp');
    const session = snmp.createSession(ip, community || 'public');
    const results = [];

    session.subtree(oid, 20,
      (varbinds) => {
        for (const vb of varbinds) {
          results.push({
            oid: vb.oid,
            type: snmp.ObjectType[vb.type] || vb.type,
            value: vb.value ? vb.value.toString() : ''
          });
        }
      },
      (err) => {
        session.close();
        if (err && results.length === 0) {
          return res.status(500).json({ error: 'SNMP Walk failed: ' + err.message });
        }
        saveHistory('snmp-walk', { ip, oid, community: community || 'public' }, results);
        res.json(results);
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SUBNET CALCULATOR ───
router.post('/subnet-calc', async (req, res) => {
  try {
    const { ip, cidr } = req.body;
    if (!ip || cidr === undefined) return res.status(400).json({ error: 'IP and CIDR required' });

    const cidrNum = parseInt(cidr);
    if (cidrNum < 0 || cidrNum > 32) return res.status(400).json({ error: 'CIDR must be 0-32' });

    const ipParts = ip.split('.').map(Number);
    if (ipParts.length !== 4 || ipParts.some(p => isNaN(p) || p < 0 || p > 255)) {
      return res.status(400).json({ error: 'Invalid IP address' });
    }

    const ipLong = (ipParts[0] << 24 | ipParts[1] << 16 | ipParts[2] << 8 | ipParts[3]) >>> 0;
    const mask = cidrNum === 0 ? 0 : (~0 << (32 - cidrNum)) >>> 0;
    const network = (ipLong & mask) >>> 0;
    const broadcast = (network | ~mask) >>> 0;
    const firstHost = cidrNum >= 31 ? network : (network + 1) >>> 0;
    const lastHost = cidrNum >= 31 ? broadcast : (broadcast - 1) >>> 0;
    const totalHosts = cidrNum >= 31 ? (cidrNum === 32 ? 1 : 2) : Math.pow(2, 32 - cidrNum) - 2;

    const toLong = (n) => `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;

    const result = {
      network: toLong(network),
      broadcast: toLong(broadcast),
      subnetMask: toLong(mask),
      wildcardMask: toLong(~mask >>> 0),
      firstHost: toLong(firstHost),
      lastHost: toLong(lastHost),
      totalHosts,
      cidr: cidrNum,
      ipClass: ipParts[0] < 128 ? 'A' : ipParts[0] < 192 ? 'B' : ipParts[0] < 224 ? 'C' : ipParts[0] < 240 ? 'D' : 'E',
      isPrivate: (ipParts[0] === 10) ||
        (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) ||
        (ipParts[0] === 192 && ipParts[1] === 168)
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── WAKE ON LAN ───
router.post('/wol', async (req, res) => {
  try {
    const { mac } = req.body;
    if (!mac) return res.status(400).json({ error: 'MAC address required' });

    const wol = require('wake_on_lan');
    wol.wake(mac, {}, (err) => {
      if (err) return res.status(500).json({ error: 'WoL failed: ' + err.message });
      saveHistory('wol', { mac }, { status: 'Magic packet sent' });
      res.json({ success: true, message: `Magic packet sent to ${mac}` });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADVANCED PING ───
router.post('/ping', async (req, res) => {
  try {
    const { target, count, size } = req.body;
    if (!target) return res.status(400).json({ error: 'Target required' });

    const pingCount = Math.min(parseInt(count) || 4, 100);
    const packetSize = parseInt(size) || 64;
    const results = [];

    for (let i = 0; i < pingCount; i++) {
      const r = await ping.promise.probe(target, {
        timeout: 5,
        extra: process.platform === 'win32'
          ? ['-n', '1', '-l', String(packetSize)]
          : ['-c', '1', '-s', String(packetSize)]
      });
      results.push({
        seq: i + 1,
        status: r.alive ? 'reply' : 'timeout',
        rtt: r.alive ? parseFloat(r.time) || 0 : null,
        ttl: r.alive ? parseInt(r.output?.match(/TTL=(\d+)/i)?.[1]) || null : null
      });
    }

    const rtts = results.filter(r => r.rtt !== null).map(r => r.rtt);
    const stats = {
      sent: pingCount,
      received: rtts.length,
      lost: pingCount - rtts.length,
      lossPercent: (((pingCount - rtts.length) / pingCount) * 100).toFixed(1),
      min: rtts.length ? Math.min(...rtts).toFixed(2) : null,
      max: rtts.length ? Math.max(...rtts).toFixed(2) : null,
      avg: rtts.length ? (rtts.reduce((a, b) => a + b, 0) / rtts.length).toFixed(2) : null
    };

    saveHistory('ping', { target, count: pingCount, size: packetSize }, { results, stats });
    res.json({ results, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TCP CONNECT TEST ───
router.post('/tcp-test', async (req, res) => {
  try {
    const { target, port, timeout } = req.body;
    if (!target || !port) return res.status(400).json({ error: 'Target and port required' });

    const portNum = parseInt(port);
    if (portNum < 1 || portNum > 65535) return res.status(400).json({ error: 'Port must be between 1 and 65535' });

    const timeoutMs = parseInt(timeout) || 3000;
    const startTime = Date.now();

    // Resolve hostname to IP first
    let remoteAddress = target;
    try {
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(target)) {
        const resolver = new dns.Resolver();
        remoteAddress = await new Promise((resolve, reject) => {
          resolver.resolve4(target, (err, addresses) => {
            if (err) reject(err);
            else resolve(addresses[0]);
          });
        });
      }
    } catch (dnsErr) {
      return res.json({
        tcpTestSucceeded: false,
        remoteAddress: target,
        remotePort: portNum,
        responseTime: null,
        error: `DNS resolution failed: ${dnsErr.message}`
      });
    }

    // Attempt TCP connection
    const socket = new net.Socket();
    let completed = false;

    const result = await new Promise((resolve) => {
      const timer = setTimeout(() => {
        if (!completed) {
          completed = true;
          socket.destroy();
          resolve({
            tcpTestSucceeded: false,
            remoteAddress,
            remotePort: portNum,
            responseTime: null,
            error: 'Connection timeout'
          });
        }
      }, timeoutMs);

      socket.setTimeout(timeoutMs);

      socket.on('connect', () => {
        if (!completed) {
          completed = true;
          clearTimeout(timer);
          const responseTime = Date.now() - startTime;
          socket.destroy();
          resolve({
            tcpTestSucceeded: true,
            remoteAddress,
            remotePort: portNum,
            responseTime,
            error: null
          });
        }
      });

      socket.on('error', (err) => {
        if (!completed) {
          completed = true;
          clearTimeout(timer);
          socket.destroy();
          let errorMsg = err.message;
          if (err.code === 'ECONNREFUSED') errorMsg = 'Connection refused';
          else if (err.code === 'EHOSTUNREACH') errorMsg = 'Host unreachable';
          else if (err.code === 'ENETUNREACH') errorMsg = 'Network unreachable';
          else if (err.code === 'ETIMEDOUT') errorMsg = 'Connection timeout';
          
          resolve({
            tcpTestSucceeded: false,
            remoteAddress,
            remotePort: portNum,
            responseTime: null,
            error: errorMsg
          });
        }
      });

      socket.on('timeout', () => {
        if (!completed) {
          completed = true;
          clearTimeout(timer);
          socket.destroy();
          resolve({
            tcpTestSucceeded: false,
            remoteAddress,
            remotePort: portNum,
            responseTime: null,
            error: 'Connection timeout'
          });
        }
      });

      socket.connect(portNum, remoteAddress);
    });

    saveHistory('tcp-test', { target, port: portNum, timeout: timeoutMs }, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── IP GEOLOCATION LOOKUP ───
router.post('/ip-geolocation', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ error: 'IP address required' });

    const response = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
    
    if (response.data.status === 'fail') {
      return res.status(400).json({ error: response.data.message || 'Geolocation lookup failed' });
    }

    const result = {
      ip: response.data.query,
      country: response.data.country,
      countryCode: response.data.countryCode,
      region: response.data.regionName,
      city: response.data.city,
      zip: response.data.zip,
      lat: response.data.lat,
      lon: response.data.lon,
      timezone: response.data.timezone,
      isp: response.data.isp,
      org: response.data.org,
      as: response.data.as,
    };

    saveHistory('ip-geolocation', { ip }, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SSH HISTORY ───
router.get('/ssh/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM ssh_history ORDER BY last_connected DESC LIMIT 20').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ssh/save-history', (req, res) => {
  try {
    const { host, port, username } = req.body;
    if (!host || !username) return res.status(400).json({ error: 'Host and username required' });

    // Check if this connection already exists
    const existing = db.prepare('SELECT id FROM ssh_history WHERE host = ? AND port = ? AND username = ?').all(host, port || 22, username);
    
    if (existing.length > 0) {
      // Update last_connected timestamp
      db.prepare('UPDATE ssh_history SET last_connected = CURRENT_TIMESTAMP WHERE id = ?').run(existing[0].id);
    } else {
      // Insert new entry
      db.prepare('INSERT INTO ssh_history (host, port, username) VALUES (?, ?, ?)').run(host, port || 22, username);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
