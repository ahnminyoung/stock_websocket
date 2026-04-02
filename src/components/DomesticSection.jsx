import MarketCard from './MarketCard.jsx';
import WatchlistTable from './WatchlistTable.jsx';
import MoversList from './MoversList.jsx';
import HeatmapGrid from './HeatmapGrid.jsx';
import { useMarketStore } from '../stores/marketStore.js';

function DomesticSection() {
  const indices = useMarketStore((state) => state.summary.domestic.indices);
  const nightFutures = useMarketStore((state) => state.summary.domestic.nightFutures);
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">국내 야간선물</h3>
              <p className="text-[11px] font-semibold text-amber-700">REALTIME</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {nightFutures.map((item) => (
                <MarketCard key={item.symbol} item={item} />
              ))}
            </div>
            {nightFutures.some((item) => item.isProxy) ? (
              <p className="mt-2 text-[11px] font-medium text-slate-500">
                코스닥 야간선물은 현재 코스닥 현물지수 기반 대체지표로 제공합니다.
              </p>
            ) : null}
          </div>

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
