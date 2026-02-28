import { useMarketData } from './hooks/useMarketData'
import { fmtNumber, fmtPct, fmtDateTime } from './utils/formatters'

// ── 공통 카드 래퍼 ─────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <div className={`bg-bg-card border border-bg-border rounded-xl p-4 ${className}`}>
      {children}
    </div>
  )
}

// ── 섹션 레이블 ──────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-mono">
      {children}
    </p>
  )
}

// ── 로딩 / 에러 화면 ────────────────────────────────
function LoadingScreen({ error }) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <div className="text-accent-red text-2xl">⚠</div>
            <p className="text-slate-400 text-sm">데이터 로드 실패</p>
            <p className="text-slate-600 text-xs font-mono">{error}</p>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-sm">데이터 로딩 중...</p>
          </>
        )}
      </div>
    </div>
  )
}

// ── 52주 레인지 바 ───────────────────────────────────
function Range52W({ range52w }) {
  const { high, low, current, position } = range52w
  const pct = Math.max(0, Math.min(100, position))
  return (
    <Card>
      <SectionLabel>52주 레인지</SectionLabel>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-mono">
        <span>저점 {fmtNumber(low, 0)}</span>
        <span className="text-accent-cyan font-semibold">현재 {fmtNumber(current, 2)} <span className="text-accent-amber">({pct.toFixed(1)}%)</span></span>
        <span>고점 {fmtNumber(high, 0)}</span>
      </div>
      <div className="relative h-3 bg-bg-border rounded-full overflow-visible">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #00ff88 0%, #ffaa00 60%, #ff3366 100%)',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-accent-cyan shadow-lg"
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-accent-green font-mono">▲ 강세 구간</span>
        <span className="text-xs text-accent-red font-mono">과열 구간 ▲</span>
      </div>
    </Card>
  )
}

// ── 기술 지표 상태 배지 ────────────────────────────
function IndBadge({ label, value, signal, unit = '' }) {
  const colorMap = {
    OVERBOUGHT: 'text-accent-red bg-red-900/30 border-accent-red/30',
    OVERSOLD: 'text-accent-green bg-green-900/30 border-accent-green/30',
    BULLISH: 'text-accent-green bg-green-900/30 border-accent-green/30',
    BEARISH: 'text-accent-red bg-red-900/30 border-accent-red/30',
    AT_UPPER: 'text-accent-amber bg-amber-900/30 border-accent-amber/30',
    AT_LOWER: 'text-accent-cyan bg-cyan-900/30 border-accent-cyan/30',
    STRONG_UPTREND: 'text-accent-green bg-green-900/30 border-accent-green/30',
    STRONG_DOWNTREND: 'text-accent-red bg-red-900/30 border-accent-red/30',
    NEUTRAL: 'text-slate-400 bg-slate-800/40 border-slate-600/30',
  }
  const cls = colorMap[signal] || 'text-slate-400 bg-slate-800/40 border-slate-600/30'
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-bg-border last:border-0">
      <span className="text-xs text-slate-500 font-mono">{label}</span>
      <div className="flex items-center gap-2">
        {value != null && (
          <span className="text-xs font-mono text-slate-300">
            {typeof value === 'number' ? (value > 100 ? fmtNumber(value, 1) : value.toFixed(2)) : value}{unit}
          </span>
        )}
        <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${cls}`}>{signal.replace(/_/g, ' ')}</span>
      </div>
    </div>
  )
}

// ── 결정 히어로 카드 ─────────────────────────────────
function DecisionHero({ decisionTree }) {
  const { currentState, stateLabel, color, advice, cashRatio, description, confidence, indicators } = decisionTree
  const isBuy  = currentState.includes('BUY')
  const isSell = currentState.includes('SELL')
  const borderColor = isBuy ? '#00ff88' : isSell ? '#ff3366' : '#ffaa00'

  const confAbs = Math.abs(confidence ?? 0)
  const confMax = 4

  return (
    <Card className="relative overflow-hidden" style={{ borderColor }}>
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${color} 0%, transparent 70%)` }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div>
            <SectionLabel>AI 포지션 결정</SectionLabel>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold font-mono tracking-wide" style={{ color }}>
                {stateLabel}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full border font-mono"
                style={{ color, borderColor: color, background: color + '22' }}
              >
                {currentState.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-sm">{description}</p>
          </div>
          {/* 현금 비중 원형 인포 */}
          <div className="text-center shrink-0 ml-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center border-4 font-mono"
              style={{
                borderColor: color,
                background: color + '18',
                boxShadow: `0 0 20px ${color}40`,
              }}
            >
              <div>
                <div className="text-xl font-bold leading-none" style={{ color }}>{cashRatio}%</div>
                <div className="text-xs text-slate-500 mt-0.5">현금</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">{advice}</p>
          </div>
        </div>

        {/* 신뢰도 바 */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500 font-mono">신호 강도</span>
            <span className="text-xs font-mono" style={{ color }}>
              {'●'.repeat(confAbs)}{'○'.repeat(confMax - confAbs)}
            </span>
          </div>
          <div className="h-1.5 bg-bg-border rounded-full">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(confAbs / confMax) * 100}%`, background: color }}
            />
          </div>
        </div>

        {/* 기술 지표 */}
        <div className="space-y-0">
          {indicators?.rsi && (
            <IndBadge label="RSI" value={indicators.rsi.value} signal={indicators.rsi.signal} />
          )}
          {indicators?.macd && (
            <IndBadge label="MACD" value={indicators.macd.value} signal={indicators.macd.signal} />
          )}
          {indicators?.bbPosition && (
            <IndBadge label="볼린저밴드" value={indicators.bbPosition.value} signal={indicators.bbPosition.signal} />
          )}
          {indicators?.trend && (
            <IndBadge label="추세" value={null} signal={indicators.trend.signal} />
          )}
        </div>
      </div>
    </Card>
  )
}

// ── 지지/저항 레벨 ────────────────────────────────────
function SupportResistance({ decisionTree, currentPrice }) {
  const resistance = decisionTree?.resistanceLevels || []
  const support    = decisionTree?.supportLevels    || []

  const allLevels = [
    ...resistance.map(l => ({ ...l, type: 'resistance' })),
    { level: currentPrice, label: '현재가', type: 'current' },
    ...support.map(l => ({ ...l, type: 'support' })),
  ].sort((a, b) => b.level - a.level)

  return (
    <Card>
      <SectionLabel>지지 / 저항</SectionLabel>
      <div className="space-y-1.5">
        {allLevels.map((l, i) => {
          const isCurrent    = l.type === 'current'
          const isResistance = l.type === 'resistance'
          const color = isCurrent ? 'text-accent-cyan' : isResistance ? 'text-accent-red' : 'text-accent-green'
          const bg    = isCurrent ? 'bg-cyan-900/20 border border-accent-cyan/30' : isResistance ? 'bg-red-900/10' : 'bg-green-900/10'
          const icon  = isResistance ? '⛔' : isCurrent ? '▶' : '🟢'
          return (
            <div key={i} className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${bg}`}>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <span>{icon}</span>
                <span>{l.label}</span>
              </span>
              <span className={`text-xs font-bold font-mono ${color}`}>{fmtNumber(l.level, 2)}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── 수급 선형 차트 (SVG) ─────────────────────────────
