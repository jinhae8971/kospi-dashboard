"""
KOSPI Strategy Dashboard - Data Fetcher
Fetches market data, technical indicators, and investor supply/demand.
Outputs to public/data/market_data.json
"""

import json
import os
import sys
import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def safe_float(val):
    if val is None or (isinstance(val, float) and (np.isnan(val) or np.isinf(val))):
        return None
    try:
        f = float(val)
        return None if np.isnan(f) or np.isinf(f) else f
    except (TypeError, ValueError):
        return None


def download(ticker, start, end):
    """Download OHLCV from yfinance, flatten MultiIndex columns."""
    df = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1)
    return df.dropna(subset=["Close"])


# ---------------------------------------------------------------------------
# Technical indicators
# ---------------------------------------------------------------------------

def compute_rsi(series, period=14):
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, np.finfo(float).eps)
    return 100 - (100 / (1 + rs))


def compute_macd(series, fast=12, slow=26, signal=9):
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    return macd_line, signal_line, macd_line - signal_line


def compute_obv(close, volume):
    obv = np.zeros(len(close))
    for i in range(1, len(close)):
        if close.iloc[i] > close.iloc[i - 1]:
            obv[i] = obv[i - 1] + volume.iloc[i]
        elif close.iloc[i] < close.iloc[i - 1]:
            obv[i] = obv[i - 1] - volume.iloc[i]
        else:
            obv[i] = obv[i - 1]
    return pd.Series(obv, index=close.index)


# ---------------------------------------------------------------------------
# Support / Resistance detection
# ---------------------------------------------------------------------------

def find_support_resistance(df, window=15, min_count=2, tolerance=0.005):
    highs = df["High"]
    lows = df["Low"]
    current = float(df["Close"].iloc[-1])

    peaks, troughs = [], []
    for i in range(window, len(df) - window):
        if highs.iloc[i] == highs.iloc[i - window : i + window + 1].max():
            peaks.append(float(highs.iloc[i]))
        if lows.iloc[i] == lows.iloc[i - window : i + window + 1].min():
            troughs.append(float(lows.iloc[i]))

    all_levels = sorted(peaks + troughs)
    if not all_levels:
        return []

    clusters, cur = [], [all_levels[0]]
    for lvl in all_levels[1:]:
        if (lvl - cur[0]) / cur[0] < tolerance:
            cur.append(lvl)
        else:
            clusters.append(cur)
            cur = [lvl]
    clusters.append(cur)

    result = []
    for c in clusters:
        if len(c) >= min_count:
            avg = float(np.mean(c))
            result.append({
                "level": round(avg, 2),
                "type": "SUPPORT" if avg < current else "RESISTANCE",
                "strength": len(c),
            })

    result.sort(key=lambda x: x["strength"], reverse=True)
    return result[:8]


# ---------------------------------------------------------------------------
# Signal generation
# ---------------------------------------------------------------------------

def generate_signals(df):
    signals = []
    rsi = df["rsi14"]
    macd = df["macd"]
    macd_sig = df["macd_signal"]
    close = df["Close"]
    bb_u = df["bb_upper"]
    bb_l = df["bb_lower"]
    ma5 = df["ma5"]
    ma20 = df["ma20"]

    for i in range(1, len(df)):
        date = df.index[i].strftime("%Y-%m-%d")
        c, c_prev = close.iloc[i], close.iloc[i - 1]
        r, r_prev = rsi.iloc[i], rsi.iloc[i - 1]
        m, m_prev = macd.iloc[i], macd.iloc[i - 1]
        ms, ms_prev = macd_sig.iloc[i], macd_sig.iloc[i - 1]
        m5, m5_prev = ma5.iloc[i], ma5.iloc[i - 1]
        m20, m20_prev = ma20.iloc[i], ma20.iloc[i - 1]

        if pd.isna(r) or pd.isna(m):
            continue

        if c <= bb_l.iloc[i] and r < 30 and r > r_prev:
            signals.append({"date": date, "type": "BUY", "reason": "BB하단+RSI과매도반등",
                            "price": safe_float(c), "strength": "STRONG"})
        elif c >= bb_u.iloc[i] and r > 70 and r < r_prev:
            signals.append({"date": date, "type": "SELL", "reason": "BB상단+RSI과매수",
                            "price": safe_float(c), "strength": "STRONG"})
        elif m5 > m20 and m5_prev <= m20_prev:
            signals.append({"date": date, "type": "BUY", "reason": "골든크로스(MA5/MA20)",
                            "price": safe_float(c), "strength": "MODERATE"})
        elif m5 < m20 and m5_prev >= m20_prev:
            signals.append({"date": date, "type": "SELL", "reason": "데드크로스(MA5/MA20)",
                            "price": safe_float(c), "strength": "MODERATE"})
        elif m > ms and m_prev <= ms_prev:
            signals.append({"date": date, "type": "BUY", "reason": "MACD골든크로스",
                            "price": safe_float(c), "strength": "WEAK"})
        elif m < ms and m_prev >= ms_prev:
            signals.append({"date": date, "type": "SELL", "reason": "MACD데드크로스",
                            "price": safe_float(c), "strength": "WEAK"})

    return signals


