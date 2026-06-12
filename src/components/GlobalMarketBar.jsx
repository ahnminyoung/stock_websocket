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
const US_INDEX_SYMBOLS = new Set(['NASDAQ', 'S&P500']);
const US_ET_SESSION_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const getUsSessionInfo = (dateInput = Date.now()) => {
  const date = new Date(dateInput);
  const safeDate = Number.isFinite(date.getTime()) ? date : new Date();
  const parts = US_ET_SESSION_FORMATTER.formatToParts(safeDate);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = map.weekday;
  const hour = Number(map.hour ?? 0);
  const minute = Number(map.minute ?? 0);
  const minutes = hour * 60 + minute;
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';

  if (isWeekend) {
    return { key: 'closed', label: '휴장' };
  }

  if (minutes >= 4 * 60 && minutes < 9 * 60 + 30) {
    return { key: 'premarket', label: '프리장' };
  }

  if (minutes >= 9 * 60 + 30 && minutes < 16 * 60) {
    return { key: 'regular', label: '주간거래' };
  }

  if (minutes >= 16 * 60 && minutes < 20 * 60) {
    return { key: 'afterhours', label: '애프터장' };
  }

  return { key: 'closed', label: '휴장' };
};

const formatExtendedSessionText = (item, usSession) => {
  if (!US_INDEX_SYMBOLS.has(item?.symbol)) {
    return '';
  }

  return ` (${usSession.label} ${toSigned(item?.change ?? 0)} (${toSigned(item?.changePct ?? 0)}%))`;
};
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
  const [sessionClock, setSessionClock] = useState(() => Date.now());
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
  const usSession = useMemo(() => getUsSessionInfo(sessionClock), [sessionClock]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionClock(Date.now());
    }, 30000);

    return () => {
      clearInterval(timer);
    };
  }, []);

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
    <section className="panel p-3 flex flex-col overflow-hidden lg:h-full">
      <div className="grid gap-3 lg:flex-1 lg:min-h-0 lg:grid-cols-12">
        {/* 글로벌 시장 요약 */}
        <div className="lg:col-span-7 flex flex-col lg:min-h-0">
          <div className="mb-2 flex items-center justify-between shrink-0">
            <h2 className="text-base font-bold text-ink">글로벌 시장 요약</h2>
            <p className="text-xs text-ink-muted">야간선물 포함 실시간 스트리밍</p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 content-start lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            {globalItems.map((item) => {
              const active = item.symbol === selectedSymbol && CHART_SYMBOLS.has(item.symbol);
              const itemIsUp = (item.changePct ?? 0) >= 0;

              return (
                <button
                  key={item.symbol}
                  type="button"
                  className={`rounded-2xl border bg-cream-50 px-2.5 py-2 text-left shadow-sm transition hover:-translate-y-0.5 ${
                    active ? 'border-clay-500 ring-2 ring-clay-200' : 'border-cream-300'
                  }`}
                  onClick={() => {
                    if (CHART_SYMBOLS.has(item.symbol)) {
                      setSelectedSymbol(item.symbol);
                    }
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">{item.symbol}</p>
                  <p className="mt-0.5 truncate text-xs font-bold text-ink-soft">{item.name}</p>
                  <p className="mt-1.5 text-base font-extrabold text-ink">{toPrice(item.price ?? 0, 2)}</p>
                  <p className={`text-[11px] font-bold ${itemIsUp ? 'text-rose-600' : 'text-blue-600'}`}>
                    {toSigned(item.change ?? 0)} ({toSigned(item.changePct ?? 0)}%)
                    {formatExtendedSessionText(item, usSession)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 차트 */}
        <div className="flex flex-col rounded-2xl border border-cream-300 bg-cream-50 p-3 lg:col-span-5 lg:min-h-0">
          <div className="shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-clay-600">실시간 인덱스 차트</p>
            <h3 className="mt-0.5 text-sm font-bold text-ink">
              {selectedQuote?.name ?? '지수 로딩 중'}
            </h3>
          </div>

          <div className="mt-2 overflow-x-auto pb-0.5 shrink-0">
            <div className="inline-flex min-w-max rounded-full border border-cream-300 bg-cream-200 p-0.5">
              {chartButtons.map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    selectedSymbol === item.symbol
                      ? 'bg-ink text-cream-50'
                      : 'text-ink-muted hover:bg-cream-300'
                  }`}
                  onClick={() => setSelectedSymbol(item.symbol)}
                >
                  {item.symbol}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-end gap-2 border-b border-cream-300 pb-1 shrink-0">
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`px-1.5 py-1 text-xs font-extrabold ${
                  timeframe === option.key
                    ? 'border-b-2 border-clay-500 text-clay-700'
                    : 'text-ink-muted hover:text-ink-soft'
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
            <div className="ml-auto flex flex-wrap items-end gap-1">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`px-1.5 py-1 text-xs font-extrabold ${
                    range === option.key
                      ? 'border-b-2 border-clay-500 text-clay-700'
                      : 'text-ink-muted hover:text-ink-soft'
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
              ))}
            </div>
          </div>

          {/* 차트 영역 */}
          <div
            className="relative min-h-[180px] lg:flex-1 lg:min-h-0 mt-2 overflow-hidden rounded-xl border border-cream-300 bg-cream-100"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(163,159,147,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(163,159,147,0.16) 1px, transparent 1px)',
              backgroundSize: '42px 42px',
            }}
          >
            <p className="absolute left-3 top-2 z-10 text-sm font-extrabold text-ink-faint">
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
                  stroke="rgba(163,159,147,0.24)"
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
                  fill="rgba(163,159,147,0.5)"
                  rx="0.08"
                />
              ))}
            </svg>

            <div className="pointer-events-none absolute left-2 inset-y-0">
              {chart.yTicks.map((tick, index) => (
                <p
                  key={`y-${index}`}
                  className="absolute left-0 text-[10px] font-bold text-ink-muted"
                  style={{ top: `${tick.y}%`, transform: 'translateY(-50%)' }}
                >
                  {toPrice(tick.value, 2)}
                </p>
              ))}
            </div>

            <div className="absolute right-3 top-2 flex items-center gap-3 text-xs font-bold">
              <p className="text-green-600">5</p>
              <p className="text-orange-500">20</p>
            </div>
          </div>

          <div className="mt-1 grid grid-cols-3 text-[10px] font-semibold text-ink-muted shrink-0">
            {chart.xLabels.map((label, index) => (
              <p
                key={`x-${index}`}
                className={index === 1 ? 'text-center' : index === 2 ? 'text-right' : 'text-left'}
              >
                {label.ts ? formatBottomLabel(label.ts, range, timeframe) : '-'}
              </p>
            ))}
          </div>

          <div className="mt-2 flex items-end justify-between shrink-0">
            <div>
              <p className="text-[10px] text-ink-muted">현재가</p>
              <p className="text-lg font-extrabold text-ink">
                {toPrice(chart.latest || selectedQuote?.price || 0, 2)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xs font-bold ${isUp ? 'text-rose-600' : 'text-blue-600'}`}>
                {toSigned(selectedQuote?.change ?? 0)} ({toSigned(selectedQuote?.changePct ?? 0)}%)
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-ink-faint">
                {chartData.source || 'loading'} {chartLoading ? '(로딩중)' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GlobalMarketBar;
