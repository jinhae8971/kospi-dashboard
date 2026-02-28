import ReactApexChart from 'react-apexcharts'
import { useMemo } from 'react'
import { APEX_BASE, COLORS } from '../constants/chartTheme'
import { toTs } from '../utils/formatters'

export default function MACDChart({ ohlcv, indicators }) {
  const { series, options } = useMemo(() => {
    const dateSet = new Set(ohlcv.map(c => c.date))

    const filter = arr =>
      (arr || []).filter(d => dateSet.has(d.date))

    const macdArr = filter(indicators.macd)
    const sigArr = filter(indicators.macd_signal)
    const histArr = filter(indicators.macd_hist)

    // Color histogram bars
    const histData = histArr.map(d => ({
      x: toTs(d.date),
      y: d.value,
      fillColor: d.value >= 0 ? COLORS.up : COLORS.down,
    }))

    const seriesArr = [
      {
        name: 'MACD히스토그램',
        type: 'bar',
        data: histData,
      },
      {
        name: 'MACD',
        type: 'line',
        data: macdArr.map(d => ({ x: toTs(d.date), y: d.value })),
      },
      {
        name: '시그널',
        type: 'line',
        data: sigArr.map(d => ({ x: toTs(d.date), y: d.value })),
      },
    ]

    const opts = {
      ...APEX_BASE,
      chart: {
        ...APEX_BASE.chart,
        id: 'kospi-macd',
        group: 'kospi',
        height: 140,
        type: 'bar',
      },
      stroke: {
        width: [0, 2, 1.5],
        dashArray: [0, 0, 4],
        curve: 'smooth',
      },
      colors: [COLORS.up, COLORS.cyan, COLORS.amber],
      plotOptions: {
        bar: {
          columnWidth: '80%',
          colors: {
            ranges: [
              { from: -Infinity, to: 0, color: COLORS.down },
              { from: 0, to: Infinity, color: COLORS.up },
            ],
          },
        },
      },
      annotations: {
        yaxis: [{
          y: 0,
          borderColor: 'rgba(100,116,139,0.4)',
          borderWidth: 1,
          strokeDashArray: 0,
        }],
      },
      yaxis: {
        labels: {
          style: { colors: '#64748b', fontSize: '9px' },
          formatter: v => v?.toFixed(1) ?? '',
        },
      },
      xaxis: {
        ...APEX_BASE.xaxis,
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      legend: {
        ...APEX_BASE.legend,
        show: true,
        markers: { width: 8, height: 8 },
      },
      tooltip: {
        ...APEX_BASE.tooltip,
        y: {
          formatter: (val, { seriesIndex }) => {
            const labels = ['히스토그램', 'MACD', '시그널']
            return `${labels[seriesIndex]}: ${val?.toFixed(2) ?? '—'}`
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
          MACD <span className="text-slate-500">(12, 26, 9)</span>
        </span>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 inline-block" style={{ backgroundColor: COLORS.cyan }} />
            MACD
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 inline-block border-dashed border-b border-amber-400" />
            시그널
          </span>
        </div>
      </div>
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={140}
      />
    </div>
  )
}
