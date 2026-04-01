const colorFromChange = (changePct) => {
  const intensity = Math.min(Math.abs(changePct ?? 0) / 5, 1);
  const alpha = 0.16 + intensity * 0.68;

  if ((changePct ?? 0) >= 0) {
    return `rgba(244, 63, 94, ${alpha})`;
  }

  return `rgba(37, 99, 235, ${alpha})`;
};

function HeatmapGrid({ title, items = [] }) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">시장 온도 맵</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const isUp = (item.changePct ?? 0) >= 0;

          return (
            <article
              key={item.symbol}
              className="rounded-xl p-3 text-white shadow-sm"
              style={{ background: colorFromChange(item.changePct) }}
            >
              <p className="truncate text-xs font-bold">{item.symbol}</p>
              <p className="truncate text-xs opacity-90">{item.name}</p>
              <p className="mt-3 text-sm font-extrabold">{(item.changePct ?? 0).toFixed(2)}%</p>
              <p className={`text-[11px] font-semibold ${isUp ? 'text-rose-50' : 'text-blue-50'}`}>
                {Number(item.price ?? 0).toLocaleString('ko-KR')}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default HeatmapGrid;
