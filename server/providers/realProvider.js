import axios from 'axios';
import { MarketProvider } from './marketProvider.js';
import {
  DOMESTIC_HEATMAP,
  DOMESTIC_INDICES,
  DOMESTIC_MOVERS_POOL,
  DOMESTIC_WATCHLIST,
  FX_QUOTES,
  OVERSEAS_HEATMAP,
  OVERSEAS_INDICES,
  OVERSEAS_MOVERS_POOL,
  OVERSEAS_WATCHLIST,
} from '../config/symbols.js';

const NAVER_POLLING_URL = 'https://polling.finance.naver.com/api/realtime';
const STOOQ_QUOTE_URL = 'https://stooq.com/q/l/';

const KOREA_INDEX_CODE_MAP = {
  KOSPI: 'KOSPI',
  KOSDAQ: 'KOSDAQ',
};

const OVERSEAS_INDEX_CODE_MAP = {
  NASDAQ: '^ndq',
  'S&P500': '^spx',
};

const FX_CODE_MAP = {
  'USD/KRW': 'usdkrw',
};

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dedupeBy = (items, keySelector) => {
  const map = new Map();
  items.forEach((item) => {
    map.set(keySelector(item), item);
  });
  return [...map.values()];
};

const toDomesticStockCode = (symbol) => symbol.split('.')[0];

const toOverseasStooqCode = (symbol) => `${symbol.toLowerCase()}.us`;

const quoteFromNaver = ({ symbol, name, raw, scale = 1, updatedAt }) => {
  const rawPrice = parseNumber(raw.nv);
  const rawChange = parseNumber(raw.cv);
  const hasPrevClose = raw.pcv !== undefined && raw.pcv !== null;

  const price = rawPrice / scale;
  const prevClose = hasPrevClose ? parseNumber(raw.pcv) / scale : (rawPrice - rawChange) / scale;
  const change = parseNumber(raw.cv) / scale;
  const changePct = parseNumber(raw.cr, prevClose ? (change / prevClose) * 100 : 0);

  return {
    symbol,
    name,
    price,
    prevClose,
    change,
    changePct,
    volume: Math.round(parseNumber(raw.aq)),
    updatedAt,
  };
};

const quoteFromStooq = ({ symbol, name, row }) => {
  const price = parseNumber(row.Close);
  const prevClose = parseNumber(row.Prev, price);
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;

  return {
    symbol,
    name,
    price,
    prevClose,
    change,
    changePct,
    volume: Math.round(parseNumber(row.Volume)),
    updatedAt: row.updatedAt,
  };
};

const parseStooqCsv = (csvText) => {
  const lines = String(csvText ?? '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (lines.length < 2) {
    return new Map();
  }

  const headers = lines[0].split(',').map((header) => header.trim());
  const result = new Map();

  lines.slice(1).forEach((line) => {
    const cells = line.split(',').map((cell) => cell.trim());

    if (!cells.length || cells.some((cell) => cell === 'N/D')) {
      return;
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? '';
    });

    const symbol = String(row.Symbol ?? '').toUpperCase();

    if (!symbol) {
      return;
    }

    const date = row.Date || '';
    const time = row.Time || '00:00:00';
    const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
    const updatedAt = date ? new Date(`${date}T${timeWithSeconds}Z`).toISOString() : new Date().toISOString();

    row.updatedAt = updatedAt;
    result.set(symbol, row);
  });

  return result;
};

export class RealProvider extends MarketProvider {
  constructor() {
    super();

    this.http = axios.create({
      timeout: 7000,
      headers: {
        'User-Agent': 'stock-websocket/1.0 (+real-provider)',
      },
    });
  }

  async fetchNaverIndexRows(indexCodes) {
    const query = `SERVICE_INDEX:${indexCodes.join(',')}`;
    const { data } = await this.http.get(NAVER_POLLING_URL, { params: { query } });
    const rows = data?.result?.areas?.[0]?.datas ?? [];

    return new Map(rows.map((row) => [String(row.cd), row]));
  }

  async fetchNaverStockRows(stockCodes) {
    const query = `SERVICE_ITEM:${stockCodes.join(',')}`;
    const { data } = await this.http.get(NAVER_POLLING_URL, { params: { query } });
    const rows = data?.result?.areas?.[0]?.datas ?? [];

    return new Map(rows.map((row) => [String(row.cd), row]));
  }

  async fetchStooqRows(stooqCodes) {
    if (!stooqCodes.length) {
      return new Map();
    }

    const symbolParam = stooqCodes.map((code) => encodeURIComponent(code)).join('+');
    const url = `${STOOQ_QUOTE_URL}?s=${symbolParam}&f=sd2t2ohlcpv&h&e=csv`;

    const { data } = await this.http.get(url, {
      responseType: 'text',
      transformResponse: [(payload) => payload],
    });

    return parseStooqCsv(data);
  }

