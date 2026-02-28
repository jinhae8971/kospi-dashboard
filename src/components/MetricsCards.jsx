import { fmtPct } from '../utils/formatters'
import { COLORS } from '../constants/chartTheme'

function Card({ label, value, sub, color, icon, tooltip }) {
  return (
    <div className="card flex-1 min-w-0 group relative" title={tooltip}>
      <div className="flex items-start justify-between mb-2">
        <span className="stat-label">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

export default function MetricsCards({ metrics, signals }) {
  const buyCount = signals?.filter(s => s.type === 'BUY').length ?? 0
  const sellCount = signals?.filter(s => s.type === 'SELL').length ?? 0
  const strongBuy = signals?.filter(s => s.type === 'BUY' && s.strength === 'STRONG').length ?? 0
  const strongSell = signals?.filter(s => s.type === 'SELL' && s.strength === 'STRONG').length ?? 0

  const winRate = metrics?.winRate ?? 0
  const mdd = metrics?.mdd ?? 0
  const sharpe = metrics?.sharpeRatio ?? 0
  const avgRet = metrics?.avgReturn ?? 0

  // Win rate color
  const wrColor = winRate >= 0.6 ? COLORS.green : winRate >= 0.5 ? COLORS.amber : COLORS.red
  // Sharpe color
  const shColor = sharpe >= 1.5 ? COLORS.green : sharpe >= 0.5 ? COLORS.amber : COLORS.red
  // MDD color
  const mddColor = mdd >= -0.05 ? COLORS.green : mdd >= -0.15 ? COLORS.amber : COLORS.red

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
      <Card
        label="전략 승률 (1Y)"
        value={`${(winRate * 100).toFixed(1)}%`}
        sub={`수익 ${metrics?.profitableSignals ?? 0} / ${metrics?.buySignals ?? 0} 매수 시그널`}
        color={wrColor}
        icon="🎯"
        tooltip="BB하단+RSI 등 매수 시그널 후 20일 홀딩 기준 양수 수익률 비율"
      />
      <Card
        label="최대 낙폭 MDD"
        value={`${(mdd * 100).toFixed(1)}%`}
        sub={`평균 수익: ${fmtPct(avgRet * 100)} / 트레이드`}
        color={mddColor}
        icon="📉"
        tooltip="전략 실행 시 누적 수익 기준 최대 낙폭"
      />
      <Card
        label="샤프 비율"
        value={sharpe.toFixed(2)}
        sub={`RF 3% 기준 / 연환산`}
        color={shColor}
        icon="⚡"
        tooltip="(평균수익 - 무위험수익) / 표준편차 × √(252/20)"
      />
      <Card
        label="시그널 현황 (1Y)"
        value={`${buyCount + sellCount}개`}
        sub={
          <span>
            <span style={{ color: COLORS.green }}>▲매수 {buyCount}</span>
            <span className="mx-1 text-slate-600">|</span>
            <span style={{ color: COLORS.red }}>▼매도 {sellCount}</span>
            <span className="mx-1 text-slate-600">|</span>
            <span className="text-slate-400">강도 {strongBuy + strongSell}개</span>
          </span>
        }
        color={COLORS.cyan}
        icon="📡"
        tooltip="1년간 발생한 전체 매수/매도 시그널 수"
      />
    </div>
  )
}
