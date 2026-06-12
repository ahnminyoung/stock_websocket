import { useEffect, useState, useCallback } from 'react';
import { fetchStockDetail } from '../services/marketApi.js';

// ─── formatters ───────────────────────────────────────────────────────────────

function fmtAmt(val) {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(1) + '조';
  if (abs >= 1e8)  return sign + Math.round(abs / 1e8).toLocaleString('ko-KR') + '억';
  return sign + Math.round(abs / 1e4).toLocaleString('ko-KR') + '만';
}

function fmtFlow(val) {
  const abs = Math.abs(val);
  const sign = val >= 0 ? '+' : '-';
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(1) + '조';
  return sign + Math.round(abs / 1e8).toLocaleString('ko-KR') + '억';
}

function fmtPrice(val) {
  return Math.round(val).toLocaleString('ko-KR');
}

// ─── sub-components ───────────────────────────────────────────────────────────

const CAT_STYLE = {
  수주: 'bg-emerald-100 text-emerald-700',
  실적: 'bg-blue-100 text-blue-700',
  기술: 'bg-clay-100 text-clay-700',
  수급: 'bg-amber-100 text-amber-700',
  전략: 'bg-cream-200 text-ink-muted',
  정책: 'bg-teal-100 text-teal-700',
  공시: 'bg-orange-100 text-orange-700',
  산업: 'bg-cream-300 text-ink-muted',
};

const SOURCE_URLS = {
  한국경제: 'https://www.hankyung.com',
  매일경제: 'https://www.mk.co.kr',
  조선비즈: 'https://biz.chosun.com',
  이데일리: 'https://www.edaily.co.kr',
  파이낸셜뉴스: 'https://www.fnnews.com',
  서울경제: 'https://www.sedaily.com',
  뉴시스: 'https://www.newsis.com',
};

function NewsItem({ item }) {
  const isReal = Boolean(item.url || item.date);
  const href = item.url ?? `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(item.title)}`;
  const badgeClass = CAT_STYLE[item.category] ?? 'bg-cream-200 text-ink-muted';

  return (
    <li className="py-2.5 border-b border-cream-200 last:border-0">
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 group">
        {!isReal && item.category && (
          <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold leading-none ${badgeClass}`}>
            {item.category}
          </span>
        )}
        <span className="flex-1 text-[12px] font-medium text-ink-soft leading-snug group-hover:text-clay-600 transition-colors">
          {item.title}
          <span className="ml-1 text-[10px] text-ink-faint group-hover:text-clay-400 transition-colors">↗</span>
        </span>
        <div className="shrink-0 text-right ml-2">
          {item.source && <p className="text-[10px] text-ink-muted whitespace-nowrap font-medium">{item.source}</p>}
          {item.date && <p className="text-[10px] text-ink-faint whitespace-nowrap">{item.date}</p>}
        </div>
      </a>
    </li>
  );
}

function FlowCard({ label, value, sub }) {
  const isUp = value >= 0;
  const color = isUp ? 'text-rose-600' : 'text-blue-600';
  const barColor = isUp ? 'bg-rose-400' : 'bg-blue-400';
  const barW = Math.min(100, (Math.abs(value) / 1e11) * 40);
  return (
    <div className="rounded-xl bg-cream-100 border border-cream-300 p-3 flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold text-ink-muted leading-none">{label}</span>
      <span className={`text-[15px] font-extrabold leading-none ${color}`}>{fmtFlow(value)}</span>
      <div className="h-1.5 rounded-full bg-cream-300 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barW}%` }} />
      </div>
      {sub && <span className="text-[10px] text-ink-faint leading-none">{sub}</span>}
    </div>
  );
}