  async fetchDomesticIndices() {
    const metas = DOMESTIC_INDICES.map((item) => ({
      ...item,
      naverCode: KOREA_INDEX_CODE_MAP[item.symbol],
      scale: 100,
    }));

    const rows = await this.fetchNaverIndexRows(metas.map((item) => item.naverCode));
    const updatedAt = new Date().toISOString();

    return metas
      .map((meta) => {
        const row = rows.get(meta.naverCode);
        if (!row) {
          return null;
        }

        return quoteFromNaver({
          symbol: meta.symbol,
          name: meta.name,
          raw: row,
          scale: meta.scale,
          updatedAt,
        });
      })
      .filter(Boolean);
  }

  async fetchDomesticStocks(items) {
    const metas = items.map((item) => ({
      ...item,
      naverCode: toDomesticStockCode(item.symbol),
    }));

    const uniqueCodes = dedupeBy(metas.map((item) => item.naverCode), (code) => code);
    const rows = await this.fetchNaverStockRows(uniqueCodes);
    const updatedAt = new Date().toISOString();

    return metas
      .map((meta) => {
        const row = rows.get(meta.naverCode);
        if (!row) {
          return null;
        }

        return quoteFromNaver({
          symbol: meta.symbol,
          name: meta.name,
          raw: row,
          updatedAt,
        });
      })
      .filter(Boolean);
  }

  async fetchOverseasByStooq(items) {
    const metas = items.map((item) => ({
      ...item,
      stooqCode: item.stooqCode ?? toOverseasStooqCode(item.symbol),
    }));

    const uniqueCodes = dedupeBy(metas.map((item) => item.stooqCode), (code) => code);
    const rows = await this.fetchStooqRows(uniqueCodes);

    return metas
      .map((meta) => {
        const row = rows.get(meta.stooqCode.toUpperCase());

        if (!row) {
          return null;
        }

        return quoteFromStooq({
          symbol: meta.symbol,
          name: meta.name,
          row,
        });
      })
      .filter(Boolean);
  }

  async fetchSummary() {
    const domesticIndicesPromise = this.fetchDomesticIndices();
    const domesticHeatmapPromise = this.fetchDomesticStocks(DOMESTIC_HEATMAP);

    const overseasIndexMetas = OVERSEAS_INDICES.map((item) => ({
      ...item,
      stooqCode: OVERSEAS_INDEX_CODE_MAP[item.symbol],
    }));
    const fxMetas = FX_QUOTES.map((item) => ({
      ...item,
      stooqCode: FX_CODE_MAP[item.symbol],
    }));

    const stooqSummaryPromise = this.fetchOverseasByStooq([...overseasIndexMetas, ...OVERSEAS_HEATMAP, ...fxMetas]);

    const [domesticIndices, domesticHeatmap, stooqQuotes] = await Promise.all([
      domesticIndicesPromise,
      domesticHeatmapPromise,
      stooqSummaryPromise,
    ]);

    const quoteMap = new Map(stooqQuotes.map((quote) => [quote.symbol, quote]));

    const overseasIndices = OVERSEAS_INDICES.map((item) => quoteMap.get(item.symbol)).filter(Boolean);
    const overseasHeatmap = OVERSEAS_HEATMAP.map((item) => quoteMap.get(item.symbol)).filter(Boolean);
    const fx = quoteMap.get('USD/KRW') ?? null;

    return {
      globalBar: [...domesticIndices, ...overseasIndices, ...(fx ? [fx] : [])],
      domestic: {
        indices: domesticIndices,
        heatmap: domesticHeatmap,
      },
      overseas: {
        indices: overseasIndices,
        heatmap: overseasHeatmap,
      },
      fx,
      updatedAt: new Date().toISOString(),
    };
  }

  async fetchWatchlist() {
    const [domestic, overseas] = await Promise.all([
      this.fetchDomesticStocks(DOMESTIC_WATCHLIST),
      this.fetchOverseasByStooq(OVERSEAS_WATCHLIST),
    ]);

    return {
      domestic,
      overseas,
      updatedAt: new Date().toISOString(),
    };
  }

  pickMovers(quotes) {
    const sorted = [...quotes].sort((a, b) => b.changePct - a.changePct);
    return {
      gainers: sorted.slice(0, 6),
      losers: sorted.slice(-6).reverse(),
    };
  }

  async fetchMovers() {
    const [domesticQuotes, overseasQuotes] = await Promise.all([
      this.fetchDomesticStocks(dedupeBy(DOMESTIC_MOVERS_POOL, (item) => item.symbol)),
      this.fetchOverseasByStooq(dedupeBy(OVERSEAS_MOVERS_POOL, (item) => item.symbol)),
    ]);

    return {
      domestic: this.pickMovers(domesticQuotes),
      overseas: this.pickMovers(overseasQuotes),
      updatedAt: new Date().toISOString(),
    };
  }
}
