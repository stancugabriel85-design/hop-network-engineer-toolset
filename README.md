# Hop! - Network Engineer Toolset

A professional dark-themed dashboard for network diagnostics and monitoring, built with React, Node.js, and Socket.IO.

![Hop!](https://img.shields.io/badge/version-1.0.0-cyan) ![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

### Network Discovery
- **Ping Sweep** - Discover active hosts on a network range
- **Port Scanner** - Scan for open ports on target hosts
- **MAC Scanner** - Identify devices by MAC address and manufacturer

### Real-Time Monitoring
- **Ping Monitor** - Continuous host availability monitoring with alerts
- **RTT Monitor** - Response time tracking with live charts
- **Bandwidth Monitor** - SNMP-based interface bandwidth monitoring

### Diagnostics
- **Advanced Ping** - Detailed ping statistics with RTT charts
- **Traceroute** - Network path visualization
- **DNS Lookup** - Resolve A, MX, NS, TXT, CNAME, and other DNS records
- **WHOIS** - Domain and IP registration information

### SNMP Tools
- **SNMP GET** - Query individual SNMP OIDs
- **SNMP Walk** - Walk SNMP MIB trees
- **SNMP Grapher** - Real-time SNMP value graphing

### Utilities
- **Subnet Calculator** - Calculate network details from IP/CIDR
- **Password Generator** - Generate secure random passwords
- **Wake-on-LAN** - Send magic packets to wake devices

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS (dark theme)
- Recharts (data visualization)
- Zustand (state management)
- Socket.IO Client (real-time updates)
- React Hot Toast (notifications)
- Lucide React (icons)

**Backend:**
- Node.js + Express
- Socket.IO (WebSocket server)
- SQLite (sql.js - pure JS implementation)
- Network libraries: ping, net-snmp, traceroute, node-arp, whois, wake_on_lan

## 📦 Installation

### Prerequisites
- Node.js 16+ installed
- Network access for scanning/monitoring operations

### Setup

1. **Install root dependencies:**
```bash
npm install
```

2. **Install client dependencies:**
```bash
cd client
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

## 🚀 Running the Application

### Development Mode (both servers)
```bash
npm run dev
```

This starts:
- Backend server on `http://localhost:3001`
- React dev server on `http://localhost:3002`

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm run client
```

## 🎨 UI Overview

- **Dark Theme** - Navy blue background with cyan/green accents
- **Tabbed Interface** - Open multiple tools simultaneously
- **Sidebar Navigation** - Organized tool categories
- **Live Charts** - Real-time data visualization with Recharts
- **Toast Notifications** - Non-intrusive alerts
- **Export Functionality** - CSV export for all scan results

## 📡 API Endpoints

### Network Discovery
- `POST /api/ping-sweep` - Ping range scan
- `POST /api/port-scan` - Port scanning
- `POST /api/mac-scan` - MAC address discovery

### Diagnostics
- `POST /api/ping` - Advanced ping with stats
- `POST /api/traceroute` - Network path trace
- `POST /api/dns` - DNS record lookup
- `POST /api/whois` - WHOIS information

### SNMP
- `POST /api/snmp/get` - SNMP GET request
- `POST /api/snmp/walk` - SNMP Walk operation

### Utilities
- `POST /api/subnet-calc` - Subnet calculations
- `POST /api/wol` - Wake-on-LAN magic packet

### History & Alerts
- `GET /api/history` - Scan history
- `GET /api/alerts` - Alert log
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert

## 🔌 Socket.IO Events

### Client → Server
- `monitor:subscribe` - Start monitoring hosts
- `monitor:unsubscribe` - Stop monitoring
- `snmp:subscribe` - Start SNMP polling
- `snmp:unsubscribe` - Stop SNMP polling
- `bandwidth:subscribe` - Start bandwidth monitoring

### Server → Client
- `ping:update` - Host ping status update
- `bandwidth:update` - Bandwidth metrics
- `snmp:update` - SNMP value update
- `alert:new` - New alert notification

## 💾 Database

SQLite database (`data/network-tools.db`) stores:
- **devices** - Network device inventory
- **scan_history** - Historical scan results
- **alerts** - System alerts and notifications

## 🔒 Security Notes

- No authentication implemented (local network use)
- SNMP community strings transmitted in plain text
- Designed for trusted network environments
- Consider adding authentication for production use

## 🐛 Troubleshooting

**Port already in use:**
- Backend: Change `PORT` in `.env` or environment variable
- Frontend: React will auto-increment port (3002, 3003, etc.)

**SNMP not working:**
- Verify SNMP is enabled on target device
- Check community string (default: `public`)
- Ensure firewall allows UDP port 161

**Ping/Traceroute issues:**
- May require elevated privileges on some systems
- Windows: Run as Administrator
- Linux/Mac: May need `sudo` or capabilities

**Database errors:**
- Delete `data/network-tools.db` to reset
- Check write permissions in `data/` directory

## 📝 License

MIT License - feel free to use and modify for your needs.

## 🤝 Contributing

This is a standalone network toolkit. Feel free to fork and customize for your environment.

---

**Built with ❤️ for network engineers and IT professionals**
