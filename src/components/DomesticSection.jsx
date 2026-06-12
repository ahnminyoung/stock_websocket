import HeatmapGrid from './HeatmapGrid.jsx';
import MoversList from './MoversList.jsx';
import { useMarketStore } from '../stores/marketStore.js';

function DomesticSection() {
  const heatmap = useMarketStore((state) => state.summary.domestic.heatmap);
  const movers = useMarketStore((state) => state.movers.domestic);

  return (
    <section className="flex flex-col rounded-3xl border border-clay-200 bg-gradient-to-br from-clay-50/80 via-cream-50 to-cream-100 p-3 lg:h-full lg:overflow-hidden">
      <header className="mb-2.5 flex items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-ink">국내 시장</h2>
          <p className="text-[11px] text-ink-muted">KOSPI / KOSDAQ 실시간</p>
        </div>
        <span className="rounded-full bg-clay-100 px-2.5 py-0.5 text-[11px] font-semibold text-clay-700">DOMESTIC</span>
      </header>

      <div className="flex flex-col gap-3 lg:flex-1 lg:min-h-0 lg:grid lg:grid-cols-2">
        <div className="lg:min-h-0 lg:overflow-hidden">
          <HeatmapGrid title="국내 히트맵" items={heatmap} />
        </div>
        <div className="lg:min-h-0 lg:overflow-hidden">
          <MoversList title="국내 상위 종목" movers={movers} />
        </div>
      </div>
    </section>
  );
}

export default DomesticSection;
