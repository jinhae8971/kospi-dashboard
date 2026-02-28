export function fmtNumber(val, decimals = 2) {
  if (val == null) return '—'
  return Number(val).toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function fmtPct(val, decimals = 1) {
  if (val == null) return '—'
  const sign = val >= 0 ? '+' : ''
  return `${sign}${Number(val).toFixed(decimals)}%`
}

export function fmtVolume(val) {
  if (val == null) return '—'
  const n = Number(val)
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return String(n)
}

export function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function fmtDateTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function fmtCorr(val) {
  if (val == null) return '—'
  const n = Number(val)
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(3)}`
}

/** Convert date string to timestamp for ApexCharts */
export function toTs(dateStr) {
  return new Date(dateStr).getTime()
}

/** Align indicator array to ohlcv date set */
export function alignToOHLCV(ohlcv, indArr) {
  const map = {}
  if (Array.isArray(indArr)) {
    for (const item of indArr) {
      map[item.date] = item.value
    }
  }
  return ohlcv.map(c => ({
    x: toTs(c.date),
    y: map[c.date] !== undefined ? map[c.date] : null,
  }))
}