function FinTable({ financials }) {
  if (!financials?.length) return null;
  const maxRev = Math.max(...financials.map((f) => f.revenue));
  const maxOp  = Math.max(...financials.map((f) => f.operatingProfit));
  const maxNet = Math.max(...financials.map((f) => f.netProfit));

  const rows = [
    { label: '매출액',   key: 'revenue',         max: maxRev, fmt: fmtAmt },
    { label: '영업이익', key: 'operatingProfit',  max: maxOp,  fmt: fmtAmt },
    { label: '순이익',   key: 'netProfit',        max: maxNet, fmt: fmtAmt },
    { label: '영업이익률', key: 'operatingMargin', max: null, fmt: (v) => v.toFixed(1) + '%' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr>
            <th className="text-left text-ink-faint font-semibold pb-1.5 pr-3 w-20"></th>
            {financials.map((f, i) => (
              <th
                key={f.quarter}
                className={`text-center font-bold pb-1.5 px-1 ${
                  i === financials.length - 1
                    ? 'text-clay-600'
                    : 'text-ink-muted'
                }`}
              >
                {f.quarter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="group">
              <td className="text-ink-muted font-semibold py-1 pr-3 whitespace-nowrap">{row.label}</td>
              {financials.map((f, i) => {
                const val = f[row.key];
                const isCurrent = i === financials.length - 1;
                const barPct = row.max ? Math.round((val / row.max) * 100) : 0;
                return (
                  <td
                    key={f.quarter}
                    className={`text-center px-1 py-1 rounded ${isCurrent ? 'bg-clay-50' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`font-bold leading-none ${isCurrent ? 'text-clay-700' : 'text-ink-soft'}`}>
                        {row.fmt(val)}
                      </span>
                      {row.max && (
                        <div className="w-full h-1 rounded-full bg-cream-200 overflow-hidden mt-0.5">
                          <div
                            className={`h-full rounded-full ${isCurrent ? 'bg-clay-400' : 'bg-cream-400'}`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── main modal ───────────────────────────────────────────────────────────────

function StockDetailModal({ stock, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    fetchStockDetail(stock.code).then((data) => {
      if (!cancelled) {
        setDetail(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [stock.code]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const isUp = stock.changePct >= 0;
  const changeColor = isUp ? 'text-rose-500' : 'text-blue-500';
  const changeBg = isUp ? 'bg-rose-50' : 'bg-blue-50';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(31,30,29,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-cream-50 rounded-2xl shadow-2xl w-full max-w-[660px] max-h-[92vh] flex flex-col overflow-hidden">

        {/* header */}
        <div className="shrink-0 px-5 pt-4 pb-3 border-b border-cream-300 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-bold text-ink leading-tight">{stock.name}</h2>
              <span className="text-[11px] text-ink-faint font-semibold mt-0.5">{stock.code}</span>
            </div>
            {detail && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[15px] font-bold text-ink-soft">
                  ₩{fmtPrice(detail.currentPrice)}
                </span>
                <span className={`text-[13px] font-extrabold px-1.5 py-0.5 rounded-md ${changeBg} ${changeColor}`}>
                  {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 mt-0.5 rounded-full w-7 h-7 flex items-center justify-center bg-cream-200 hover:bg-cream-300 text-ink-muted text-[14px] font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-ink-faint">
              데이터 로딩 중…
            </div>
          ) : !detail ? (
            <div className="flex items-center justify-center h-32 text-sm text-ink-faint">
              데이터를 불러올 수 없습니다.
            </div>
          ) : (
            <>
              {/* ── 재무 현황 ── */}
              <section>
                <h3 className="text-[12px] font-extrabold text-ink-soft mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3.5 rounded-full bg-clay-500 inline-block" />
                  재무 현황
                </h3>
                <FinTable financials={detail.financials} />
              </section>

              {/* ── 수급 현황 ── */}
              <section>
                <h3 className="text-[12px] font-extrabold text-ink-soft mb-2 flex items-center gap-1.5">
                  <span className="w-1 h-3.5 rounded-full bg-amber-400 inline-block" />
                  수급 현황
                </h3>

                {/* 시총 + 52주 */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="rounded-xl bg-cream-100 border border-cream-300 p-3">
                    <p className="text-[10px] font-semibold text-ink-muted mb-1">시가총액</p>
                    <p className="text-[16px] font-extrabold text-ink-soft">{fmtAmt(detail.market.marketCap)}</p>
                    <p className="text-[10px] text-ink-faint mt-0.5">외인비율 {detail.market.foreignRatio}%</p>
                  </div>
                  <div className="rounded-xl bg-cream-100 border border-cream-300 p-3">
                    <p className="text-[10px] font-semibold text-ink-muted mb-1">52주 범위</p>
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <p className="text-[10px] text-ink-faint">최고</p>
                        <p className="text-[12px] font-bold text-rose-600">₩{fmtPrice(detail.market.w52High)}</p>
                      </div>
                      <div className="h-1 flex-1 mx-2 rounded-full bg-gradient-to-r from-blue-300 to-rose-300" />
                      <div>
                        <p className="text-[10px] text-ink-faint text-right">최저</p>
                        <p className="text-[12px] font-bold text-blue-600">₩{fmtPrice(detail.market.w52Low)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 수급 흐름 */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <FlowCard
                    label="외국인 순매수"
                    value={detail.market.foreignFlow}
                    sub={`보유비율 ${detail.market.foreignRatio}%`}
                  />
                  <FlowCard label="기관 순매수" value={detail.market.instFlow} />
                  <FlowCard label="개인 순매수" value={detail.market.retailFlow} />
                </div>
              </section>

              {/* ── 뉴스 & 수주 ── */}
              <section>
                {(() => {
                  const isRealNews = detail.news.some((n) => n.url);
                  return (
                    <h3 className="text-[12px] font-extrabold text-ink-soft mb-2 flex items-center gap-1.5">
                      <span className="w-1 h-3.5 rounded-full bg-emerald-500 inline-block" />
                      최근 뉴스 & 수주
                      {!isRealNews && (
                        <span className="ml-auto text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded leading-none">
                          AI 생성 예시
                        </span>
                      )}
                    </h3>
                  );
                })()}
                <ul className="divide-y divide-cream-200">
                  {detail.news.map((item, i) => (
                    <NewsItem key={i} item={item} />
                  ))}
                </ul>
                {!detail.news.some((n) => n.url) && (
                  <p className="mt-2.5 text-[10px] text-ink-faint leading-snug">
                    ※ 위 뉴스는 참고용 예시 데이터입니다. 실제 기사는 아래 링크에서 확인하세요.
                  </p>
                )}
                <a
                  href={`https://finance.naver.com/item/news.naver?code=${detail.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center justify-end gap-1 text-[11px] font-semibold text-ink-faint hover:text-clay-600 transition-colors"
                >
                  네이버 금융 종목 뉴스 전체 보기 ↗
                </a>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockDetailModal;
