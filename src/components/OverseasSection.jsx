import HeatmapGrid from './HeatmapGrid.jsx';
import MoversList from './MoversList.jsx';
import { useMarketStore } from '../stores/marketStore.js';

function OverseasSection() {
  const heatmap = useMarketStore((state) => state.summary.overseas.heatmap);
  const movers = useMarketStore((state) => state.movers.overseas);

  return (
    <section className="flex flex-col rounded-3xl border border-cream-400 bg-gradient-to-br from-cream-200/80 via-cream-50 to-cream-100 p-3 lg:h-full lg:overflow-hidden">
      <header className="mb-2.5 flex items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-ink">해외 시장</h2>
          <p className="text-[11px] text-ink-muted">NASDAQ / S&P500 실시간</p>
        </div>
        <span className="rounded-full bg-ink-soft px-2.5 py-0.5 text-[11px] font-semibold text-cream-100">OVERSEAS</span>
      </header>

      <div className="flex flex-col gap-3 lg:flex-1 lg:min-h-0 lg:grid lg:grid-cols-2">
        <div className="lg:min-h-0 lg:overflow-hidden">
          <HeatmapGrid title="해외 히트맵" items={heatmap} />
        </div>
        <div className="lg:min-h-0 lg:overflow-hidden">
          <MoversList title="해외 상위 종목" movers={movers} />
        </div>
      </div>
    </section>
  );
}

export default OverseasSection;
