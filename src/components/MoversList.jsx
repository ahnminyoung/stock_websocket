import { useMemo, useState } from 'react';

const formatTradingValue = (price, volume) => {
  const value = (price ?? 0) * (volume ?? 0);
  if (value >= 1e11) return `${(value / 1e11).toFixed(0)}천억`;
  if (value >= 1e8) return `${(value / 1e8).toFixed(0)}억`;
  if (value >= 1e4) return `${(value / 1e4).toFixed(0)}만`;
  return value.toLocaleString('ko-KR');
};

const formatVolume = (volume) => {
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}백만주`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(0)}천주`;
  return `${volume}주`;
};

function MoversList({ title, movers }) {
  const [sortMode, setSortMode] = useState('value');

  const topItems = useMemo(() => {
    const all = [...(movers?.gainers ?? []), ...(movers?.losers ?? [])];
    return all
      .sort((a, b) => {
        if (sortMode === 'value') {
          return (b.price ?? 0) * (b.volume ?? 0) - (a.price ?? 0) * (a.volume ?? 0);
        }
        return (b.volume ?? 0) - (a.volume ?? 0);
      })
      .slice(0, 12);
  }, [movers, sortMode]);

  return (
    <section className="panel p-3 flex flex-col lg:h-full lg:overflow-hidden">
      <div className="mb-2 flex items-center justify-between gap-2 shrink-0">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <div className="inline-flex rounded-full border border-cream-300 bg-cream-100 p-0.5">
          <button
            type="button"
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              sortMode === 'value' ? 'bg-ink text-cream-50' : 'text-ink-muted hover:bg-cream-200'
            }`}
            onClick={() => setSortMode('value')}
          >
            거래대금순
          </button>
          <button
            type="button"
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
              sortMode === 'volume' ? 'bg-ink text-cream-50' : 'text-ink-muted hover:bg-cream-200'
            }`}
            onClick={() => setSortMode('volume')}
          >
            거래량순
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto lg:max-h-none lg:flex-1 lg:min-h-0">
        <ul className="space-y-0.5">
          {topItems.map((item, index) => {
            const isUp = (item.changePct ?? 0) >= 0;
            const metric =
              sortMode === 'value'
                ? formatTradingValue(item.price, item.volume)
                : formatVolume(item.volume ?? 0);
            const metricLabel = sortMode === 'value' ? '거래대금' : '거래량';

            return (
              <li
                key={item.symbol}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2.5 lg:py-2 hover:bg-cream-200/60 transition"
              >
                <span className="w-4 shrink-0 text-[10px] font-bold text-ink-faint">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-bold text-ink-soft">{item.name}</p>
                  <p className="text-[10px] text-ink-faint">
                    {metricLabel} <span className="font-semibold text-ink-muted">{metric}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-ink-soft">
                    {Number(item.price ?? 0).toLocaleString('ko-KR')}
                  </p>
                  <p className={`text-[11px] font-bold ${isUp ? 'text-rose-600' : 'text-blue-600'}`}>
                    {isUp ? '+' : ''}{(item.changePct ?? 0).toFixed(2)}%
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default MoversList;
