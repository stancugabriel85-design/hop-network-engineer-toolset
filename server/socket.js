const ping = require('ping');
const db = require('./db');

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    let monitorIntervals = [];
    let snmpIntervals = [];
    let bandwidthIntervals = [];

    // Event throttling
    let eventCount = 0;
    const eventWindow = setInterval(() => { eventCount = 0; }, 1000);

    const checkEventLimit = () => {
      eventCount++;
      if (eventCount > 50) {
        socket.emit('error', { message: 'Too many events' });
        return true; // Block the event
      }
      return false; // Allow the event
    };

    socket.on('monitor:subscribe', ({ hosts, interval }) => {
      if (checkEventLimit()) return;
      // Clear existing intervals
      monitorIntervals.forEach(clearInterval);
      monitorIntervals = [];

      const pingInterval = interval || 5000;

      if (hosts && hosts.length > 0) {
        const iv = setInterval(async () => {
          for (const host of hosts) {
            try {
              const result = await ping.promise.probe(host, { timeout: 3 });
              const update = {
                host,
                rtt: result.alive ? parseFloat(result.time) || 0 : null,
                status: result.alive ? 'up' : 'down',
                timestamp: Date.now()
              };
              socket.emit('ping:update', update);

              if (!result.alive) {
                const alertMsg = `Host ${host} is DOWN`;
                const alert = { message: alertMsg, severity: 'critical', host, timestamp: Date.now() };
                socket.emit('alert:new', alert);
                try {
                  db.prepare('INSERT INTO alerts (tool, ip, message, severity) VALUES (?, ?, ?, ?)')
                    .run('ping-monitor', host, alertMsg, 'critical');
                } catch (e) {
                  console.error('Failed to save alert:', e.message);
                }
              }
            } catch (err) {
              socket.emit('ping:update', {
                host,
                rtt: null,
                status: 'error',
                timestamp: Date.now()
              });
            }
          }
        }, pingInterval);
        monitorIntervals.push(iv);
      }
    });

    socket.on('monitor:unsubscribe', () => {
      if (checkEventLimit()) return;
      monitorIntervals.forEach(clearInterval);
      monitorIntervals = [];
    });

    socket.on('snmp:subscribe', ({ ip, oid, community, interval }) => {
      if (checkEventLimit()) return;
      snmpIntervals.forEach(clearInterval);
      snmpIntervals = [];

      try {
        const snmp = require('net-snmp');
        const pollInterval = interval || 5000;

        const iv = setInterval(() => {
          const session = snmp.createSession(ip, community || 'public');
          try {
            session.get([oid], (err, varbinds) => {
              session.close();
              if (err) {
                socket.emit('snmp:update', { oid, value: null, error: err.message, timestamp: Date.now() });
                return;
              }
              for (const vb of varbinds) {
                socket.emit('snmp:update', {
                  oid: vb.oid,
                  type: snmp.ObjectType[vb.type] || vb.type,
                  value: vb.value ? parseFloat(vb.value.toString()) || vb.value.toString() : '',
                  timestamp: Date.now()
                });
              }
            });
          } catch (err) {
            session.close();
            socket.emit('snmp:update', { error: err.message, timestamp: Date.now() });
          }
        }, pollInterval);
        snmpIntervals.push(iv);
      } catch (err) {
        socket.emit('snmp:update', { error: err.message, timestamp: Date.now() });
      }
    });

    socket.on('snmp:unsubscribe', () => {
      if (checkEventLimit()) return;
      snmpIntervals.forEach(clearInterval);
      snmpIntervals = [];
    });

    socket.on('bandwidth:subscribe', ({ ip, community, ifIndex, interval }) => {
      if (checkEventLimit()) return;
      try {
        const snmp = require('net-snmp');
        const pollInterval = interval || 5000;
        let prevIn = null;
        let prevOut = null;
        let prevTime = null;

        const inOid = `1.3.6.1.2.1.2.2.1.10.${ifIndex || 1}`;
        const outOid = `1.3.6.1.2.1.2.2.1.16.${ifIndex || 1}`;

        const iv = setInterval(() => {
          const session = snmp.createSession(ip, community || 'public');
          try {
            session.get([inOid, outOid], (err, varbinds) => {
              session.close();
              if (err) return;

              const now = Date.now();
              const inOctets = parseInt(varbinds[0]?.value?.toString()) || 0;
              const outOctets = parseInt(varbinds[1]?.value?.toString()) || 0;

              if (prevIn !== null && prevTime !== null) {
                const timeDiff = (now - prevTime) / 1000;
                const inMbps = ((inOctets - prevIn) * 8 / timeDiff / 1000000).toFixed(3);
                const outMbps = ((outOctets - prevOut) * 8 / timeDiff / 1000000).toFixed(3);

                socket.emit('bandwidth:update', {
                  ifIndex: ifIndex || 1,
                  inMbps: parseFloat(inMbps),
                  outMbps: parseFloat(outMbps),
                  timestamp: now
                });
              }

              prevIn = inOctets;
              prevOut = outOctets;
              prevTime = now;
            });
          } catch (err) {
            session.close();
            socket.emit('bandwidth:update', { error: err.message, timestamp: Date.now() });
          }
        }, pollInterval);
        bandwidthIntervals.push(iv);
      } catch (err) {
        console.error('Bandwidth monitor error:', err.message);
      }
    });

    socket.on('bandwidth:unsubscribe', () => {
      if (checkEventLimit()) return;
      bandwidthIntervals.forEach(clearInterval);
      bandwidthIntervals = [];
    });

    // ─── SSH TERMINAL ───
    const sshSessions = new Map();

    socket.on('ssh:connect', ({ sessionId, host, port, username, password }) => {
      if (checkEventLimit()) return;
      try {
        // Input validation
        if (!host || typeof host !== 'string' || !/^[a-zA-Z0-9._-]{1,253}$/.test(host)) {
          socket.emit('ssh:status', { sessionId, status: 'error', message: 'Invalid connection parameters' });
          return;
        }

        const portNum = parseInt(port) || 22;
        if (portNum < 1 || portNum > 65535) {
          socket.emit('ssh:status', { sessionId, status: 'error', message: 'Invalid connection parameters' });
          return;
        }

        if (!username || typeof username !== 'string' || !/^[a-zA-Z0-9._@-]{1,64}$/.test(username)) {
          socket.emit('ssh:status', { sessionId, status: 'error', message: 'Invalid connection parameters' });
          return;
        }

        if (!password || typeof password !== 'string' || password.length > 256) {
          socket.emit('ssh:status', { sessionId, status: 'error', message: 'Invalid connection parameters' });
          return;
        }

        const { Client } = require('ssh2');
        const conn = new Client();

        conn.on('ready', () => {
          console.log(`SSH connection ready: ${sessionId}`);
          socket.emit('ssh:status', { sessionId, status: 'connected', message: 'Connected successfully' });

          conn.shell((err, stream) => {
            if (err) {
              socket.emit('ssh:status', { sessionId, status: 'error', message: err.message });
              return;
            }

            sshSessions.set(sessionId, { conn, stream });

            stream.on('data', (data) => {
              socket.emit('ssh:output', { sessionId, data: data.toString('utf-8') });
            });

            stream.on('close', () => {
              socket.emit('ssh:status', { sessionId, status: 'disconnected', message: 'Session closed' });
              sshSessions.delete(sessionId);
              conn.end();
            });

            stream.stderr.on('data', (data) => {
              socket.emit('ssh:output', { sessionId, data: data.toString('utf-8') });
            });
          });
        });

        conn.on('error', (err) => {
          console.error('SSH connection error:', err.message);
          socket.emit('ssh:status', { sessionId, status: 'error', message: err.message });
          sshSessions.delete(sessionId);
        });

        conn.on('close', () => {
          socket.emit('ssh:status', { sessionId, status: 'disconnected', message: 'Connection closed' });
          sshSessions.delete(sessionId);
        });

        conn.connect({
          host,
          port: portNum,
          username,
          password,
          readyTimeout: 10000,
        });
      } catch (err) {
        console.error('SSH connect error:', err.message);
        socket.emit('ssh:status', { sessionId, status: 'error', message: err.message });
      }
    });

    socket.on('ssh:input', ({ sessionId, data }) => {
      if (checkEventLimit()) return;
      const session = sshSessions.get(sessionId);
      if (session && session.stream) {
        session.stream.write(data);
      }
    });

    socket.on('ssh:resize', ({ sessionId, rows, cols }) => {
      if (checkEventLimit()) return;
      const session = sshSessions.get(sessionId);
      if (session && session.stream) {
        session.stream.setWindow(rows, cols);
      }
    });

    socket.on('ssh:disconnect', ({ sessionId }) => {
      if (checkEventLimit()) return;
      const session = sshSessions.get(sessionId);
      if (session) {
        if (session.stream) session.stream.end();
        if (session.conn) session.conn.end();
        sshSessions.delete(sessionId);
        socket.emit('ssh:status', { sessionId, status: 'disconnected', message: 'Disconnected by user' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      monitorIntervals.forEach(clearInterval);
      snmpIntervals.forEach(clearInterval);
      bandwidthIntervals.forEach(clearInterval);
      monitorIntervals = [];
      snmpIntervals = [];
      bandwidthIntervals = [];

      // Clean up event throttling
      clearInterval(eventWindow);

      // Clean up SSH sessions
      sshSessions.forEach((session, sessionId) => {
        if (session.stream) session.stream.end();
        if (session.conn) session.conn.end();
      });
      sshSessions.clear();
    });
  });
}

module.exports = setupSocket;