# ---------------------------------------------------------------------------
# Performance metrics
# ---------------------------------------------------------------------------

def compute_metrics(df, signals, holding_days=20):
    close = df["Close"]
    date_idx = {d.strftime("%Y-%m-%d"): i for i, d in enumerate(df.index)}
    returns = []

    for sig in signals:
        if sig["type"] != "BUY":
            continue
        idx = date_idx.get(sig["date"])
        if idx is None:
            continue
        exit_idx = min(idx + holding_days, len(close) - 1)
        ret = (float(close.iloc[exit_idx]) - float(close.iloc[idx])) / float(close.iloc[idx])
        returns.append(ret)

    if not returns:
        return {"winRate": 0, "mdd": 0, "sharpeRatio": 0,
                "totalSignals": len(signals), "profitableSignals": 0,
                "avgReturn": 0, "maxReturn": 0, "minReturn": 0}

    win_rate = sum(1 for r in returns if r > 0) / len(returns)
    avg_ret = float(np.mean(returns))

    cum = np.cumprod([1 + r for r in returns])
    roll_max = np.maximum.accumulate(cum)
    mdd = float(np.min((cum - roll_max) / roll_max)) if len(cum) > 0 else 0

    std = float(np.std(returns, ddof=1)) if len(returns) > 1 else 0
    rf_per_trade = 0.03 / (252 / holding_days)
    sharpe = ((avg_ret - rf_per_trade) / std * np.sqrt(252 / holding_days)) if std > 0 else 0

    return {
        "winRate": round(win_rate, 3),
        "mdd": round(mdd, 3),
        "sharpeRatio": round(sharpe, 3),
        "totalSignals": len(signals),
        "buySignals": sum(1 for s in signals if s["type"] == "BUY"),
        "profitableSignals": sum(1 for r in returns if r > 0),
        "avgReturn": round(avg_ret, 4),
        "maxReturn": round(float(max(returns)), 4),
        "minReturn": round(float(min(returns)), 4),
    }


# ---------------------------------------------------------------------------
# Decision tree
# ---------------------------------------------------------------------------

