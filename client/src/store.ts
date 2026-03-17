import { create } from 'zustand';

export interface Tab {
  id: string;
  title: string;
  tool: string;
  icon: string;
}

export interface Alert {
  id?: number;
  message: string;
  severity: string;
  host?: string;
  timestamp?: number;
  acknowledged?: number;
}

export interface PingUpdate {
  host: string;
  rtt: number | null;
  status: string;
  timestamp: number;
}

export interface BandwidthUpdate {
  ifIndex: number;
  inMbps: number;
  outMbps: number;
  timestamp: number;
}

export interface SnmpUpdate {
  oid: string;
  type?: string;
  value: number | string | null;
  error?: string;
  timestamp: number;
}

interface AppState {
  tabs: Tab[];
  activeTabId: string | null;
  alerts: Alert[];
  unacknowledgedAlerts: number;
  sidebarCollapsed: boolean;

  pingUpdates: Record<string, PingUpdate[]>;
  bandwidthUpdates: BandwidthUpdate[];
  snmpUpdates: SnmpUpdate[];

  addTab: (tab: Tab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  toggleSidebar: () => void;

  addAlert: (alert: Alert) => void;
  clearAlerts: () => void;

  addPingUpdate: (update: PingUpdate) => void;
  clearPingUpdates: () => void;
  addBandwidthUpdate: (update: BandwidthUpdate) => void;
  clearBandwidthUpdates: () => void;
  addSnmpUpdate: (update: SnmpUpdate) => void;
  clearSnmpUpdates: () => void;
}

export const useStore = create<AppState>((set) => ({
  tabs: [],
  activeTabId: null,
  alerts: [],
  unacknowledgedAlerts: 0,
  sidebarCollapsed: false,
  pingUpdates: {},
  bandwidthUpdates: [],
  snmpUpdates: [],

  addTab: (tab) => set((state) => {
    const exists = state.tabs.find(t => t.id === tab.id);
    if (exists) return { activeTabId: tab.id };
    return { tabs: [...state.tabs, tab], activeTabId: tab.id };
  }),

  removeTab: (id) => set((state) => {
    const newTabs = state.tabs.filter(t => t.id !== id);
    const newActive = state.activeTabId === id
      ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
      : state.activeTabId;
    return { tabs: newTabs, activeTabId: newActive };
  }),

  setActiveTab: (id) => set({ activeTabId: id }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 100),
    unacknowledgedAlerts: state.unacknowledgedAlerts + 1,
  })),
  clearAlerts: () => set({ alerts: [], unacknowledgedAlerts: 0 }),

  addPingUpdate: (update) => set((state) => {
    const hostUpdates = state.pingUpdates[update.host] || [];
    const newUpdates = [...hostUpdates, update].slice(-120);
    return { pingUpdates: { ...state.pingUpdates, [update.host]: newUpdates } };
  }),
  clearPingUpdates: () => set({ pingUpdates: {} }),

  addBandwidthUpdate: (update) => set((state) => ({
    bandwidthUpdates: [...state.bandwidthUpdates, update].slice(-120),
  })),
  clearBandwidthUpdates: () => set({ bandwidthUpdates: [] }),

  addSnmpUpdate: (update) => set((state) => ({
    snmpUpdates: [...state.snmpUpdates, update].slice(-120),
  })),
  clearSnmpUpdates: () => set({ snmpUpdates: [] }),
}));
