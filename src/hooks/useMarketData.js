import { useState, useEffect } from 'react'

export function useMarketData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `${import.meta.env.BASE_URL}data/market_data.json`
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to load market data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return { data, loading, error }
}