def compute_decision(df):
    row = df.iloc[-1]

    def g(col, default=0):
        v = row.get(col, default)
        return default if pd.isna(v) else float(v)

    rsi = g("rsi14", 50)
    close = g("Close")
    bb_u = g("bb_upper", close * 1.02)
    bb_l = g("bb_lower", close * 0.98)
    macd = g("macd")
    macd_s = g("macd_signal")
    ma5 = g("ma5", close)
    ma20 = g("ma20", close)
    ma60 = g("ma60", close)

    bb_range = bb_u - bb_l
    bb_pos = (close - bb_l) / bb_range if bb_range > 0 else 0.5

    rsi_sig = ("OVERBOUGHT" if rsi > 70 else "BULLISH" if rsi > 60
               else "OVERSOLD" if rsi < 30 else "BEARISH" if rsi < 40 else "NEUTRAL")
    rsi_lbl = {"OVERBOUGHT": "과매수", "BULLISH": "강세", "OVERSOLD": "과매도",
                "BEARISH": "약세", "NEUTRAL": "중립"}[rsi_sig]

    macd_sig_val = ("BULLISH" if macd > macd_s and macd > 0
                    else "RECOVERING" if macd > macd_s
                    else "BEARISH" if macd < macd_s and macd < 0 else "WEAKENING")
    macd_lbl = {"BULLISH": "강세", "RECOVERING": "회복중", "BEARISH": "약세", "WEAKENING": "약화중"}[macd_sig_val]

    trend_sig = ("STRONG_UPTREND" if ma5 > ma20 > ma60
                 else "UPTREND" if ma5 > ma20
                 else "STRONG_DOWNTREND" if ma5 < ma20 < ma60
                 else "DOWNTREND" if ma5 < ma20 else "SIDEWAYS")
    trend_lbl = {"STRONG_UPTREND": "강한 상승추세", "UPTREND": "상승추세",
                 "STRONG_DOWNTREND": "강한 하락추세", "DOWNTREND": "하락추세", "SIDEWAYS": "횡보"}[trend_sig]

    bb_sig = "AT_UPPER" if bb_pos > 0.85 else "AT_LOWER" if bb_pos < 0.15 else "MIDDLE"
    bb_lbl = {"AT_UPPER": "밴드 상단", "AT_LOWER": "밴드 하단", "MIDDLE": "밴드 중단"}[bb_sig]

    bull = sum([rsi_sig == "BULLISH", macd_sig_val in ("BULLISH", "RECOVERING"),
                trend_sig in ("STRONG_UPTREND", "UPTREND"), bb_sig == "AT_LOWER"])
    bear = sum([rsi_sig == "OVERBOUGHT", macd_sig_val in ("BEARISH", "WEAKENING"),
                trend_sig in ("STRONG_DOWNTREND", "DOWNTREND"), bb_sig == "AT_UPPER"])

    if rsi_sig == "OVERSOLD" and bb_sig == "AT_LOWER":
        state, lbl, cash, strategy, color, advice = ("STRONG_BUY", "강력 매수 구간", 10,
            "AGGRESSIVE_BUY", "#00ff88", "공격적 매수")
        desc = "강한 과매도 구간입니다. RSI 30 이하 + BB 하단 돌파. 분할 매수를 적극 고려하세요."
    elif rsi_sig == "OVERBOUGHT" and bb_sig == "AT_UPPER":
        state, lbl, cash, strategy, color, advice = ("STRONG_SELL", "강력 현금 확보 구간", 70,
            "TAKE_PROFIT", "#ff3366", "현금 비중 확대")
        desc = "강한 과매수 구간입니다. RSI 70 초과 + BB 상단 돌파. 수익 실현 및 현금 확대 권장합니다."
    elif bull >= 3:
        state, lbl, cash, strategy, color, advice = ("BULLISH", "상승 추세 지속", 20,
            "HOLD", "#00cc66", "보유 유지")
        desc = "대부분의 지표가 강세입니다. 보유 포지션 유지, 조정 시 추가 매수를 고려하세요."
    elif bear >= 3:
        state, lbl, cash, strategy, color, advice = ("BEARISH", "하락 추세 주의", 60,
            "REDUCE", "#ff6644", "현금 비중 증가")
        desc = "대부분의 지표가 약세입니다. 현금 비중을 늘리고 추가 하락에 대비하세요."
    else:
        state, lbl, cash, strategy, color, advice = ("NEUTRAL", "중립 - 관망 구간", 40,
            "WATCH", "#ffaa00", "분할 매수 관찰")
        desc = "지표가 혼재되어 있습니다. 명확한 방향이 확인될 때까지 분할 접근을 권장합니다."

    supports = [{"level": round(v, 2), "label": l}
                for v, l in [(ma5, "MA5"), (ma20, "MA20"), (ma60, "MA60"), (bb_l, "BB하단")]
                if v < close * 0.995]
    resistances = [{"level": round(v, 2), "label": l}
                   for v, l in [(ma5, "MA5"), (ma20, "MA20"), (ma60, "MA60"), (bb_u, "BB상단")]
                   if v > close * 1.005]

    return {
        "currentState": state, "stateLabel": lbl, "color": color,
        "advice": advice, "cashRatio": cash, "strategy": strategy, "description": desc,
        "confidence": min(max(bull if bull > bear else -bear, -4), 4),
        "indicators": {
            "rsi": {"value": round(rsi, 1), "signal": rsi_sig, "label": rsi_lbl},
            "macd": {"value": round(macd, 2), "signal": macd_sig_val, "label": macd_lbl},
            "bbPosition": {"value": round(bb_pos, 2), "signal": bb_sig, "label": bb_lbl},
            "trend": {"signal": trend_sig, "label": trend_lbl},
        },
        "supportLevels": sorted(supports, key=lambda x: x["level"], reverse=True)[:3],
        "resistanceLevels": sorted(resistances, key=lambda x: x["level"])[:3],
    }


