export const COLORS = {
  bg: '#0a0f1a',
  card: '#0f1623',
  border: '#1e2d45',
  text: '#e2e8f0',
  muted: '#64748b',
  cyan: '#00d4ff',
  green: '#00ff88',
  red: '#ff3366',
  amber: '#ffaa00',
  // Candlestick
  up: '#00c087',
  down: '#ff4060',
  // Moving averages
  ma5: '#FFD700',
  ma20: '#FF69B4',
  ma60: '#00BFFF',
  ma120: '#FF8C00',
  ma240: '#9370DB',
  // BB
  bbUpper: '#4dc3ff',
  bbLower: '#4dc3ff',
  bbFill: 'rgba(77, 195, 255, 0.06)',
  // RSI zones
  rsiOverbought: 'rgba(255, 51, 102, 0.15)',
  rsiOversold: 'rgba(0, 255, 136, 0.15)',
  // Signals
  buy: '#00ff88',
  sell: '#ff3366',
  // Correlation
  qqq: '#a78bfa',
  sox: '#fb923c',
}

export const APEX_BASE = {
  chart: {
    background: 'transparent',
    foreColor: '#64748b',
    toolbar: {
      show: true,
      tools: {
        download: false,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
      },
    },
    zoom: { enabled: true, type: 'x' },
    animations: { enabled: false },
    fontFamily: "'JetBrains Mono', monospace",
  },
  grid: {
    borderColor: '#1e2d45',
    strokeDashArray: 3,
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
  },
  xaxis: {
    type: 'datetime',
    labels: {
      style: { colors: '#64748b', fontSize: '10px' },
      datetimeUTC: false,
    },
    axisBorder: { color: '#1e2d45' },
    axisTicks: { color: '#1e2d45' },
    crosshairs: { stroke: { color: '#1e2d45', width: 1, dashArray: 3 } },
    tooltip: { enabled: false },
  },
  yaxis: {
    labels: {
      style: { colors: '#64748b', fontSize: '10px' },
    },
  },
  tooltip: {
    theme: 'dark',
    x: { format: 'yyyy-MM-dd' },
    shared: true,
    intersect: false,
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'left',
    labels: { colors: '#94a3b8' },
    markers: { width: 8, height: 8, radius: 2 },
    fontSize: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    itemMargin: { horizontal: 8 },
  },
}

export const MA_META = [
  { key: 'ma5',   label: 'MA5',   color: '#FFD700', width: 1, dashArray: 0 },
  { key: 'ma20',  label: 'MA20',  color: '#FF69B4', width: 1.5, dashArray: 0 },
  { key: 'ma60',  label: 'MA60',  color: '#00BFFF', width: 1.5, dashArray: 0 },
  { key: 'ma120', label: 'MA120', color: '#FF8C00', width: 1, dashArray: 4 },
  { key: 'ma240', label: 'MA240', color: '#9370DB', width: 1, dashArray: 4 },
]
