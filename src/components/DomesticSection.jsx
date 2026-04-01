import MarketCard from './MarketCard.jsx';
import WatchlistTable from './WatchlistTable.jsx';
import MoversList from './MoversList.jsx';
import HeatmapGrid from './HeatmapGrid.jsx';
import { useMarketStore } from '../stores/marketStore.js';

function DomesticSection() {
  const indices = useMarketStore((state) => state.summary.domestic.indices);
  const heatmap = useMarketStore((state) => state.summary.domestic.heatmap);
  const watchlist = useMarketStore((state) => state.watchlist.domestic);
  const movers = useMarketStore((state) => state.movers.domestic);

  return (
    <section className="mt-8 rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50/80 via-white to-slate-50 p-4 sm:p-6">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">국내 시장</h2>
          <p className="text-sm text-slate-600">KOSPI / KOSDAQ 중심 실시간 보드</p>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">DOMESTIC</span>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="grid gap-4 lg:col-span-7">
          <div className="grid gap-3 sm:grid-cols-2">
            {indices.map((item) => (
              <MarketCard key={item.symbol} item={item} />
            ))}
          </div>
          <HeatmapGrid title="국내 히트맵" items={heatmap} />
        </div>

        <div className="grid gap-4 lg:col-span-5">
          <WatchlistTable title="국내 관심종목" items={watchlist} />
          <MoversList title="국내 상위 종목" movers={movers} />
        </div>
      </div>
    </section>
  );
}

export default DomesticSection;
