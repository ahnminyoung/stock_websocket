import { useMarketStore } from '../stores/marketStore.js';

const toSigned = (value, digits = 2) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${Number(value ?? 0).toFixed(digits)}`;
};

function GlobalMarketBar() {
  const globalBar = useMarketStore((state) => state.summary.globalBar);

  return (
    <section className="panel mt-4 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">글로벌 시장 요약</h2>
        <p className="text-xs text-slate-500">실시간 스트리밍</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {globalBar.map((item) => {
          const isUp = (item.changePct ?? 0) >= 0;

          return (
            <article
              key={item.symbol}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:-translate-y-0.5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.symbol}</p>
              <p className="mt-1 truncate text-sm font-bold text-slate-800">{item.name}</p>
              <p className="mt-2 text-lg font-extrabold text-slate-900">{Number(item.price ?? 0).toFixed(2)}</p>
              <p className={`text-xs font-bold ${isUp ? 'text-rose-600' : 'text-blue-600'}`}>
                {toSigned(item.change ?? 0)} ({toSigned(item.changePct ?? 0)}%)
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default GlobalMarketBar;