# ---------------------------------------------------------------------------
# Correlations
# ---------------------------------------------------------------------------

def compute_correlations(kospi_df, qqq_df, sox_df, window=60, start_1y=None):
    kr = kospi_df["Close"].pct_change().dropna()
    result = {"current": {"kospi_qqq": None, "kospi_sox": None}, "rolling60": []}

    rolling = {}
    for name, ext_df in [("kospi_qqq", qqq_df), ("kospi_sox", sox_df)]:
        if ext_df is None or ext_df.empty:
            continue
        er = ext_df["Close"].pct_change().dropna()
        common = kr.index.intersection(er.index)
        if len(common) < window:
            continue
        roll = kr.loc[common].rolling(window).corr(er.loc[common])
        result["current"][name] = safe_float(roll.iloc[-1])
        rolling[name] = roll

    if rolling:
        ref_key = list(rolling.keys())[0]
        dates = rolling[ref_key].index
        if start_1y:
            dates = dates[dates >= start_1y]
        for d in dates:
            entry = {"date": d.strftime("%Y-%m-%d")}
            for name, roll in rolling.items():
                if d in roll.index:
                    entry[name] = safe_float(roll.loc[d])
            result["rolling60"].append(entry)

    return result


# ---------------------------------------------------------------------------
# 수급현황: 투자자별 순매수 (NAVER Finance 스크래핑 — 글로벌 IP 호환)
# ---------------------------------------------------------------------------

