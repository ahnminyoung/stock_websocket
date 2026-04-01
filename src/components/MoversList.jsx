const signed = (value) => `${value >= 0 ? '+' : ''}${Number(value ?? 0).toFixed(2)}%`;

function MoversList({ title, movers }) {
  const gainers = movers?.gainers ?? [];
  const losers = movers?.losers ?? [];

  return (
    <section className="panel p-4 sm:p-5">
      <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">상승 상위</p>
          <ul className="space-y-2">
            {gainers.map((item) => (
              <li key={`g-${item.symbol}`} className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.symbol}</p>
                  <p className="text-xs text-slate-500">{item.name}</p>
                </div>
                <p className="text-sm font-bold text-rose-600">{signed(item.changePct)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">하락 상위</p>
          <ul className="space-y-2">
            {losers.map((item) => (
              <li key={`l-${item.symbol}`} className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.symbol}</p>
                  <p className="text-xs text-slate-500">{item.name}</p>
                </div>
                <p className="text-sm font-bold text-blue-600">{signed(item.changePct)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default MoversList;
