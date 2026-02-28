import { fmtNumber, fmtPct, fmtDateTime } from '../utils/formatters'
import { COLORS } from '../constants/chartTheme'

export default function Header({ metadata, ohlcv, comparison, range52w }) {
  const latest = ohlcv?.[ohlcv.length - 1]
  const prev = ohlcv?.[ohlcv.length - 2]
  const change = latest && prev ? latest.close - prev.close : null
  const changePct = latest && prev && prev.close ? (change / prev.close) * 100 : null
  const isUp = change >= 0

  const pos52 = range52w?.position ?? 50

  return (
    <header className="sticky top-0 z-30 bg-bg-primary/90 backdrop-blur-sm border-b border-bg-border px-3 sm:px-4 py-2 sm:py-3 mb-3 sm:mb-4">
      <div className="max-w-[1920px] mx-auto">
        {/* ── Row 1: Brand + Index (always visible) ─────────────────── */}
        <div className="flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center shrink-0">
              <span className="text-accent-cyan font-bold text-xs sm:text-sm">K</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-slate-200 leading-none truncate">
                KOSPI Strategy Dashboard
              </h1>
              <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                퀀트 트레이딩 전략 인사이트
              </p>
            </div>
          </div>

          {/* Right side: index + extra on larger screens */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Current index - always visible */}
            {latest && (
              <div className="text-right">
                <div
                  className="text-lg sm:text-2xl font-bold font-mono leading-none"
                  style={{ color: isUp ? COLORS.up : COLORS.down }}
                >
                  {fmtNumber(latest.close, 2)}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs justify-end mt-0.5">
                  <span style={{ color: isUp ? COLORS.up : COLORS.down }}>
                    {isUp ? '▲' : '▼'} {fmtNumber(Math.abs(change ?? 0), 2)}
                  </span>
                  <span style={{ color: isUp ? COLORS.up : COLORS.down }}>
                    ({fmtPct(changePct ?? 0)})
                  </span>
                </div>
              </div>
            )}

            {/* 52W range bar - lg+ only */}
            <div className="hidden lg:block">
              <div className="text-xs text-slate-500 mb-1">52주 위치 ({pos52.toFixed(0)}%)</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-accent-red">{fmtNumber(range52w?.low, 0)}</span>
                <div className="w-28 h-2 bg-bg-border rounded-full relative">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{
                      width: `${pos52}%`,
                      background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.amber}, ${COLORS.red})`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-slate-400"
                    style={{ left: `calc(${pos52}% - 4px)` }}
                  />
                </div>
                <span className="text-accent-green">{fmtNumber(range52w?.high, 0)}</span>
              </div>
            </div>

            {/* Comparison badges - xl+ only */}
            <div className="hidden xl:flex items-center gap-2 text-xs">
              {comparison?.qqq_return != null && (
                <CompBadge label="QQQ" ret={comparison.qqq_return} />
              )}
              {comparison?.sox_return != null && (
                <CompBadge label="SOX" ret={comparison.sox_return} />
              )}
              {comparison?.kospi_return != null && (
                <CompBadge label="KOSPI" ret={comparison.kospi_return} />
              )}
            </div>

            {/* Last updated - md+ only */}
            <div className="hidden md:block text-right text-xs text-slate-600">
              <div className="text-slate-500">최종 업데이트</div>
              <div>{fmtDateTime(metadata?.lastUpdated)}</div>
              <div className="text-slate-600 text-[10px]">
                {metadata?.dataStart} ~ {metadata?.dataEnd} ({metadata?.totalDays}일)
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Mobile info bar ──────────────────────────────────── */}
        <div className="flex md:hidden items-center justify-between text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-bg-border/40">
          <span>{fmtDateTime(metadata?.lastUpdated)}</span>
          <span>52주 {pos52.toFixed(0)}% 위치</span>
          {comparison?.qqq_return != null && (
            <span>
              QQQ{' '}
              <span style={{ color: comparison.qqq_return >= 0 ? COLORS.up : COLORS.down }}>
                {comparison.qqq_return >= 0 ? '+' : ''}{fmtPct(comparison.qqq_return)}
              </span>
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

function CompBadge({ label, ret }) {
  const isUp = ret >= 0
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-card border border-bg-border">
      <span className="text-slate-400">{label}</span>
      <span style={{ color: isUp ? COLORS.up : COLORS.down }}>
        {isUp ? '▲' : '▼'} {fmtPct(ret)}
      </span>
      <span className="text-slate-600 text-[10px]">(1Y)</span>
    </div>
  )
}
