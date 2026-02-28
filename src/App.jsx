import { useMarketData } from './hooks/useMarketData'
import LoadingScreen from './components/LoadingScreen'
import Header from './components/Header'
import MetricsCards from './components/MetricsCards'
import MainChart from './components/MainChart'
import RSIChart from './components/RSIChart'
import MACDChart from './components/MACDChart'
import VolumeChart from './components/VolumeChart'
import DecisionSidebar from './components/DecisionSidebar'
import CorrelationPanel from './components/CorrelationPanel'

export default function App() {
  const { data, loading, error } = useMarketData()

  if (loading || error) {
    return <LoadingScreen error={error} />
  }

  const { metadata, ohlcv, indicators, signals, supportResistance,
          metrics, correlations, comparison, decisionTree, range52w } = data

  return (
    <div className="min-h-screen bg-bg-primary text-slate-200 animate-fade-in">
      {/* Header */}
      <Header
        metadata={metadata}
        ohlcv={ohlcv}
        comparison={comparison}
        range52w={range52w}
      />

      <main className="px-4 pb-8 space-y-4 max-w-[1920px] mx-auto">
        {/* Performance metrics row */}
        <MetricsCards metrics={metrics} signals={signals} />

        {/* Main layout: charts (left) + sidebar (right) */}
        <div className="flex gap-4 items-start">
          {/* ── Left: Chart stack ─────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-2">
            <MainChart
              ohlcv={ohlcv}
              indicators={indicators}
              signals={signals}
              supportResistance={supportResistance}
            />
            <RSIChart ohlcv={ohlcv} indicators={indicators} />
            <MACDChart ohlcv={ohlcv} indicators={indicators} />
            <VolumeChart ohlcv={ohlcv} indicators={indicators} />
          </div>

          {/* ── Right: Decision sidebar ───────────────────────────── */}
          <div className="w-72 xl:w-80 shrink-0">
            <DecisionSidebar
              decisionTree={decisionTree}
              range52w={range52w}
              metrics={metrics}
            />
          </div>
        </div>

        {/* Correlation panel (full width) */}
        <CorrelationPanel
          comparison={comparison}
          correlations={correlations}
        />
      </main>
    </div>
  )
}
