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
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${filter === 'all' ? 'bg-slate-200 text-slate-800' : 'text-slate-500'}`}
              onClick={() => setFilter('all')}
            >
              전체
            </button>
            <button
              type="button"
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${filter === 'gainers' ? 'bg-rose-100 text-rose-700' : 'text-slate-500'}`}
              onClick={() => setFilter('gainers')}
            >
              상승
            </button>
            <button
              type="button"
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${filter === 'losers' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}
              onClick={() => setFilter('losers')}
            >
              하락
            </button>
          </div>

          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
            {['1D', '1W', '1M'].map((key) => (
              <button
                key={key}
                type="button"
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${period === key ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
                onClick={() => setPeriod(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {processedItems.map((item) => {
          const isUp = (item.periodChangePct ?? 0) >= 0;

          return (
            <article
              key={item.symbol}
              className="rounded-xl p-3 text-white shadow-sm"
              style={{ background: colorFromChange(item.periodChangePct) }}
            >
              <p className="truncate text-xs font-bold">{item.symbol}</p>
              <p className="truncate text-xs opacity-90">{item.name}</p>
              <p className="mt-3 text-sm font-extrabold">{(item.periodChangePct ?? 0).toFixed(2)}%</p>
              <p className={`text-[11px] font-semibold ${isUp ? 'text-rose-50' : 'text-blue-50'}`}>
                {Number(item.price ?? 0).toLocaleString('ko-KR')}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default HeatmapGrid;
