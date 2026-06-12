import { useMemo, useState } from 'react';
import { useMarketStore } from '../stores/marketStore.js';
import { THEME_SECTION_DEFS } from '../data/themeSections.js';
import StockDetailModal from './StockDetailModal.jsx';

function getStockHeatColor(changePct) {
  if (changePct === 0) return '#e8e6dc';
  const cappedRate = Math.min(Math.abs(changePct), 30);
  const intensity = cappedRate / 30;
  const alpha = 0.15 + intensity * 0.85;
  if (changePct > 0) return `rgba(220, 38, 38, ${alpha})`;
  return `rgba(37, 99, 235, ${alpha})`;
}

function getTextColor(changePct) {
  const cappedRate = Math.min(Math.abs(changePct), 30);
  const intensity = cappedRate / 30;
  return intensity > 0.42 ? '#fcfbf8' : '#1f1e1d';
}

function formatRate(changePct) {
  if (changePct === 0) return '0.0%';
  return `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%`;
}

function StockCard({ stock, onClick }) {
  const bg = getStockHeatColor(stock.changePct);
  const color = getTextColor(stock.changePct);

  return (
    <div
      role="button"
      tabIndex={0}
      style={{ background: bg, color }}
      className="rounded-lg flex items-center justify-between gap-2 px-2.5 py-1.5 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-[filter,transform] duration-100 overflow-hidden"
      onClick={() => onClick(stock)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(stock)}
    >
      <p
        title={stock.name}
        style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.2 }}
        className="flex-1 min-w-0 truncate text-left"
      >
        {stock.name}
      </p>
      <p
        style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1 }}
        className="shrink-0 tabular-nums"
      >
        {formatRate(stock.changePct)}
      </p>
    </div>
  );
}

function ThemeSection({ section, onStockClick }) {
  const sortedStocks = useMemo(
    () => [...section.stocks].sort((a, b) => b.changePct - a.changePct),
    [section.stocks],
  );

  const avgChange = sortedStocks.length > 0
    ? sortedStocks.reduce((sum, s) => sum + s.changePct, 0) / sortedStocks.length
    : 0;

  const avgColor = avgChange > 0.5 ? 'text-rose-600' : avgChange < -0.5 ? 'text-blue-600' : 'text-ink-muted';
  const borderColor = avgChange > 1 ? 'border-rose-200' : avgChange < -1 ? 'border-blue-200' : 'border-cream-300/80';
  const headerBg = avgChange > 1 ? 'bg-rose-50/60' : avgChange < -1 ? 'bg-blue-50/60' : 'bg-cream-200/60';

  return (
    <div className={`rounded-xl border ${borderColor} bg-cream-50/70 overflow-hidden flex flex-col`}>
      <div className={`shrink-0 flex items-center justify-between px-2.5 py-1.5 ${headerBg} border-b ${borderColor}`}>
        <span className="text-xs font-extrabold text-ink-soft leading-none">{section.title}</span>
        {sortedStocks.length > 0 && (
          <span className={`text-[11px] font-bold leading-none tabular-nums ${avgColor}`}>
            {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 p-1 grid grid-cols-3 grid-rows-3 gap-1">
        {sortedStocks.map((stock) => (
          <StockCard key={stock.code} stock={stock} onClick={onStockClick} />
        ))}
        {Array.from({ length: Math.max(0, 9 - sortedStocks.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="rounded-lg bg-cream-200/40" />
        ))}
      </div>
    </div>
  );
}

function ThemeHeatmap() {
  const themeHeatmap = useMarketStore((state) => state.summary.domestic.themeHeatmap);
  const [selectedStock, setSelectedStock] = useState(null);

  const sections = useMemo(() => {
    const quoteMap = new Map();
    themeHeatmap.forEach((q) => {
      const code = q.symbol?.split('.')[0] ?? q.symbol;
      quoteMap.set(code, q);
    });

    return THEME_SECTION_DEFS.map((def) => ({
      id: def.id,
      title: def.title,
      stocks: def.codes
        .map((code) => {
          const q = quoteMap.get(code);
          if (!q) return null;
          return { name: q.name, code, changePct: q.changePct ?? 0 };
        })
        .filter(Boolean),
    }));
  }, [themeHeatmap]);

  const isLoading = themeHeatmap.length === 0;

  return (
    <>
      <section className="flex flex-col rounded-3xl border border-cream-400 bg-gradient-to-br from-cream-200/70 via-cream-50 to-clay-50/40 p-3 lg:h-full lg:overflow-hidden">
        <header className="mb-2 flex items-center justify-between gap-2 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-ink">테마 히트맵</h2>
            <p className="text-[11px] text-ink-muted">테마별 종목 등락률 · 등락률 높은 순</p>
          </div>
          <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-[11px] font-semibold text-ink-muted">
            THEME
          </span>
        </header>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-ink-faint">
            데이터 로딩 중…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:flex-1 lg:min-h-0 lg:grid-rows-3">
            {sections.map((section) => (
              <ThemeSection key={section.id} section={section} onStockClick={setSelectedStock} />
            ))}
          </div>
        )}
      </section>

      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </>
  );
}

export default ThemeHeatmap;
