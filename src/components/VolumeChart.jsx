import ReactApexChart from 'react-apexcharts'
import { useMemo } from 'react'
import { APEX_BASE, COLORS } from '../constants/chartTheme'
import { toTs, alignToOHLCV } from '../utils/formatters'

export default function VolumeChart({ ohlcv, indicators }) {
  const { series, options } = useMemo(() => {
    // Volume bars with up/down coloring
    const volData = ohlcv.map(c => ({
      x: toTs(c.date),
      y: c.volume,
      fillColor: c.close >= c.open ? COLORS.up : COLORS.down,
      strokeColor: c.close >= c.open ? COLORS.up : COLORS.down,
    }))

    // OBV (normalize to millions for readability)
    const obvRaw = alignToOHLCV(ohlcv, indicators.obv)
    const obvMax = Math.max(...obvRaw.map(d => Math.abs(d.y ?? 0)))
    const obvScale = obvMax > 0 ? obvMax : 1
    const obvData = obvRaw.map(d => ({
      x: d.x,
      y: d.y !== null ? (d.y / obvScale) * Math.max(...ohlcv.map(c => c.volume)) * 0.8 : null,
    }))

    const seriesArr = [
      { name: '거래량', type: 'bar', data: volData },
      { name: 'OBV(정규화)', type: 'line', data: obvData },
    ]

    const opts = {
      ...APEX_BASE,
      chart: {
        ...APEX_BASE.chart,
        id: 'kospi-volume',
        group: 'kospi',
        height: 120,
        type: 'bar',
      },
      stroke: {
        width: [0, 1.5],
        dashArray: [0, 0],
        curve: 'smooth',
      },
      colors: [COLORS.up, COLORS.cyan],
      plotOptions: {
        bar: {
          columnWidth: '85%',
          colors: {
            ranges: [
              { from: -Infinity, to: 0, color: COLORS.down },
              { from: 0, to: Infinity, color: COLORS.up },
            ],
          },
        },
      },
      yaxis: {
        labels: {
          style: { colors: '#64748b', fontSize: '9px' },
          formatter: v => {
            if (v == null) return ''
            const n = Math.abs(v)
            if (n >= 1e9) return `${(v / 1e9).toFixed(1)}B`
            if (n >= 1e6) return `${(v / 1e6).toFixed(0)}M`
            return v.toFixed(0)
          },
        },
      },
      xaxis: {
        ...APEX_BASE.xaxis,
        labels: {
          ...APEX_BASE.xaxis.labels,
          style: { colors: '#64748b', fontSize: '9px' },
          datetimeUTC: false,
          format: 'MM/dd',
        },
        axisBorder: { color: '#1e2d45' },
        axisTicks: { color: '#1e2d45' },
      },
      legend: { show: false },
      tooltip: {
        ...APEX_BASE.tooltip,
        y: {
          formatter: (val, { seriesIndex }) => {
            if (seriesIndex === 0) {
              const n = Math.abs(val)
              if (n >= 1e9) return `${(val / 1e9).toFixed(2)}B주`
              if (n >= 1e6) return `${(val / 1e6).toFixed(1)}M주`
              return `${val?.toLocaleString()}주`
            }
            return 'OBV (정규화)'
          },
        },
      },
    }

    return { series: seriesArr, options: opts }
  }, [ohlcv, indicators])

  return (
    <div className="card py-2">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-xs font-medium text-slate-400">
          거래량 <span className="text-slate-500">+ OBV</span>
        </span>
        <div className="flex gap-3 text-xs text-slate-500">
          <span>
            <span className="text-chart-up">■</span> 상승
            <span className="text-chart-down ml-2">■</span> 하락
          </span>
          <span className="text-accent-cyan">— OBV(정규화)</span>
        </div>
      </div>
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={120}
      />
    </div>
  )
}
