import { useMemo, useState } from 'react';
import { useMarketStore } from '../stores/marketStore.js';
import { THEME_SECTION_DEFS } from '../data/themeSections.js';
import StockDetailModal from './StockDetailModal.jsx';

function getHeatColor(pct) {
  const c = Math.max(-30, Math.min(30, pct));
  const t = Math.min(Math.abs(c) / 30, 1);
  if (c >= 1) {
    const r = Math.round(255 - (255 - 200) * t);
    const g = Math.round(205 - 205 * t);
    const b = Math.round(205 - (205 - 30) * t);
    return `rgb(${r},${g},${b})`;
  }
  if (c <= -1) {
    const r = Math.round(205 - (205 - 10) * t);
    const g = Math.round(225 - (225 - 60) * t);
    const b = Math.round(255 - (255 - 200) * t);
    return `rgb(${r},${g},${b})`;
  }
  return 'rgb(158,158,158)';
}

const textColor = (pct) => (Math.abs(pct) > 15 ? '#fff' : '#111');
const fmt = (p) => (p > 0 ? '+' : '') + p.toFixed(1) + '%';

function ThemeSection({ section, rank, onStockClick }) {
  const sortedStocks = useMemo(
    () => [...section.stocks].sort((a, b) => b.pct - a.pct),
    [section.stocks],
  );

  const avgColor =
    section.avgPct >= 1 ? '#f04452' : section.avgPct <= -1 ? '#3182f6' : '#8b95a8';

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-1.5 transition-colors hover:border-slate-500">
      {/* 섹션 헤더 */}
      <div className="mb-1 flex items-center justify-between">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-bold tracking-tight"
          style={{ background: getHeatColor(section.avgPct), color: textColor(section.avgPct) }}
        >
          {section.theme}
        </span>
        <span className="text-[11px]">
          <span className="text-slate-400">{rank}위 · </span>
          <span className="font-bold tabular-nums" style={{ color: avgColor }}>
            {fmt(section.avgPct)}
          </span>
        </span>
      </div>

      {/* 종목 3열 그리드 */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md">
        {sortedStocks.map((s) => (
          <div
            key={s.code}
            title={`${s.name} ${fmt(s.pct)}`}
            onClick={() => onStockClick?.(s)}
            className="flex min-w-0 cursor-pointer flex-col items-center justify-center transition-transform hover:z-10 hover:scale-105 hover:brightness-110"
            style={{ background: getHeatColor(s.pct), color: textColor(s.pct), aspectRatio: '2', padding: '2px' }}
          >
            <span className="max-w-full truncate text-[10px] font-semibold leading-tight">{s.name}</span>
            <span className="text-[9.5px] font-bold tabular-nums opacity-90">{fmt(s.pct)}</span>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 9 - sortedStocks.length) }).map((_, i) => (
          <div key={`e-${i}`} style={{ background: 'rgba(255,255,255,0.03)', aspectRatio: '2' }} />
        ))}
      </div>
    </div>
  );
}

function ThemeHeatmap() {
  const themeHeatmap = useMarketStore((state) => state.summary.domestic.themeHeatmap);
  const [selectedStock, setSelectedStock] = useState(null);

  const sorted = useMemo(() => {
    const quoteMap = new Map();
    themeHeatmap.forEach((q) => {
      const code = q.symbol?.split('.')[0] ?? q.symbol;
      quoteMap.set(code, q);
    });

    return THEME_SECTION_DEFS.map((def) => {
      const stocks = def.codes
        .map((code) => {
          const q = quoteMap.get(code);
          if (!q) return null;
          return { name: q.name, code, pct: q.changePct ?? 0 };
        })
        .filter(Boolean);
      return {
        id: def.id,
        theme: def.title,
        stocks,
        avgPct:
          stocks.length > 0
            ? stocks.reduce((s, x) => s + x.pct, 0) / stocks.length
            : 0,
      };
    }).sort((a, b) => b.avgPct - a.avgPct);
  }, [themeHeatmap]);

  const isLoading = themeHeatmap.length === 0;

  return (
    <>
      {/* 전체 높이 제한 없음 — 페이지 스크롤 허용 */}
      <section
        className="rounded-2xl p-3"
        style={{ background: '#0c0f16', border: '1px solid #1a2235' }}
      >
        {/* 헤더 */}
        <header className="flex items-start justify-between gap-4 mb-1.5">
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: '#e7ecf4' }}>
              테마 <span style={{ color: '#f04452' }}>히트맵</span>
            </h2>
            <p className="text-[11px]" style={{ color: '#8b95a8' }}>
              테마별 종목 등락률 · 등락률 높은 순
            </p>
          </div>
          <span className="text-[11px] mt-0.5 shrink-0" style={{ color: '#8b95a8' }}>
            평균 등락률 순 정렬
          </span>
        </header>

        {/* 범례 */}
        <div
          className="flex items-center gap-2 mb-3"
          style={{ fontSize: '11px', color: '#8b95a8' }}
        >
          <span>−30%</span>
          <div
            className="flex-1 rounded-full"
            style={{
              maxWidth: '420px',
              height: '8px',
              background:
                'linear-gradient(to right, rgb(10,60,200), rgb(205,225,255), rgb(158,158,158), rgb(255,205,205), rgb(200,0,30))',
            }}
          />
          <span>+30%</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm" style={{ color: '#8b95a8' }}>
            데이터 로딩 중…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((section, i) => (
              <ThemeSection
                key={section.id}
                section={section}
                rank={i + 1}
                onStockClick={setSelectedStock}
              />
            ))}
          </div>
        )}
      </section>

      {selectedStock && (
        <StockDetailModal stock={selectedStock} onClose={() => setSelectedStock(null)} />
      )}
    </>
  );
}

export default ThemeHeatmap;
