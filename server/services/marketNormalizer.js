const round = (value, digits = 2) => Number(Number(value ?? 0).toFixed(digits));

const normalizeQuote = (quote) => ({
  ...quote,
  price: round(quote.price, 2),
  prevClose: round(quote.prevClose, 2),
  change: round(quote.change, 2),
  changePct: round(quote.changePct, 2),
  volume: Math.round(quote.volume ?? 0),
});

const normalizeMoversGroup = (group) => ({
  gainers: (group.gainers ?? []).map(normalizeQuote),
  losers: (group.losers ?? []).map(normalizeQuote),
});

export const normalizeSummary = (payload) => ({
  globalBar: (payload.globalBar ?? []).map(normalizeQuote),
  domestic: {
    indices: (payload.domestic?.indices ?? []).map(normalizeQuote),
    heatmap: (payload.domestic?.heatmap ?? []).map(normalizeQuote),
  },
  overseas: {
    indices: (payload.overseas?.indices ?? []).map(normalizeQuote),
    heatmap: (payload.overseas?.heatmap ?? []).map(normalizeQuote),
  },
  fx: payload.fx ? normalizeQuote(payload.fx) : null,
  updatedAt: payload.updatedAt ?? new Date().toISOString(),
});

export const normalizeWatchlist = (payload) => ({
  domestic: (payload.domestic ?? []).map(normalizeQuote),
  overseas: (payload.overseas ?? []).map(normalizeQuote),
  updatedAt: payload.updatedAt ?? new Date().toISOString(),
});

export const normalizeMovers = (payload) => ({
  domestic: normalizeMoversGroup(payload.domestic ?? {}),
  overseas: normalizeMoversGroup(payload.overseas ?? {}),
  updatedAt: payload.updatedAt ?? new Date().toISOString(),
});
