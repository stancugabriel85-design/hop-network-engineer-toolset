# Changelog

## [1.1.0] - 2025-03-18

### Security
- Added comprehensive input validation to all POST endpoints in server/routes.js
- Added IP address, hostname, CIDR, and port number validation with security restrictions
- Added rate limiting for all API endpoints with express-rate-limit package
- Added stricter rate limiting for scan endpoints (ping-sweep, port-scan, mac-scan, traceroute)
- Added Socket.IO event throttling to prevent event flooding attacks
- Hardened SSH terminal connection handler with input validation and credential protection
- Added password length validation and prevented password logging/exposure
- Added SNMP session cleanup with try/finally blocks to prevent resource leaks

### Fixed  
- Fixed SNMP session memory leaks in bandwidth:subscribe and snmp:subscribe handlers
- Fixed BandwidthMonitor component to emit bandwidth:unsubscribe instead of monitor:unsubscribe
- Fixed SSH Terminal stale closure memory leak by using useRef for sessions
- Fixed backend process double-kill and use-after-null errors in electron.js
- Added missing SSH history HTTP endpoints that were returning 404 errors
- Fixed health check URL to use lightweight /api/health endpoint instead of /api/history

### Changed
- Replaced all `any` type annotations with proper TypeScript interfaces for socket events
- Added TypeScript interfaces for SshOutputEvent, SshStatusEvent, PingUpdateEvent, BandwidthUpdateEvent, SnmpUpdateEvent
- Updated socketRef type to use proper ReturnType<typeof getSocket> typing
- Added ip-regex package for robust IP address validation
- Migrated from deprecated xterm packages to new @xterm scoped packages
- Added LOCAL_SCAN_ALLOWED environment flag for controlling local network scanning restrictions
- Added proper socket event listener cleanup to prevent memory leaks
- Enhanced error handling and validation throughout the application

---

## [1.0.0] - 2025-03-17
### Added
- Initial release: Hop! Network Engineer Toolset
- 18 network diagnostic and monitoring tools
- SSH terminal with multi-session support
- Real-time ping, RTT, and bandwidth monitoring
- SNMP GET, Walk, and Grapher tools
- Subnet calculator, IP geolocation, Wake-on-LAN
- SQLite-backed scan history and alert log
- Electron desktop app with Windows/Mac/Linux builds

---
