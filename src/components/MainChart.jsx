import ReactApexChart from 'react-apexcharts'
import { useMemo } from 'react'
import { APEX_BASE, COLORS, MA_META } from '../constants/chartTheme'
import { toTs, alignToOHLCV } from '../utils/formatters'

export default function MainChart({ ohlcv, indicators, signals, supportResistance }) {
  const { series, options } = useMemo(() => {
    // ── Candlestick series ────────────────────────────────────────────────
    const candleSeries = {
      name: 'KOSPI',
      type: 'candlestick',
      data: ohlcv.map(c => ({
        x: toTs(c.date),
        y: [c.open, c.high, c.low, c.close].map(v => v ?? null),
      })),
    }

    // ── MA series ─────────────────────────────────────────────────────────
    const maSeries = MA_META.map(m => ({
      name: m.label,
      type: 'line',
      data: alignToOHLCV(ohlcv, indicators[m.key]),
    }))

    // ── Bollinger Band series ─────────────────────────────────────────────
    const bbUpper = {
      name: 'BB상단',
      type: 'line',
      data: alignToOHLCV(ohlcv, indicators.bb_upper),
    }
    const bbLower = {
      name: 'BB하단',
      type: 'line',
      data: alignToOHLCV(ohlcv, indicators.bb_lower),
    }

    const seriesArr = [candleSeries, ...maSeries, bbUpper, bbLower]

    // ── Signal annotations ────────────────────────────────────────────────
    const sigPoints = signals
      .filter(s => s.price)
      .map(s => ({
        x: toTs(s.date),
        y: s.price,
        marker: {
          size: s.strength === 'STRONG' ? 8 : s.strength === 'MODERATE' ? 6 : 4,
          fillColor: s.type === 'BUY' ? COLORS.buy : COLORS.sell,
          strokeColor: s.type === 'BUY' ? COLORS.buy : COLORS.sell,
          strokeWidth: 1,
          shape: s.type === 'BUY' ? 'triangle' : 'triangle-down',
          radius: 2,
          OffsetY: s.type === 'BUY' ? 10 : -10,
        },
        label: {
          borderColor: 'transparent',
          style: {
            color: s.type === 'BUY' ? COLORS.buy : COLORS.sell,
            background: 'transparent',
            fontSize: '10px',
            fontFamily: "'JetBrains Mono', monospace",
          },
          text: s.type === 'BUY' ? '▲' : '▼',
          offsetY: s.type === 'BUY' ? 28 : -28,
        },
      }))

    // ── Support/Resistance annotations ────────────────────────────────────
    const srLines = (supportResistance || []).slice(0, 6).map(sr => ({
      y: sr.level,
      y2: null,
      strokeDashArray: 4,
      borderColor: sr.type === 'SUPPORT' ? 'rgba(0,255,136,0.5)' : 'rgba(255,51,102,0.5)',
      borderWidth: 1,
      label: {
        borderColor: 'transparent',
        style: {
          color: sr.type === 'SUPPORT' ? COLORS.green : COLORS.red,
          background: 'transparent',
          fontSize: '9px',
          fontFamily: "'JetBrains Mono', monospace",
        },
        text: `${sr.type === 'SUPPORT' ? 'S' : 'R'} ${sr.level.toLocaleString()}`,
        position: 'left',
        offsetX: 6,
        offsetY: -4,
      },
    }))

    // ── Chart options ─────────────────────────────────────────────────────
    const opts = {
      ...APEX_BASE,
      chart: {
        ...APEX_BASE.chart,
        id: 'kospi-main',
        group: 'kospi',
        height: 420,
        type: 'candlestick',
      },
      plotOptions: {
        candlestick: {
          colors: { upward: COLORS.up, downward: COLORS.down },
          wick: { useFillColor: true },
        },
      },
      stroke: {
        width: [0, ...MA_META.map(m => m.width), 1, 1],
        dashArray: [0, ...MA_META.map(m => m.dashArray), 3, 3],
        curve: 'smooth',
      },
      colors: [
        COLORS.up,
        ...MA_META.map(m => m.color),
        COLORS.bbUpper,
        COLORS.bbLower,
      ],
      legend: {
        ...APEX_BASE.legend,
        show: true,
      },
      annotations: {
        points: sigPoints,
        yaxis: srLines,
      },
      yaxis: {
        ...APEX_BASE.yaxis,
        labels: {
          ...APEX_BASE.yaxis.labels,
          formatter: v => v ? v.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) : '',
        },
        tooltip: { enabled: true },
      },
      tooltip: {
        ...APEX_BASE.tooltip,
        custom({ seriesIndex, dataPointIndex, w }) {
          if (seriesIndex !== 0) return ''
          const d = ohlcv[dataPointIndex]
          if (!d) return ''
          const sig = signals.find(s => s.date === d.date)
          const color = d.close >= d.open ? COLORS.up : COLORS.down
          const sigHtml = sig
            ? `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #1e2d45">
                <span style="color:${sig.type === 'BUY' ? COLORS.buy : COLORS.sell}">
                  ${sig.type} Signal: ${sig.reason} (${sig.strength})
                </span>
               </div>`
            : ''
          return `
            <div style="padding:10px;font-family:'JetBrains Mono',monospace;font-size:11px;min-width:180px">
              <div style="color:#00d4ff;margin-bottom:6px;font-size:12px">${d.date}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px">
                <span style="color:#64748b">시가</span><span style="color:${color}">${d.open?.toLocaleString('ko-KR')}</span>
                <span style="color:#64748b">고가</span><span style="color:${COLORS.up}">${d.high?.toLocaleString('ko-KR')}</span>
                <span style="color:#64748b">저가</span><span style="color:${COLORS.down}">${d.low?.toLocaleString('ko-KR')}</span>
                <span style="color:#64748b">종가</span><span style="color:${color};font-weight:600">${d.close?.toLocaleString('ko-KR')}</span>
                <span style="color:#64748b">거래량</span><span style="color:#94a3b8">${(d.volume / 1e6).toFixed(0)}M</span>
              </div>
              ${sigHtml}
            </div>`
        },
      },
    }

    return { series: seriesArr, options: opts }
  }, [ohlcv, indicators, signals, supportResistance])

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-300">
          KOSPI <span className="text-accent-cyan">캔들스틱</span> + 이동평균 + 볼린저밴드
        </h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {MA_META.map(m => (
            <span key={m.key} className="flex items-center gap-1">
              <span className="inline-block w-5 h-0.5" style={{ backgroundColor: m.color }} />
              {m.label}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.buy + '33', border: `1px solid ${COLORS.buy}` }} />▲매수
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.sell + '33', border: `1px solid ${COLORS.sell}` }} />▼매도
          </span>
        </div>
      </div>
      <ReactApexChart
        options={options}
        series={series}
        type="candlestick"
        height={420}
      />
    </div>
  )
}
