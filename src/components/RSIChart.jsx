import ReactApexChart from 'react-apexcharts'
import { useMemo } from 'react'
import { APEX_BASE, COLORS } from '../constants/chartTheme'
import { alignToOHLCV } from '../utils/formatters'

export default function RSIChart({ ohlcv, indicators }) {
  const { series, options } = useMemo(() => {
    const rsiData = alignToOHLCV(ohlcv, indicators.rsi14)
    const vkospiData = alignToOHLCV(ohlcv, indicators.vkospi)
    const hasVkospi = vkospiData.some(d => d.y !== null)

    const seriesArr = [
      { name: 'RSI(14)', type: 'line', data: rsiData },
      ...(hasVkospi ? [{ name: 'VKOSPI', type: 'line', data: vkospiData }] : []),
    ]

    const opts = {
      ...APEX_BASE,
      chart: {
        ...APEX_BASE.chart,
        id: 'kospi-rsi',
        group: 'kospi',
        height: 140,
        type: 'line',
        sparkline: { enabled: false },
      },
      stroke: {
        width: [2, 1],
        dashArray: [0, 3],
        curve: 'smooth',
      },
      colors: [COLORS.cyan, COLORS.amber],
      fill: {
        type: ['solid', 'solid'],
        opacity: [1, 0.7],
      },
      annotations: {
        yaxis: [
          {
            y: 70,
            borderColor: 'rgba(255,51,102,0.6)',
            strokeDashArray: 4,
            borderWidth: 1,
            label: {
              borderColor: 'transparent',
              style: { color: COLORS.red, background: 'transparent', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace" },
              text: '과매수(70)', position: 'left', offsetX: 6, offsetY: -4,
            },
          },
          {
            y: 30,
            borderColor: 'rgba(0,255,136,0.6)',
            strokeDashArray: 4,
            borderWidth: 1,
            label: {
              borderColor: 'transparent',
              style: { color: COLORS.green, background: 'transparent', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace" },
              text: '과매도(30)', position: 'left', offsetX: 6, offsetY: -4,
            },
          },
          {
            y: 50,
            borderColor: 'rgba(100,116,139,0.3)',
            strokeDashArray: 4,
            borderWidth: 1,
          },
        ],
      },
      yaxis: {
        min: 0, max: 100,
        tickAmount: 4,
        labels: {
          style: { colors: '#64748b', fontSize: '9px' },
          formatter: v => v.toFixed(0),
        },
      },
      xaxis: {
        ...APEX_BASE.xaxis,
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      legend: { show: false },
      tooltip: {
        ...APEX_BASE.tooltip,
        y: {
          formatter: (val, { seriesIndex }) =>
            seriesIndex === 0
              ? `RSI: ${val?.toFixed(1) ?? '—'}`
              : `VKOSPI: ${val?.toFixed(2) ?? '—'}`,
        },
      },
    }

    return { series: seriesArr, options: opts }
  }, [ohlcv, indicators])

  return (
    <div className="card py-2">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-xs font-medium text-slate-400">
          RSI <span className="text-accent-cyan">(14)</span>
          {indicators.vkospi?.length > 0 && (
            <span className="ml-3 text-slate-500">+ VKOSPI</span>
          )}
        </span>
        <div className="flex gap-3 text-xs">
          <span className="text-accent-red">과매수 ▶ 70</span>
          <span className="text-accent-green">과매도 ▶ 30</span>
        </div>
      </div>
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={140}
      />
    </div>
  )
}