const INVESTOR_CFG = [
  { key: 'foreign',     label: '외국인', color: '#00d4ff' },
  { key: 'institution', label: '기관',   color: '#ffaa00' },
  { key: 'individual',  label: '개인',   color: '#94a3b8' },
]

function fmtAmt(val) {
  if (val == null) return '-'
  const abs  = Math.abs(val)
  const sign = val >= 0 ? '+' : '-'
  if (abs >= 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000_000).toFixed(1)}조`
  if (abs >= 100_000_000)       return `${sign}${(abs / 100_000_000).toFixed(0)}억`
  if (abs >= 10_000)            return `${sign}${(abs / 10_000).toFixed(0)}만`
  return `${sign}${abs.toLocaleString()}`
}

function InvestorLineChart({ series }) {
  if (!series || series.length < 2) return (
    <div className="flex items-center justify-center h-20 text-xs text-slate-600 font-mono">
      데이터 부족
    </div>
  )

  const W = 400, H = 90
  const PAD = { t: 8, r: 4, b: 16, l: 4 }
  const w = W - PAD.l - PAD.r
  const h = H - PAD.t - PAD.b

  const allVals = series.flatMap(d => INVESTOR_CFG.map(c => d[c.key] ?? 0))
  const minV = Math.min(...allVals, 0)
  const maxV = Math.max(...allVals, 0)
  const range = maxV - minV || 1

  const xS = (i) => PAD.l + (i / (series.length - 1)) * w
  const yS = (v) => PAD.t + ((maxV - v) / range) * h
  const zeroY = yS(0)

  // X축 날짜 레이블: 3개월 간격
  const xLabels = []
  let lastMonth = null
  series.forEach((d, i) => {
    const m = d.date?.slice(0, 7)
    if (m && m !== lastMonth && i % Math.max(1, Math.floor(series.length / 5)) === 0) {
      xLabels.push({ i, label: m.slice(2) }) // "YY-MM"
      lastMonth = m
    }
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {/* 제로라인 */}
      <line
        x1={PAD.l} y1={zeroY} x2={W - PAD.r} y2={zeroY}
        stroke="#334155" strokeWidth="1" strokeDasharray="4,3"
      />
      {/* 각 투자자 라인 */}
      {INVESTOR_CFG.map(({ key, color }) => {
        const pts = series.map((d, i) => `${xS(i)},${yS(d[key] ?? 0)}`).join(' ')
        return (
          <polyline
            key={key} points={pts}
            fill="none" stroke={color}
            strokeWidth="1.5" strokeLinejoin="round" opacity="0.9"
          />
        )
      })}
      {/* 최신 값 점 */}
      {INVESTOR_CFG.map(({ key, color }) => {
        const last = series[series.length - 1]
        return (
          <circle
            key={key}
            cx={xS(series.length - 1)} cy={yS(last[key] ?? 0)}
            r="2.5" fill={color}
          />
        )
      })}
      {/* X축 날짜 */}
      {xLabels.map(({ i, label }) => (
        <text
          key={i} x={xS(i)} y={H - 2}
          fontSize="7" fill="#475569" textAnchor="middle" fontFamily="monospace"
        >{label}</text>
      ))}
    </svg>
  )
}

// ── 코스피/코스닥 수급현황 ────────────────────────────
function SupplyDemand({ supplyDemand }) {
  const MarketPanel = ({ marketKey, label }) => {
    const mdata = supplyDemand?.[marketKey]
    const series = mdata?.series ?? []
    const lastDate = mdata?.lastDate ?? ''

    return (
      <div>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-300 font-mono font-bold">{label}</p>
          {lastDate && <p className="text-xs text-slate-600 font-mono">{lastDate} 기준</p>}
        </div>

        {/* 선형 차트 */}
        <div className="bg-bg-border/20 rounded-lg px-2 pt-1">
          <InvestorLineChart series={series} />
        </div>
      </div>
    )
  }

  return (
    <Card>
      <SectionLabel>코스피 · 코스닥 수급현황 — 투자자별 순매수 (1년)</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <MarketPanel marketKey="kospi"  label="🇰🇷 KOSPI" />
        <div className="hidden sm:block border-l border-bg-border" />
        <MarketPanel marketKey="kosdaq" label="📈 KOSDAQ" />
      </div>
      {/* 범례 */}
      <div className="flex gap-4 justify-center mt-3 pt-3 border-t border-bg-border">
        {INVESTOR_CFG.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <svg width="18" height="4">
              <line x1="0" y1="2" x2="18" y2="2" stroke={color} strokeWidth="1.5" />
            </svg>
            <span className="text-xs font-mono" style={{ color }}>{label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── 최근 매매 신호 타임라인 ──────────────────────────
function SignalTimeline({ signals }) {
  const recent = [...signals].reverse().slice(0, 8)
  const strengthLabel = { STRONG: '강', MODERATE: '중', WEAK: '약' }
  return (
    <Card>
      <SectionLabel>최근 매매 신호</SectionLabel>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {recent.map((s, i) => {
          const isBuy = s.type === 'BUY'
          return (
            <div key={i} className="flex items-center gap-2 py-1 border-b border-bg-border last:border-0">
              <span className={`shrink-0 w-12 text-center text-xs px-1 py-0.5 rounded font-mono font-bold
                ${isBuy
                  ? 'bg-green-900/40 text-accent-green border border-accent-green/30'
                  : 'bg-red-900/40 text-accent-red border border-accent-red/30'}`}>
                {isBuy ? '▲BUY' : '▼SELL'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 font-mono truncate">{s.reason}</p>
                <p className="text-xs text-slate-500 font-mono">{s.date} · {fmtNumber(s.price, 0)}</p>
              </div>
              <span className={`shrink-0 text-xs font-mono px-1 rounded
                ${s.strength === 'STRONG' ? 'text-accent-amber' : s.strength === 'MODERATE' ? 'text-slate-300' : 'text-slate-500'}`}>
                {strengthLabel[s.strength] || s.strength}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── 상관관계 패널 ─────────────────────────────────────
function CorrelationInfo({ correlations, comparison }) {
  const cur = correlations?.current || {}
  const pairs = Object.entries(cur).map(([key, val]) => {
    const parts = key.split('_')
    return { a: parts[0].toUpperCase(), b: parts[1].toUpperCase(), val }
  })

  const corrColor = (v) => {
    if (v > 0.5)  return 'text-accent-green'
    if (v > 0.2)  return 'text-accent-amber'
    if (v < -0.2) return 'text-accent-red'
    return 'text-slate-400'
  }
  const corrBar = (v) => {
    const pct   = ((v + 1) / 2) * 100
    const color = v > 0.2 ? '#00ff88' : v < -0.2 ? '#ff3366' : '#ffaa00'
    return { pct, color }
  }

  const compReturn = []
  if (comparison?.kospi_return != null) compReturn.push({ label: 'KOSPI', val: comparison.kospi_return, color: 'text-accent-cyan' })
  if (comparison?.qqq_return   != null) compReturn.push({ label: 'QQQ',   val: comparison.qqq_return,   color: 'text-accent-amber' })
  if (comparison?.sox_return   != null) compReturn.push({ label: 'SOX',   val: comparison.sox_return,   color: 'text-accent-purple' })

  return (
    <Card>
      <SectionLabel>시장 상관관계 · 비교 수익률</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 상관계수 */}
        <div>
          <p className="text-xs text-slate-600 mb-2 font-mono">상관계수 (현재)</p>
          <div className="space-y-2">
            {pairs.map((p, i) => {
              const { pct, color } = corrBar(p.val)
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs font-mono mb-0.5">
                    <span className="text-slate-400">{p.a} / {p.b}</span>
                    <span className={corrColor(p.val)}>{p.val >= 0 ? '+' : ''}{p.val.toFixed(3)}</span>
                  </div>
                  <div className="relative h-1.5 bg-bg-border rounded-full">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-slate-600" />
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        left: p.val >= 0 ? '50%' : `${pct}%`,
                        width: `${Math.abs(p.val) * 50}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 비교 수익률 */}
        <div>
          <p className="text-xs text-slate-600 mb-2 font-mono">기간 누적 수익률</p>
          <div className="space-y-2">
            {compReturn.map((c, i) => {
              const isPos = c.val >= 0
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-xs font-mono w-12 shrink-0 ${c.color}`}>{c.label}</span>
                  <div className="flex-1 h-5 bg-bg-border/50 rounded overflow-hidden relative">
                    <div
                      className="h-full rounded transition-all duration-700"
                      style={{
                        width: `${Math.min(Math.abs(c.val), 200) / 2}%`,
                        background: isPos ? '#00ff8855' : '#ff336655',
                        border: `1px solid ${isPos ? '#00ff88' : '#ff3366'}`,
                      }}
                    />
                    <span className={`absolute inset-0 flex items-center pl-2 text-xs font-mono font-bold
                      ${isPos ? 'text-accent-green' : 'text-accent-red'}`}>
                      {fmtPct(c.val)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── 헤더 ─────────────────────────────────────────────
function Header({ ohlcv, metadata }) {
  const latest = ohlcv?.[ohlcv.length - 1]
  const prev   = ohlcv?.[ohlcv.length - 2]
  const change    = latest && prev ? latest.close - prev.close : null
  const changePct = latest && prev && prev.close ? (change / prev.close) * 100 : null
  const isUp = (change ?? 0) >= 0

  return (
    <header className="sticky top-0 z-30 bg-bg-primary/90 backdrop-blur-sm border-b border-bg-border px-4 py-2 mb-4">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* 브랜드 */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
            <span className="text-accent-cyan font-bold text-sm font-mono">K</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-200 leading-none font-mono">KOSPI Dashboard</h1>
            <p className="text-xs text-slate-500 font-mono">시장 인사이트 · 수급현황</p>
          </div>
        </div>

        {/* 현재가 */}
        {latest && (
          <div className="flex items-center gap-3">
            <div>
              <span className={`text-2xl font-bold font-mono ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
                {fmtNumber(latest.close, 2)}
              </span>
              {changePct != null && (
                <span className={`ml-2 text-sm font-mono ${isUp ? 'text-accent-green' : 'text-accent-red'}`}>
                  {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({fmtPct(changePct)})
                </span>
              )}
            </div>
          </div>
        )}

        {/* 업데이트 시간 */}
        <p className="text-xs text-slate-600 font-mono hidden sm:block">
          {metadata?.lastUpdated ? fmtDateTime(metadata.lastUpdated) : ''} 기준
        </p>
      </div>
    </header>
  )
}

// ── 메인 App ─────────────────────────────────────────
export default function App() {
  const { data, loading, error } = useMarketData()

  if (loading || error) return <LoadingScreen error={error} />

  const { metadata, ohlcv, signals, correlations, comparison, decisionTree, range52w, supplyDemand } = data
  const latestPrice = ohlcv?.[ohlcv.length - 1]?.close

  return (
    <div className="min-h-screen bg-bg-primary text-slate-200 animate-fade-in">
      <Header ohlcv={ohlcv} metadata={metadata} />

      <main className="px-4 pb-10 space-y-3 max-w-[1400px] mx-auto">

        {/* ① 결정 카드 + 지지저항 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <DecisionHero decisionTree={decisionTree} />
          </div>
          <SupportResistance decisionTree={decisionTree} currentPrice={latestPrice} />
        </div>

        {/* ② 52주 레인지 */}
        <Range52W range52w={range52w} />

        {/* ③ 코스피/코스닥 수급현황 */}
        <SupplyDemand supplyDemand={supplyDemand} />

        {/* ④ 매매 신호 + 상관관계 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SignalTimeline signals={signals} />
          <CorrelationInfo correlations={correlations} comparison={comparison} />
        </div>

      </main>
    </div>
  )
}