def fetch_supply_demand():
    """코스피/코스닥 투자자별 순매수 데이터 수집
    KRX API는 국내 IP 제한이 있으므로 NAVER Finance HTML을 사용합니다.
    단위: 억원 (NAVER 기준)
    """
    import re as _re
    import time as _time
    import requests as _req

    session = _req.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Referer": "https://finance.naver.com/sise/sise_trans_style.naver",
    })

    today    = datetime.now()
    cutoff   = today - timedelta(days=400)          # 1년 + 버퍼
    bizdate  = today.strftime("%Y%m%d")

    # 날짜 + 10개 컬럼 (개인, 외국인, 기관계, 금융투자, 보험, 투신, 은행, 기타금융, 연기금, 기타법인)
    ROW_PAT = (
        r'<td class="date2">(\d{2}\.\d{2}\.\d{2})</td>'
        + r'\s*<td[^>]*>([\d,\-]+)</td>' * 10
    )

    def _parse(s: str) -> int:
        s = s.replace(",", "").strip()
        try:
            return int(s)
        except ValueError:
            return 0

    result = {}
    market_map = [
        ("kospi",  "01"),   # sosok=01 → 코스피
        ("kosdaq", "02"),   # sosok=02 → 코스닥
    ]

    for market_name, sosok in market_map:
        series = []
        try:
            for page in range(1, 35):           # 페이지당 10행 × 34 = 340일 최대
                url = (
                    "https://finance.naver.com/sise/investorDealTrendDay.naver"
                    f"?bizdate={bizdate}&sosok={sosok}&page={page}"
                )
                resp = session.get(url, timeout=20)
                if resp.status_code != 200:
                    print(f"  [{market_name}] p{page}: HTTP {resp.status_code}")
                    break

                content = resp.content.decode("euc-kr", errors="replace")
                matches = _re.findall(ROW_PAT, content)
                if not matches:
                    break

                stop = False
                for m in matches:
                    try:
                        dt = datetime.strptime("20" + m[0], "%Y.%m.%d")
                    except ValueError:
                        continue
                    if dt < cutoff:
                        stop = True
                        break

                    series.append({
                        "date":        dt.strftime("%Y-%m-%d"),
                        "individual":  _parse(m[1]),   # 개인
                        "foreign":     _parse(m[2]),   # 외국인
                        "institution": _parse(m[3]),   # 기관계
                    })

                if stop:
                    break
                _time.sleep(0.25)           # 과도한 요청 방지

        except Exception as exc:
            print(f"  Supply/Demand {market_name}: error → {exc}")
            continue

        if not series:
            print(f"  Supply/Demand {market_name}: no data collected")
            continue

        # 날짜 오름차순 정렬
        series.sort(key=lambda x: x["date"])
        result[market_name] = {
            "lastDate": series[-1]["date"],
            "latest": {k: series[-1][k] for k in ["foreign", "institution", "individual"]},
            "series": series,
            "unit": "억원",
        }
        latest = series[-1]
        print(
            f"  Supply/Demand {market_name}: {len(series)} days, "
            f"latest={latest['date']}, "
            f"외국인={latest['foreign']:,} / 기관={latest['institution']:,} / "
            f"개인={latest['individual']:,} 억원"
        )

    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    end = datetime.now()
    start_full = end - timedelta(days=520)
    start_1y = end - timedelta(days=365)

    print(f"Fetching market data ({start_full.date()} → {end.date()}) …")

    kospi = download("^KS11", start_full, end)
    print(f"  KOSPI: {len(kospi)} rows")

    qqq = download("QQQ", start_full, end)
    print(f"  QQQ  : {len(qqq)} rows")

    try:
        sox = download("^SOX", start_full, end)
        print(f"  SOX  : {len(sox)} rows")
    except Exception as e:
        print(f"  SOX  : skipped ({e})")
        sox = pd.DataFrame()

    try:
        vkospi = download("^VKOSPI", start_full, end)
        print(f"  VKOSPI: {len(vkospi)} rows")
    except Exception as e:
        print(f"  VKOSPI: skipped ({e})")
        vkospi = pd.DataFrame()

    # ── 기술 지표 계산 ──────────────────────────────────────
    df = kospi.copy()
    for p in [5, 20, 60, 120, 240]:
        df[f"ma{p}"] = df["Close"].rolling(p).mean()

    df["bb_middle"] = df["Close"].rolling(20).mean()
    bb_std = df["Close"].rolling(20).std()
    df["bb_upper"] = df["bb_middle"] + 2 * bb_std
    df["bb_lower"] = df["bb_middle"] - 2 * bb_std

    df["rsi14"] = compute_rsi(df["Close"])
    df["macd"], df["macd_signal"], df["macd_hist"] = compute_macd(df["Close"])
    df["obv"] = compute_obv(df["Close"], df["Volume"])

    if not vkospi.empty:
        df["vkospi"] = vkospi["Close"].reindex(df.index, method="ffill")

    df1y = df[df.index >= start_1y].copy()
    print(f"  1Y slice: {len(df1y)} rows")

    def to_list(series, key="value"):
        out = []
        for d, v in series.items():
            if d >= start_1y:
                out.append({"date": d.strftime("%Y-%m-%d"), key: safe_float(v)})
        return out

    ohlcv = [
        {
            "date": d.strftime("%Y-%m-%d"),
            "open": safe_float(r["Open"]),
            "high": safe_float(r["High"]),
            "low": safe_float(r["Low"]),
            "close": safe_float(r["Close"]),
            "volume": int(r["Volume"]) if not pd.isna(r["Volume"]) else 0,
        }
        for d, r in df1y.iterrows()
    ]

    indicators = {
        "ma5": to_list(df["ma5"]), "ma20": to_list(df["ma20"]),
        "ma60": to_list(df["ma60"]), "ma120": to_list(df["ma120"]),
        "ma240": to_list(df["ma240"]),
        "bb_upper": to_list(df["bb_upper"]),
        "bb_middle": to_list(df["bb_middle"]),
        "bb_lower": to_list(df["bb_lower"]),
        "rsi14": to_list(df["rsi14"]),
        "macd": to_list(df["macd"]),
        "macd_signal": to_list(df["macd_signal"]),
        "macd_hist": to_list(df["macd_hist"]),
        "obv": to_list(df["obv"]),
        "vkospi": to_list(df["vkospi"]) if "vkospi" in df.columns else [],
    }

    signals  = generate_signals(df1y)
    metrics  = compute_metrics(df1y, signals)
    sr       = find_support_resistance(df1y)
    decision = compute_decision(df1y)
    correlations = compute_correlations(
        df, qqq if not qqq.empty else None,
        sox if not sox.empty else None, start_1y=start_1y
    )

    # 비교 수익률
    comp = {}
    def norm(s):
        base = s.iloc[0]
        return ((s / base) * 100) if base != 0 else s

    kn = norm(df1y["Close"])
    comp["kospi_normalized"] = [{"date": d.strftime("%Y-%m-%d"), "value": safe_float(v)} for d, v in kn.items()]
    comp["kospi_current"] = safe_float(df1y["Close"].iloc[-1])
    comp["kospi_return"]  = safe_float((df1y["Close"].iloc[-1] / df1y["Close"].iloc[0] - 1) * 100)

    for name, ext_df in [("qqq", qqq), ("sox", sox)]:
        if ext_df.empty:
            continue
        s = ext_df[ext_df.index >= start_1y]["Close"]
        if s.empty:
            continue
        sn = norm(s)
        comp[f"{name}_normalized"] = [{"date": d.strftime("%Y-%m-%d"), "value": safe_float(v)} for d, v in sn.items()]
        comp[f"{name}_current"] = safe_float(s.iloc[-1])
        comp[f"{name}_return"]  = safe_float((s.iloc[-1] / s.iloc[0] - 1) * 100)

    # 52주 레인지
    hi52 = safe_float(df1y["High"].max())
    lo52 = safe_float(df1y["Low"].min())
    cur  = safe_float(df1y["Close"].iloc[-1])
    pos52 = round((cur - lo52) / (hi52 - lo52) * 100, 1) if hi52 and lo52 and hi52 != lo52 else 50

    # ── 수급현황 ──────────────────────────────────────────
    print("Fetching supply/demand data (pykrx) …")
    supply_demand = fetch_supply_demand()

    output = {
        "metadata": {
            "lastUpdated": datetime.now().isoformat(),
            "dataStart": df1y.index[0].strftime("%Y-%m-%d"),
            "dataEnd": df1y.index[-1].strftime("%Y-%m-%d"),
            "totalDays": len(df1y),
        },
        "ohlcv": ohlcv,
        "indicators": indicators,
        "signals": signals,
        "supportResistance": sr,
        "metrics": metrics,
        "correlations": correlations,
        "comparison": comp,
        "decisionTree": decision,
        "range52w": {"high": hi52, "low": lo52, "current": cur, "position": pos52},
        "supplyDemand": supply_demand,
    }

    os.makedirs("public/data", exist_ok=True)
    path = "public/data/market_data.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

    print(f"\n[OK] {path} written ({os.path.getsize(path) // 1024} KB)")
    print(f"    Signals : {len(signals)}  (Buy: {metrics['buySignals']})")
    print(f"    Decision: {decision['stateLabel']}  (Cash: {decision['cashRatio']}%)")
    if supply_demand:
        for mkt, mdata in supply_demand.items():
            latest = mdata.get("latest", {})
            print(f"    {mkt.upper()} 수급: 외국인={latest.get('foreign',0):,}  기관={latest.get('institution',0):,}  개인={latest.get('individual',0):,}")


if __name__ == "__main__":
    main()
