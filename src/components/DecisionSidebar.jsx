import { fmtNumber, fmtPct } from '../utils/formatters'
import { COLORS } from '../constants/chartTheme'

const SIGNAL_COLOR = {
  BULLISH: COLORS.green, STRONG_UPTREND: COLORS.green, RECOVERING: COLORS.green,
  AT_LOWER: COLORS.green, OVERSOLD: COLORS.green,
  NEUTRAL: COLORS.amber, SIDEWAYS: COLORS.amber, MIDDLE: COLORS.amber,
  WEAKENING: COLORS.amber, BEARISH: COLORS.red, STRONG_DOWNTREND: COLORS.red,
  AT_UPPER: COLORS.red, OVERBOUGHT: COLORS.red, DOWNTREND: COLORS.red, UPTREND: COLORS.green,
}

function IndicatorRow({ label, value, signalKey, signalLabel }) {
  const col = SIGNAL_COLOR[signalKey] ?? COLORS.amber
  return (
    <div className="flex items-center justify-between py-2 border-b border-bg-border last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-300 font-mono">
          {value != null ? value : ''}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{ color: col, backgroundColor: col + '22', border: `1px solid ${col}44` }}
        >
          {signalLabel}
        </span>
      </div>
    </div>
  )
}

function LevelRow({ item, type }) {
  const col = type === 'SUPPORT' ? COLORS.green : COLORS.red
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="text-slate-500">{item.label}</span>
      <span style={{ color: col }} className="font-mono font-medium">
        {fmtNumber(item.level, 2)}
      </span>
    </div>
  )
}

