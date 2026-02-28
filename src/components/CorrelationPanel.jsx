import ReactApexChart from 'react-apexcharts'
import { useMemo } from 'react'
import { APEX_BASE, COLORS } from '../constants/chartTheme'
import { toTs, fmtCorr, fmtPct } from '../utils/formatters'

function CorrBadge({ label, value, color }) {
  const abs = Math.abs(value ?? 0)
  const strength = abs >= 0.7 ? '강' : abs >= 0.4 ? '중' : '약'
  return (
    <div className="flex-1 card text-center min-w-0">
      <div className="stat-label mb-1">{label}</div>
      <div className="text-xl font-bold font-mono" style={{ color }}>
        {fmtCorr(value)}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">상관 {strength}</div>
    </div>
  )
}

function RetBadge({ label, value, color }) {
  if (value == null) return null
  const isUp = value >= 0
  return (
    <div className="flex-1 card min-w-0 text-center">
      <div className="stat-label mb-1">{label} (1Y)</div>
      <div
        className="text-base font-bold font-mono"
        style={{ color: isUp ? COLORS.up : COLORS.down }}
      >
        {isUp ? '▲' : '▼'} {fmtPct(value)}
      </div>
    </div>
  )
}

export default function CorrelationPanel({ comparison, correlations }) {
  const { normSeries, normOpts, corrSeries, corrOpts } = useMemo(() => {
    // ── Normalized Performance ─────────────────────────────────────────
    const normSeriesArr = []
    const addNorm = (key, name, color) => {
      const arr = comparison?.[key]
      if (!arr?.length) return
      normSeriesArr.push({
        name,
        data: arr.map(d => ({ x: toTs(d.date), y: d.value })),
      })
    }
    addNorm('kospi_normalized', 'KOSPI', COLORS.cyan)
    addNorm('qqq_normalized', 'QQQ', COLORS.qqq)
    addNorm('sox_normalized', 'SOX', COLORS.sox)

    const nOpts = {
      ...APEX_BASE,
      chart: { ...APEX_BASE.chart, id: 'norm-perf', height: 200, type: 'line' },
      stroke: { width: [2, 2, 2], curve: 'smooth', dashArray: [0, 4, 6] },
      colors: [COLORS.cyan, COLORS.qqq, COLORS.sox],
      yaxis: {
        ...APEX_BASE.yaxis,
        labels: {
          style: { colors: '#64748b', fontSize: '10px' },
          formatter: v => `${v?.toFixed(0)}`,
        },
      },
      annotations: {
        yaxis: [{
          y: 100,
          borderColor: 'rgba(100,116,139,0.3)',
          strokeDashArray: 3,
          borderWidth: 1,
        }],
      },
      tooltip: {
        ...APEX_BASE.tooltip,
        y: { formatter: v => `${v?.toFixed(2)} (기준=100)` },
      },
      legend: { ...APEX_BASE.legend, show: true },
    }

    // ── Rolling Correlation ────────────────────────────────────────────
    const rolling = correlations?.rolling60 ?? []
    const corrSeriesArr = []
    if (rolling.some(d => d.kospi_qqq != null)) {
      corrSeriesArr.push({
        name: 'KOSPI-QQQ 상관계수',
        data: rolling.filter(d => d.kospi_qqq != null).map(d => ({
          x: toTs(d.date), y: d.kospi_qqq,
        })),
      })
    }
    if (rolling.some(d => d.kospi_sox != null)) {
      corrSeriesArr.push({
        name: 'KOSPI-SOX 상관계수',
        data: rolling.filter(d => d.kospi_sox != null).map(d => ({
          x: toTs(d.date), y: d.kospi_sox,
        })),
      })
    }

    const cOpts = {
      ...APEX_BASE,
      chart: { ...APEX_BASE.chart, id: 'rolling-corr', height: 200, type: 'line' },
      stroke: { width: [2, 2], curve: 'smooth', dashArray: [0, 4] },
      colors: [COLORS.qqq, COLORS.sox],
      yaxis: {
        min: -1, max: 1,
        tickAmount: 4,
        labels: {
          style: { colors: '#64748b', fontSize: '10px' },
          formatter: v => v?.toFixed(1),
        },
      },
      annotations: {
        yaxis: [
          { y: 0.7, borderColor: COLORS.green + '66', strokeDashArray: 3, borderWidth: 1,
            label: { text: '강양상관(0.7)', borderColor: 'transparent', style: { color: COLORS.green + 'aa', background: 'transparent', fontSize: '9px' }, position: 'left', offsetX: 6 } },
          { y: 0, borderColor: 'rgba(100,116,139,0.3)', strokeDashArray: 4, borderWidth: 1 },
          { y: -0.7, borderColor: COLORS.red + '66', strokeDashArray: 3, borderWidth: 1,
            label: { text: '강음상관(-0.7)', borderColor: 'transparent', style: { color: COLORS.red + 'aa', background: 'transparent', fontSize: '9px' }, position: 'left', offsetX: 6 } },
        ],
      },
      tooltip: {
        ...APEX_BASE.tooltip,
        y: { formatter: v => fmtCorr(v) },
      },
      legend: { ...APEX_BASE.legend, show: true },
    }

    return { normSeries: normSeriesArr, normOpts: nOpts, corrSeries: corrSeriesArr, corrOpts: cOpts }
  }, [comparison, correlations])

  const currCorr = correlations?.current ?? {}
  const hasCorr = corrSeries.length > 0

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-300">
          <span className="text-accent-cyan">비교 분석</span> — KOSPI vs QQQ vs SOX
        </h2>
        <span className="text-xs text-slate-500">60일 롤링 상관계수</span>
      </div>

      {/* Summary badges row */}
      <div className="flex gap-3 flex-wrap mb-4">
        <RetBadge label="KOSPI" value={comparison?.kospi_return} />
        <RetBadge label="QQQ" value={comparison?.qqq_return} color={COLORS.qqq} />
        <RetBadge label="SOX" value={comparison?.sox_return} color={COLORS.sox} />
        {currCorr.kospi_qqq != null && (
          <CorrBadge label="KOSPI-QQQ 상관" value={currCorr.kospi_qqq} color={COLORS.qqq} />
        )}
        {currCorr.kospi_sox != null && (
          <CorrBadge label="KOSPI-SOX 상관" value={currCorr.kospi_sox} color={COLORS.sox} />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Normalized performance */}
        <div>
          <div className="text-xs text-slate-500 mb-1">
            정규화 성과 비교 <span className="text-slate-600">(기준=100)</span>
          </div>
          {normSeries.length > 0 ? (
            <ReactApexChart options={normOpts} series={normSeries} type="line" height={200} />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-xs">
              비교 데이터 없음
            </div>
          )}
        </div>

        {/* Rolling correlation */}
        <div>
          <div className="text-xs text-slate-500 mb-1">
            60일 롤링 상관계수 <span className="text-slate-600">(-1 ~ +1)</span>
          </div>
          {hasCorr ? (
            <ReactApexChart options={corrOpts} series={corrSeries} type="line" height={200} />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-xs">
              상관 데이터 없음 (공통 거래일 60일 이상 필요)
            </div>
          )}
        </div>
      </div>

      {/* Correlation interpretation */}
      <div className="mt-3 p-3 rounded-lg bg-bg-border/30 text-xs text-slate-500 leading-relaxed">
        <span className="text-slate-400">상관계수 해석: </span>
        <span style={{ color: COLORS.green }}>0.7 이상</span> 강양상관 (동반 움직임) |{' '}
        <span className="text-slate-400">0.3~0.7</span> 중양상관 |{' '}
        <span style={{ color: COLORS.amber }}>-0.3~0.3</span> 약상관 (독립적) |{' '}
        <span style={{ color: COLORS.red }}>-0.7 이하</span> 강음상관 (역방향)
      </div>
    </div>
  )
}
