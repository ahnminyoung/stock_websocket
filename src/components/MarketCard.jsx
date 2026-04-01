const toNumber = (value, digits = 2) =>
  new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value ?? 0);

const toSigned = (value, digits = 2) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${toNumber(value, digits)}`;
};

function MarketCard({ item }) {
  const isUp = (item?.changePct ?? 0) >= 0;

  return (
    <article className="panel card-rise p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item?.symbol}</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-800">{item?.name}</h3>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            isUp ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
          }`}
        >
          {toSigned(item?.changePct ?? 0)}%
        </span>
      </div>
      <p className="mt-5 text-2xl font-extrabold text-slate-900">{toNumber(item?.price ?? 0, 2)}</p>
      <p className={`mt-2 text-sm font-semibold ${isUp ? 'text-rose-600' : 'text-blue-600'}`}>
        {toSigned(item?.change ?? 0)}
      </p>
    </article>
  );
}

export default MarketCard;
