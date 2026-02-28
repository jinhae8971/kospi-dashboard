export default function LoadingScreen({ error }) {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-4">
        {/* Animated logo */}
        <div className="flex items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-accent-cyan/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-accent-cyan/40 animate-pulse" />
            <div className="absolute inset-4 rounded-full bg-accent-cyan/10 flex items-center justify-center">
              <span className="text-accent-cyan text-lg font-bold">K</span>
            </div>
          </div>
        </div>

        {error ? (
          <>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-slate-300">데이터 로드 실패</h2>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
            <div className="card text-left space-y-2 text-xs text-slate-400">
              <p className="text-accent-amber font-medium">초기 설정이 필요합니다:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Python 패키지 설치:<br />
                  <code className="text-accent-cyan">pip install yfinance pandas numpy</code>
                </li>
                <li>
                  데이터 생성:<br />
                  <code className="text-accent-cyan">python scripts/fetch_data.py</code>
                </li>
                <li>
                  개발 서버 재시작:<br />
                  <code className="text-accent-cyan">npm run dev</code>
                </li>
              </ol>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-300">KOSPI 전략 대시보드</h2>
              <p className="text-sm text-slate-500">시장 데이터 불러오는 중...</p>
            </div>
            <div className="flex items-center justify-center gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-1 bg-accent-cyan rounded-full animate-pulse"
                  style={{
                    height: `${8 + i * 4}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
