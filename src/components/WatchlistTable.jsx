const toSigned = (value) => `${value >= 0 ? '+' : ''}${Number(value ?? 0).toFixed(2)}`;

function WatchlistTable({ title, items = [] }) {
  return (
    <section className="panel p-4 sm:p-5">
      <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-2 py-2">종목</th>
              <th className="px-2 py-2 text-right">현재가</th>
              <th className="px-2 py-2 text-right">등락률</th>
              <th className="px-2 py-2 text-right">거래량</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isUp = (item.changePct ?? 0) >= 0;

              return (
                <tr key={item.symbol} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-2">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.symbol}</p>
                  </td>
                  <td className="px-2 py-2 text-right font-semibold text-slate-900">
                    {Number(item.price ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                  </td>
                  <td className={`px-2 py-2 text-right font-bold ${isUp ? 'text-rose-600' : 'text-blue-600'}`}>
                    {toSigned(item.changePct ?? 0)}%
                  </td>
                  <td className="px-2 py-2 text-right text-slate-600">
                    {Number(item.volume ?? 0).toLocaleString('ko-KR')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default WatchlistTable;
