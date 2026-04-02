import { useEffect, useMemo, useState } from 'react';
import { fetchChart } from '../services/marketApi.js';
import { useMarketStore } from '../stores/marketStore.js';

const toSigned = (value, digits = 2) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${Number(value ?? 0).toFixed(digits)}`;
};

const toPrice = (value, digits = 2) =>
  Number(value ?? 0).toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const GLOBAL_PRIORITY = {
  KOSPI: 0,
  KOSDAQ: 1,
  NASDAQ: 2,
  'S&P500': 3,
  'USD/KRW': 4,
  KOSPI_NIGHT_FUT: 5,
  KOSDAQ_NIGHT_FUT: 6,
};

const CHART_SYMBOLS = new Set([
  'KOSPI',
  'KOSDAQ',
  'NASDAQ',
  'S&P500',
  'USD/KRW',
  'KOSPI_NIGHT_FUT',
  'KOSDAQ_NIGHT_FUT',
]);
const TIMEFRAME_OPTIONS = [
  { key: '5m', label: '5분봉' },
  { key: 'day', label: '일봉' },
  { key: 'week', label: '주봉' },
  { key: 'month', label: '월봉' },
];
const RANGE_OPTIONS = [
  { key: '1d', label: '1일' },
  { key: '3m', label: '3개월' },
  { key: '1y', label: '1년' },
  { key: '3y', label: '3년' },
  { key: '10y', label: '10년' },
];

const formatBottomLabel = (timestamp, range, timeframe) => {
  const date = new Date(timestamp);
  const yy = String(date.getFullYear()).slice(2);
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');

  if (timeframe === '5m' || range === '1d') {
    return `${hh}:${mi}`;
  }

  if (range === '3m') {
    return `${String(mm).padStart(2, '0')}/${String(dd).padStart(2, '0')}`;
  }

  return `${yy}년 ${mm}월`;
};

const buildChartModel = (candles = [], ma5 = [], ma20 = []) => {
  if (!candles.length) {
    return {
      candles: [],
      volumes: [],
      ma5Points: '',
      ma20Points: '',
      yTicks: [],
      xLabels: [],
      latest: 0,
      chartTop: 8,
      chartBottom: 72,
      volumeTop: 78,
      volumeBottom: 95,
    };
  }

  const chartTop = 8;
  const chartBottom = 72;
  const volumeTop = 78;
  const volumeBottom = 95;
  const xStart = 8;
  const xEnd = 98;

  const rawMin = Math.min(
    ...candles.map((item) => Number(item.low ?? item.close ?? 0)),
    ...ma5.filter((value) => value !== null).map((value) => Number(value)),
    ...ma20.filter((value) => value !== null).map((value) => Number(value))
  );
  const rawMax = Math.max(
    ...candles.map((item) => Number(item.high ?? item.close ?? 0)),
    ...ma5.filter((value) => value !== null).map((value) => Number(value)),
    ...ma20.filter((value) => value !== null).map((value) => Number(value))
  );
  const span = Math.max(rawMax - rawMin, 0.01);
  const pad = span * 0.1;
  const min = rawMin - pad;
  const max = rawMax + pad;
  const range = Math.max(max - min, 0.01);

  const priceToY = (price) =>
    chartBottom - ((Number(price ?? 0) - min) / range) * (chartBottom - chartTop);

  const step = (xEnd - xStart) / Math.max(candles.length, 1);
  const bodyWidth = Math.min(Math.max(step * 0.58, 0.75), 2.2);
  const volumeMax = Math.max(...candles.map((item) => Number(item.volume ?? 0)), 1);

  const renderedCandles = candles.map((item, index) => {
    const x = xStart + step * (index + 0.5);
    const open = Number(item.open ?? item.close ?? 0);
    const close = Number(item.close ?? item.open ?? 0);
    const high = Number(item.high ?? Math.max(open, close));
    const low = Number(item.low ?? Math.min(open, close));
    const isUp = close >= open;

    return {
      x,
      highY: priceToY(high),
      lowY: priceToY(low),
      bodyY: Math.min(priceToY(open), priceToY(close)),
      bodyH: Math.max(Math.abs(priceToY(close) - priceToY(open)), 0.85),
      bodyWidth,
      color: isUp ? '#ef4444' : '#3b82f6',
    };
  });

  const renderedVolumes = candles.map((item, index) => {
    const x = xStart + step * (index + 0.5);
    const ratio = Number(item.volume ?? 0) / volumeMax;
    const height = Math.max((volumeBottom - volumeTop) * ratio, 0.65);

    return {
      x,
      y: volumeBottom - height,
      h: height,
      w: Math.max(bodyWidth * 0.88, 0.62),
    };
  });

  const buildMaPolyline = (maValues) =>
    maValues
      .map((value, index) => {
        if (value === null || value === undefined) {
          return null;
        }
        const x = xStart + step * (index + 0.5);
        const y = priceToY(value);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .filter(Boolean)
      .join(' ');

  const yTicks = Array.from({ length: 6 }, (_, idx) => {
    const ratio = idx / 5;
    const value = max - (max - min) * ratio;
    const y = chartTop + (chartBottom - chartTop) * ratio;
    return {
      value,
      y,
    };
  });

  const xLabels = [0, 0.5, 1].map((ratio) => {
    const index = Math.min(candles.length - 1, Math.max(0, Math.floor((candles.length - 1) * ratio)));
    return {
      x: xStart + (xEnd - xStart) * ratio,
      ts: candles[index]?.ts,
    };
  });

  return {
    candles: renderedCandles,
    volumes: renderedVolumes,
    ma5Points: buildMaPolyline(ma5),
    ma20Points: buildMaPolyline(ma20),
    yTicks,
    xLabels,
    latest: Number(candles.at(-1)?.close ?? 0),
    chartTop,
    chartBottom,
    volumeTop,
    volumeBottom,
  };
};

function GlobalMarketBar() {
  const summary = useMarketStore((state) => state.summary);
  const [selectedSymbol, setSelectedSymbol] = useState('KOSPI');
  const [timeframe, setTimeframe] = useState('day');
  const [range, setRange] = useState('3m');
  const [chartData, setChartData] = useState({
    candles: [],
    ma5: [],
    ma20: [],
    source: '',
    updatedAt: null,
  });
  const [chartLoading, setChartLoading] = useState(false);

  const nightFutures = summary.domestic?.nightFutures ?? [];

  const globalItems = useMemo(() => {
    const merged = new Map();
    [...(summary.globalBar ?? []), ...nightFutures].forEach((item) => {
      merged.set(item.symbol, item);
    });

    return [...merged.values()].sort(
      (a, b) => (GLOBAL_PRIORITY[a.symbol] ?? 99) - (GLOBAL_PRIORITY[b.symbol] ?? 99)
    );
  }, [summary.globalBar, nightFutures]);

  const chartTargets = useMemo(
    () => globalItems.filter((item) => CHART_SYMBOLS.has(item.symbol)),
    [globalItems]
  );

  const selectedQuote = useMemo(
    () => chartTargets.find((item) => item.symbol === selectedSymbol) ?? null,
    [chartTargets, selectedSymbol]
  );

  useEffect(() => {
    if (!chartTargets.length) {
      return;
    }

    if (!chartTargets.some((item) => item.symbol === selectedSymbol)) {
      setSelectedSymbol(chartTargets[0].symbol);
    }
  }, [chartTargets, selectedSymbol]);

  useEffect(() => {
    if (!CHART_SYMBOLS.has(selectedSymbol)) {
      return;
    }

    let cancelled = false;
    setChartLoading(true);

    fetchChart({
      symbol: selectedSymbol,
      timeframe,
      range,
    })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        const normalizedCandles = (payload?.candles ?? []).map((item) => ({
          ...item,
          ts: Number(item.ts),
          open: Number(item.open),
          high: Number(item.high),
          low: Number(item.low),
          close: Number(item.close),
          volume: Number(item.volume ?? 0),
        }));

        setChartData({
          candles: normalizedCandles,
          ma5: (payload?.ma5 ?? []).map((value) => (value === null ? null : Number(value))),
          ma20: (payload?.ma20 ?? []).map((value) => (value === null ? null : Number(value))),
          source: payload?.source ?? '',
          updatedAt: payload?.updatedAt ?? null,
        });
      })
      .catch((error) => {
        console.error('Failed to fetch chart data', error);
      })
      .finally(() => {
        if (!cancelled) {
          setChartLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSymbol, timeframe, range]);

  useEffect(() => {
    if (!selectedQuote || !chartData.candles.length) {
      return;
    }

    setChartData((prev) => {
      const candles = [...prev.candles];
      const last = candles.at(-1);

      if (!last) {
        return prev;
      }

      if (Math.abs((last.close ?? 0) - (selectedQuote.price ?? 0)) < 0.0001) {
        return prev;
      }

      const nextClose = Number(selectedQuote.price ?? last.close);
      candles[candles.length - 1] = {
        ...last,
        high: Math.max(last.high, nextClose),
        low: Math.min(last.low, nextClose),
        close: nextClose,
      };

      return {
        ...prev,
        candles,
      };
    });
  }, [selectedQuote, chartData.candles.length]);

  const chart = useMemo(
    () => buildChartModel(chartData.candles, chartData.ma5, chartData.ma20),
    [chartData.candles, chartData.ma5, chartData.ma20]
  );

  const isUp = (selectedQuote?.changePct ?? 0) >= 0;
  const chartButtons = chartTargets;

  return (
    <section className="panel mt-4 p-4 sm:p-5">
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">글로벌 시장 요약</h2>
            <p className="text-xs text-slate-500">야간선물 포함 실시간 스트리밍</p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {globalItems.map((item) => {
              const active = item.symbol === selectedSymbol && CHART_SYMBOLS.has(item.symbol);
              const itemIsUp = (item.changePct ?? 0) >= 0;

              return (
                <button
                  key={item.symbol}
                  type="button"
                  className={`rounded-2xl border bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 ${
                    active ? 'border-slate-900 ring-2 ring-slate-300' : 'border-slate-200'
                  }`}
                  onClick={() => {
                    if (CHART_SYMBOLS.has(item.symbol)) {
                      setSelectedSymbol(item.symbol);
                    }
                  }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.symbol}</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="mt-2 text-lg font-extrabold text-slate-900">{toPrice(item.price ?? 0, 2)}</p>
                  <p className={`text-xs font-bold ${itemIsUp ? 'text-rose-600' : 'text-blue-600'}`}>
                    {toSigned(item.change ?? 0)} ({toSigned(item.changePct ?? 0)}%)
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 xl:col-span-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">실시간 인덱스 차트</p>
            <h3 className="mt-0.5 text-lg font-extrabold text-slate-900">
              {selectedQuote?.name ?? '지수 로딩 중'}
            </h3>
          </div>

          <div className="mt-3 overflow-x-auto pb-1">
            <div className="inline-flex min-w-max rounded-full border border-slate-200 bg-slate-50 p-1">
              {chartButtons.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${
                    selectedSymbol === item.symbol
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setSelectedSymbol(item.symbol)}
                >
                  {item.symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3 border-b border-slate-200 pb-1">
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`px-2 py-2 text-[15px] font-extrabold ${
                  timeframe === option.key
                    ? 'border-b-2 border-slate-900 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => {
                  setTimeframe(option.key);
                  if (option.key === '5m') {
                    setRange('1d');
                  } else if (range === '1d') {
                    setRange('3m');
                  }
                }}
              >
                {option.label}
              </button>
            ))}
            <div className="ml-auto flex flex-wrap items-end gap-2">
              {RANGE_OPTIONS.map((option) => {
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`px-2 py-2 text-[15px] font-extrabold ${
                      range === option.key
                        ? 'border-b-2 border-slate-900 text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => {
                      if (option.key === '1d') {
                        setTimeframe('5m');
                        setRange('1d');
                        return;
                      }

                      if (timeframe === '5m' && option.key !== '1d') {
                        setTimeframe('day');
                      }
                      setRange(option.key);
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="relative mt-3 h-64 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          >
            <p className="absolute left-3 top-2 z-10 text-lg font-extrabold text-slate-400">
              {TIMEFRAME_OPTIONS.find((item) => item.key === timeframe)?.label ?? '일봉'}
            </p>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              {chart.yTicks.map((tick, index) => (
                <line
                  key={`grid-${index}`}
                  x1="8"
                  y1={tick.y}
                  x2="98"
                  y2={tick.y}
                  stroke="rgba(148,163,184,0.24)"
                  strokeWidth="0.3"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {chart.ma5Points ? (
                <polyline
                  points={chart.ma5Points}
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="0.38"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {chart.ma20Points ? (
                <polyline
                  points={chart.ma20Points}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="0.38"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {chart.candles.map((item, index) => (
                <g key={`candle-${index}`}>
                  <line
                    x1={item.x}
                    y1={item.highY}
                    x2={item.x}
                    y2={item.lowY}
                    stroke={item.color}
                    strokeWidth="0.34"
                    vectorEffect="non-scaling-stroke"
                  />
                  <rect
                    x={item.x - item.bodyWidth / 2}
                    y={item.bodyY}
                    width={item.bodyWidth}
                    height={item.bodyH}
                    fill={item.color}
                    rx="0.12"
                  />
                </g>
              ))}

              {chart.volumes.map((item, index) => (
                <rect
                  key={`vol-${index}`}
                  x={item.x - item.w / 2}
                  y={item.y}
                  width={item.w}
                  height={item.h}
                  fill="rgba(148,163,184,0.55)"
                  rx="0.08"
                />
              ))}
            </svg>

            <div className="pointer-events-none absolute left-2 inset-y-0">
              {chart.yTicks.map((tick, index) => (
                <p
                  key={`y-${index}`}
                  className="absolute left-0 text-[11px] font-bold text-slate-500"
                  style={{ top: `${tick.y}%`, transform: 'translateY(-50%)' }}
                >
                  {toPrice(tick.value, 2)}
                </p>
              ))}
            </div>

            <div className="absolute right-3 top-2 flex items-center gap-3 text-sm font-bold">
              <p className="text-green-600">5</p>
              <p className="text-orange-500">20</p>
            </div>
          </div>

          <div className="mt-1 grid grid-cols-3 text-sm font-semibold text-slate-500">
            {chart.xLabels.map((label, index) => (
              <p
                key={`x-${index}`}
                className={index === 1 ? 'text-center' : index === 2 ? 'text-right' : 'text-left'}
              >
                {label.ts ? formatBottomLabel(label.ts, range, timeframe) : '-'}
              </p>
            ))}
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">현재가</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {toPrice(chart.latest || selectedQuote?.price || 0, 2)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${isUp ? 'text-rose-600' : 'text-blue-600'}`}>
                {toSigned(selectedQuote?.change ?? 0)} ({toSigned(selectedQuote?.changePct ?? 0)}%)
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                source: {chartData.source || 'loading'} {chartLoading ? '(불러오는 중...)' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GlobalMarketBar;