export default function DecisionSidebar({ decisionTree: dt, range52w, metrics }) {
  if (!dt) return null

  const cashPct = dt.cashRatio
  const equityPct = 100 - cashPct
  const stateColor = dt.color ?? COLORS.amber

  return (
    <div className="space-y-3">
      {/* ── Current State Card ─────────────────────────────────── */}
      <div
        className="card"
        style={{ borderColor: stateColor + '55', boxShadow: `0 0 20px ${stateColor}15` }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 uppercase tracking-wider">현재 시장 상태</span>
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse-slow"
            style={{ backgroundColor: stateColor }}
          />
        </div>
        <div
          className="text-base font-bold mb-1"
          style={{ color: stateColor }}
        >
          {dt.stateLabel}
        </div>
        <div className="text-xs text-slate-400 leading-relaxed mb-3">
          {dt.description}
        </div>

        {/* Confidence bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>약세 신호</span>
            <span>강세 신호</span>
          </div>
          <div className="h-2 rounded-full bg-bg-border relative overflow-hidden">
            <div
              className="absolute top-0 h-full rounded-full transition-all"
              style={{
                width: '50%',
                left: '50%',
                transform: `translateX(${(dt.confidence / 4) * 50 - 50}%)`,
                backgroundColor: stateColor,
              }}
            />
          </div>
        </div>

        {/* Action label */}
        <div
          className="text-center text-sm font-semibold py-2 rounded-lg"
          style={{ backgroundColor: stateColor + '20', color: stateColor, border: `1px solid ${stateColor}44` }}
        >
          ▶ {dt.advice}
        </div>
      </div>

      {/* ── Cash / Equity allocation ──────────────────────────── */}
      <div className="card">
        <span className="stat-label block mb-3">권장 현금 비중</span>
        <div className="flex items-end gap-3 mb-3">
          <div>
            <div className="text-3xl font-bold font-mono" style={{ color: stateColor }}>
              {cashPct}%
            </div>
            <div className="text-xs text-slate-500">현금</div>
          </div>
          <div className="text-slate-600 text-sm mb-1">:</div>
          <div>
            <div className="text-3xl font-bold font-mono text-slate-300">
              {equityPct}%
            </div>
            <div className="text-xs text-slate-500">주식</div>
          </div>
        </div>
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          <div
            className="transition-all rounded-l-full"
            style={{ width: `${cashPct}%`, backgroundColor: stateColor }}
          />
          <div
            className="flex-1 rounded-r-full bg-slate-700"
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>현금 {cashPct}%</span>
          <span>주식 {equityPct}%</span>
        </div>
      </div>

      {/* ── Indicators ───────────────────────────────────────── */}
      <div className="card">
        <span className="stat-label block mb-1">지표 현황</span>
        <IndicatorRow
          label="RSI(14)"
          value={dt.indicators.rsi.value}
          signalKey={dt.indicators.rsi.signal}
          signalLabel={dt.indicators.rsi.label}
        />
        <IndicatorRow
          label="MACD"
          value={dt.indicators.macd.value}
          signalKey={dt.indicators.macd.signal}
          signalLabel={dt.indicators.macd.label}
        />
        <IndicatorRow
          label="BB 위치"
          value={`${(dt.indicators.bbPosition.value * 100).toFixed(0)}%`}
          signalKey={dt.indicators.bbPosition.signal}
          signalLabel={dt.indicators.bbPosition.label}
        />
        <IndicatorRow
          label="추세"
          value={null}
          signalKey={dt.indicators.trend.signal}
          signalLabel={dt.indicators.trend.label}
        />
      </div>

      {/* ── Support / Resistance ─────────────────────────────── */}
      <div className="card">
        <span className="stat-label block mb-2">지지 / 저항</span>
        {dt.resistanceLevels?.length > 0 && (
          <div className="mb-2">
            <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
              <span className="w-2 h-px inline-block" style={{ backgroundColor: COLORS.red }} />
              저항선
            </div>
            {dt.resistanceLevels.map((l, i) => (
              <LevelRow key={i} item={l} type="RESISTANCE" />
            ))}
          </div>
        )}
        {dt.supportLevels?.length > 0 && (
          <div>
            <div className="text-xs text-slate-600 mb-1 flex items-center gap-1">
              <span className="w-2 h-px inline-block" style={{ backgroundColor: COLORS.green }} />
              지지선
            </div>
            {dt.supportLevels.map((l, i) => (
              <LevelRow key={i} item={l} type="SUPPORT" />
            ))}
          </div>
        )}
      </div>

      {/* ── 52W range ────────────────────────────────────────── */}
      {range52w && (
        <div className="card">
          <span className="stat-label block mb-2">52주 밴드 위치</span>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>저점 {fmtNumber(range52w.low, 0)}</span>
            <span className="text-accent-cyan">{range52w.position?.toFixed(0)}% 위치</span>
            <span>고점 {fmtNumber(range52w.high, 0)}</span>
          </div>
          <div className="h-3 rounded-full bg-bg-border relative overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${range52w.position ?? 50}%`,
                background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.amber}, ${COLORS.red})`,
              }}
            />
          </div>
          <div className="text-center text-xs text-slate-400 mt-1.5">
            현재 {fmtNumber(range52w.current, 2)}
          </div>
        </div>
      )}

      {/* ── Decision Tree ─────────────────────────────────────── */}
      <div className="card">
        <span className="stat-label block mb-3">전략 결정 트리</span>
        <div className="space-y-1.5 text-xs">
          {[
            { cond: 'RSI < 30 + BB 하단', action: '공격적 분할 매수', state: 'STRONG_BUY', active: dt.currentState === 'STRONG_BUY' },
            { cond: '강세 지표 3개 이상', action: '보유 / 추가 매수', state: 'BULLISH', active: dt.currentState === 'BULLISH' },
            { cond: '혼조 신호', action: '관망 / 분할 접근', state: 'NEUTRAL', active: dt.currentState === 'NEUTRAL' },
            { cond: '약세 지표 3개 이상', action: '현금 비중 확대', state: 'BEARISH', active: dt.currentState === 'BEARISH' },
            { cond: 'RSI > 70 + BB 상단', action: '수익 실현 / 현금화', state: 'STRONG_SELL', active: dt.currentState === 'STRONG_SELL' },
          ].map((item, i) => {
            const col = item.active ? (dt.color ?? COLORS.amber) : '#2a3f5f'
            return (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg transition-all"
                style={{
                  borderLeft: `3px solid ${col}`,
                  backgroundColor: item.active ? col + '15' : 'transparent',
                  opacity: item.active ? 1 : 0.5,
                }}
              >
                <div className="flex-1">
                  <div className="text-slate-400 text-[10px]">{item.cond}</div>
                  <div className="font-medium" style={{ color: item.active ? col : '#64748b' }}>
                    → {item.action}
                  </div>
                </div>
                {item.active && (
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: col }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
