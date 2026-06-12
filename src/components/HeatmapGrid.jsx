import { useMemo, useState } from 'react';

const colorFromChange = (changePct) => {
  const intensity = Math.min(Math.abs(changePct ?? 0) / 5, 1);
  const alpha = 0.16 + intensity * 0.68;

  if ((changePct ?? 0) >= 0) {
    return `rgba(244, 63, 94, ${alpha})`;
  }

  return `rgba(37, 99, 235, ${alpha})`;
};

const PERIOD_MULTIPLIER = {
  '1D': 1,
  '1W': 2.6,
  '1M': 5.2,
};

function HeatmapGrid({ title, items = [] }) {
  const [filter, setFilter] = useState('all');
  const [period, setPeriod] = useState('1D');

  const processedItems = useMemo(() => {
    const multiplier = PERIOD_MULTIPLIER[period] ?? 1;

    const withPeriod = items.map((item) => {
      const periodChangePct = Number(((item.changePct ?? 0) * multiplier).toFixed(2));
      const periodChange = Number(((item.price ?? 0) * (periodChangePct / 100)).toFixed(2));

      return {
        ...item,
        periodChangePct,
        periodChange,
      };
    });

    if (filter === 'gainers') {
      return withPeriod.filter((item) => (item.periodChangePct ?? 0) >= 0);
    }

    if (filter === 'losers') {
      return withPeriod.filter((item) => (item.periodChangePct ?? 0) < 0);
    }

    return withPeriod;
  }, [filter, items, period]);

  return (
    <section className="panel p-3 flex flex-col lg:h-full lg:overflow-hidden">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex rounded-full border border-cream-300 bg-cream-50 p-0.5">
            <button
              type="button"
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${filter === 'all' ? 'bg-cream-300 text-ink-soft' : 'text-ink-muted'}`}
              onClick={() => setFilter('all')}
            >
              전체
            </button>
            <button
              type="button"
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${filter === 'gainers' ? 'bg-rose-100 text-rose-700' : 'text-ink-muted'}`}
              onClick={() => setFilter('gainers')}
            >
              상승
            </button>
            <button
              type="button"
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${filter === 'losers' ? 'bg-blue-100 text-blue-700' : 'text-ink-muted'}`}
              onClick={() => setFilter('losers')}
            >
              하락
            </button>
          </div>

          <div className="inline-flex rounded-full border border-cream-300 bg-cream-50 p-0.5">
            {['1D', '1W', '1M'].map((key) => (
              <button
                key={key}
                type="button"
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${period === key ? 'bg-ink text-cream-50' : 'text-ink-muted'}`}
                onClick={() => setPeriod(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
          {processedItems.map((item) => {
            const isUp = (item.periodChangePct ?? 0) >= 0;

            return (
              <article
                key={item.symbol}
                className="rounded-xl p-2 text-white shadow-sm"
                style={{ background: colorFromChange(item.periodChangePct) }}
              >
                <p className="truncate text-[11px] font-bold">{item.symbol}</p>
                <p className="truncate text-[10px] opacity-90">{item.name}</p>
                <p className="mt-2 text-xs font-extrabold">{(item.periodChangePct ?? 0).toFixed(2)}%</p>
                <p className={`text-[10px] font-semibold ${isUp ? 'text-rose-50' : 'text-blue-50'}`}>
                  {Number(item.price ?? 0).toLocaleString('ko-KR')}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HeatmapGrid;
