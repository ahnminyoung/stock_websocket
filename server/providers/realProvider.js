import axios from 'axios';
import { MarketProvider } from './marketProvider.js';
import {
  DOMESTIC_HEATMAP,
  DOMESTIC_INDICES,
  DOMESTIC_NIGHT_FUTURES,
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

const DOMESTIC_CHART_CODE_MAP = {
  KOSPI: 'KOSPI',
  KOSDAQ: 'KOSDAQ',
  KOSPI_NIGHT_FUT: 'FUT',
  KOSDAQ_NIGHT_FUT: 'KOSDAQ',
};

const WORLD_CHART_SYMBOL_MAP = {
  NASDAQ: 'NAS@IXIC',
  'S&P500': 'SPI@SPX',
};

const FX_CHART_SYMBOL_MAP = {
  'USD/KRW': 'FX_USDKRW',
};

const CHART_SYMBOLS = new Set([
  ...Object.keys(DOMESTIC_CHART_CODE_MAP),
  ...Object.keys(WORLD_CHART_SYMBOL_MAP),
  ...Object.keys(FX_CHART_SYMBOL_MAP),
]);

const NAVER_INDEX_DAY_PATH = 'https://finance.naver.com/sise/sise_index_day.naver';
const NAVER_INDEX_TIME_PATH = 'https://finance.naver.com/sise/sise_index_time.naver';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const RANGE_DAY_MAP = {
  '1d': 1,
  '3m': 95,
  '1y': 370,
  '3y': 1110,
  '10y': 3700,
};

const CHART_BASE_PRICE_MAP = {
  KOSPI: 2750,
  KOSDAQ: 900,
  NASDAQ: 22000,
  'S&P500': 6500,
  'USD/KRW': 1500,
  KOSPI_NIGHT_FUT: 820,
  KOSDAQ_NIGHT_FUT: 1120,
};

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCommaNumber = (value, fallback = 0) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  const normalized = String(value).replace(/,/g, '').replace(/%/g, '').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return 0;
  }
  return Math.round((normalized + Number.EPSILON) * factor) / factor;
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
  const directionCode = String(raw.rf ?? '').trim();
  const directionSign = directionCode === '5' ? -1 : directionCode === '2' ? 1 : 0;

  const price = rawPrice / scale;
  const normalizedRawChange =
    rawChange < 0
      ? rawChange
      : directionSign !== 0
        ? rawChange * directionSign
        : rawChange;

  const prevClose = hasPrevClose
    ? parseNumber(raw.pcv) / scale
    : (rawPrice - normalizedRawChange) / scale;
  const change = hasPrevClose ? price - prevClose : normalizedRawChange / scale;
  const fallbackPct = prevClose ? (change / prevClose) * 100 : 0;
  const rawPct = parseNumber(raw.cr, Math.abs(fallbackPct));
  const normalizedRawPct = directionSign !== 0 ? Math.abs(rawPct) * directionSign : rawPct;
  const changePct = hasPrevClose ? fallbackPct : normalizedRawPct || fallbackPct;

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

const extractLastPage = (htmlText, fallback = 1) => {
  const matched = String(htmlText ?? '').match(/page=(\d+)[^>]*>\s*맨뒤/);
  const value = matched ? Number(matched[1]) : fallback;
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const extractWorldMaxDayPage = (htmlText, fallback = 1) => {
  const matched = String(htmlText ?? '').match(/var\s+nMaxDayPage\s*=\s*(\d+)/);
  const value = matched ? Number(matched[1]) : fallback;
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const normalizeDate = (rawDate) => String(rawDate).replace(/\./g, '-');

const toKstTimestamp = (dateText, timeText = '00:00') => {
  const iso = `${dateText}T${timeText}:00+09:00`;
  return new Date(iso).getTime();
};

const toText = (htmlChunk) =>
  String(htmlChunk ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseNaverIndexDayRows = (htmlText) => {
  const rows = String(htmlText ?? '').match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
  const parsed = [];

  rows.forEach((row) => {
    const dateMatch = row.match(/class="date">(\d{4}\.\d{2}\.\d{2})</);
    if (!dateMatch) {
      return;
    }

    const numberMatches = [
      ...row.matchAll(/class="number_1"[^>]*>\s*([+\-]?\d[\d,]*(?:\.\d+)?)\s*</g),
    ].map((match) => match[1]);

    if (!numberMatches.length) {
      return;
    }

    const date = normalizeDate(dateMatch[1]);
    const close = parseCommaNumber(numberMatches[0]);
    const volume = parseCommaNumber(numberMatches.at(-2), 0);

    if (!Number.isFinite(close) || close <= 0) {
      return;
    }

    parsed.push({
      date,
      ts: toKstTimestamp(date, '00:00'),
      close,
      volume,
    });
  });

  return parsed;
};

const parseNaverIndexTimeRows = (htmlText, dateText) => {
  const rows = String(htmlText ?? '').match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
  const parsed = [];

  rows.forEach((row) => {
    const timeMatch = row.match(/class="date">(\d{2}:\d{2})</);
    if (!timeMatch) {
      return;
    }

    const numberMatches = [
      ...row.matchAll(/class="number_1"[^>]*>\s*([+\-]?\d[\d,]*(?:\.\d+)?)\s*</g),
    ].map((match) => match[1]);

    if (!numberMatches.length) {
      return;
    }

    const close = parseCommaNumber(numberMatches[0]);
    const cumulativeVolume = parseCommaNumber(numberMatches.at(-2), 0);
    const time = timeMatch[1];

    if (!Number.isFinite(close) || close <= 0) {
      return;
    }

    parsed.push({
      ts: toKstTimestamp(dateText, time),
      date: dateText,
      time,
      close,
      cumulativeVolume,
    });
  });

  return parsed;
};

const parseNaverWorldDayRows = (htmlText) => {
  const rows = String(htmlText ?? '').match(/<tr[\s\S]*?<\/tr>/g) ?? [];
  const parsed = [];

  rows.forEach((row) => {
    const dateMatch = row.match(/class="tb_td">\s*(\d{4}\.\d{2}\.\d{2})\s*<\/td>/);
    if (!dateMatch) {
      return;
    }

    const closeMatch = row.match(/class="tb_td2"><span>\s*([+\-]?\d[\d,]*(?:\.\d+)?)\s*<\/span>/);
    const openMatch = row.match(/class="tb_td4"><span>\s*([+\-]?\d[\d,]*(?:\.\d+)?)\s*<\/span>/);
    const highMatch = row.match(/class="tb_td5"><span>\s*([+\-]?\d[\d,]*(?:\.\d+)?)\s*<\/span>/);
    const lowMatch = row.match(/class="tb_td6"><span>\s*([+\-]?\d[\d,]*(?:\.\d+)?)\s*<\/span>/);
    const diffMatch = row.match(/class="tb_td3"><span[^>]*>\s*([+\-]?\d[\d,]*(?:\.\d+)?)\s*<\/span>/);

    if (!closeMatch || !openMatch || !highMatch || !lowMatch) {
      return;
    }

    const date = normalizeDate(dateMatch[1]);
    const close = parseCommaNumber(closeMatch[1]);
    const open = parseCommaNumber(openMatch[1]);
    const high = parseCommaNumber(highMatch[1]);
    const low = parseCommaNumber(lowMatch[1]);
    const diff = parseCommaNumber(diffMatch?.[1] ?? 0);

    if (![close, open, high, low].every((value) => Number.isFinite(value) && value > 0)) {
      return;
    }

    parsed.push({
      date,
      ts: toKstTimestamp(date, '00:00'),
      open,
      high,
      low,
      close,
      volume: Math.round(Math.max(Math.abs(diff), Math.abs(high - low), 1) * 120000),
    });
  });

  return parsed;
};

const parseNaverFxDailyRows = (htmlText) => {
  const rows = String(htmlText ?? '').match(/<tr[\s\S]*?<\/tr>/g) ?? [];
  const parsed = [];

  rows.forEach((row) => {
    const dateMatch = row.match(/class="date">\s*(\d{4}\.\d{2}\.\d{2})\s*<\/td>/);
    if (!dateMatch) {
      return;
    }

    const numberCells = [...row.matchAll(/<td class="num"[^>]*>([\s\S]*?)<\/td>/g)];
    if (!numberCells.length) {
      return;
    }

    const close = parseCommaNumber(toText(numberCells[0][1]));
    const diffRaw = numberCells[1] ? parseCommaNumber(toText(numberCells[1][1]), 0) : 0;
    const sign = row.includes('ico_up') ? 1 : row.includes('ico_down') ? -1 : 0;
    const diff = sign * Math.abs(diffRaw);
    const prevClose = close - diff;
    const date = normalizeDate(dateMatch[1]);

    if (!Number.isFinite(close) || close <= 0) {
      return;
    }

    parsed.push({
      date,
      ts: toKstTimestamp(date, '00:00'),
      close,
      prevClose: Number.isFinite(prevClose) && prevClose > 0 ? prevClose : close,
      volume: Math.round(Math.max(Math.abs(diffRaw), 0.1) * 300000),
    });
  });

  return parsed;
};

const average = (items) => {
  if (!items.length) {
    return 0;
  }

  const sum = items.reduce((acc, value) => acc + value, 0);
  return sum / items.length;
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

    this.chartCache = new Map();
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

  async fetchDomesticNightFutures() {
    const metas = DOMESTIC_NIGHT_FUTURES.map((item) => ({
      ...item,
      naverCode: item.naverCode,
      scale: item.scale ?? 100,
    }));

    const rows = await this.fetchNaverIndexRows(metas.map((item) => item.naverCode));
    const updatedAt = new Date().toISOString();

    return metas
      .map((meta) => {
        const row = rows.get(meta.naverCode);
        if (!row) {
          return null;
        }

        return {
          ...quoteFromNaver({
            symbol: meta.symbol,
            name: meta.name,
            raw: row,
            scale: meta.scale,
            updatedAt,
          }),
          isProxy: Boolean(meta.isProxy),
        };
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

  getCachedChart(key, ttlMs) {
    const cached = this.chartCache.get(key);
    if (!cached) {
      return null;
    }

    if (Date.now() - cached.storedAt > ttlMs) {
      this.chartCache.delete(key);
      return null;
    }

    return cached.payload;
  }

  setCachedChart(key, payload) {
    this.chartCache.set(key, {
      storedAt: Date.now(),
      payload,
    });
  }

  async fetchNaverIndexDayHtml(code, page) {
    const { data } = await this.http.get(NAVER_INDEX_DAY_PATH, {
      params: { code, page },
      responseType: 'text',
      transformResponse: [(payload) => payload],
    });
    return String(data ?? '');
  }

  async fetchNaverIndexTimeHtml(code, thistime, page) {
    const { data } = await this.http.get(NAVER_INDEX_TIME_PATH, {
      params: { code, thistime, page },
      responseType: 'text',
      transformResponse: [(payload) => payload],
    });
    return String(data ?? '');
  }

  async fetchNaverWorldDayHtml(code, page) {
    const { data } = await this.http.get('https://finance.naver.com/world/sise.naver', {
      params: { symbol: code, page },
      responseType: 'text',
      transformResponse: [(payload) => payload],
    });
    return String(data ?? '');
  }

  async fetchNaverFxDailyHtml(code, page) {
    const { data } = await this.http.get('https://finance.naver.com/marketindex/exchangeDailyQuote.naver', {
      params: { marketindexCd: code, page },
      responseType: 'text',
      transformResponse: [(payload) => payload],
    });
    return String(data ?? '');
  }

  async fetchDailyCloseSeries(symbol, range = '3m') {
    const rangeDays = RANGE_DAY_MAP[range] ?? RANGE_DAY_MAP['1y'];
    const neededTradingDays = Math.ceil(rangeDays * 0.75) + 80;
    const requestedPages = Math.max(2, Math.ceil(neededTradingDays / 6));
    const cacheKey = `daily:${symbol}:${requestedPages}`;
    const cached = this.getCachedChart(cacheKey, 10 * 60 * 1000);
    if (cached) {
      return cached;
    }

    const code = DOMESTIC_CHART_CODE_MAP[symbol];
    const firstHtml = await this.fetchNaverIndexDayHtml(code, 1);
    const totalPages = extractLastPage(firstHtml, requestedPages);
    const lastPage = Math.min(totalPages, Math.max(requestedPages, 2));
    const htmlPages = [firstHtml];

    for (let start = 2; start <= lastPage; start += 8) {
      const chunkPages = Array.from(
        { length: Math.min(8, lastPage - start + 1) },
        (_, index) => start + index
      );

      const chunkResults = await Promise.all(
        chunkPages.map((page) => this.fetchNaverIndexDayHtml(code, page))
      );

      htmlPages.push(...chunkResults);
    }

    const rows = htmlPages
      .flatMap((html) => parseNaverIndexDayRows(html))
      .sort((a, b) => a.ts - b.ts);

    const deduped = rows.filter(
      (row, index, items) => index === 0 || row.date !== items[index - 1].date
    );

    this.setCachedChart(cacheKey, deduped);
    return deduped;
  }

  async fetchIntradaySeries(symbol) {
    const now = new Date();
    const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const yyyy = String(kstNow.getUTCFullYear());
    const mm = String(kstNow.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(kstNow.getUTCDate()).padStart(2, '0');
    const hh = String(kstNow.getUTCHours()).padStart(2, '0');
    const mi = String(kstNow.getUTCMinutes()).padStart(2, '0');
    const ss = String(kstNow.getUTCSeconds()).padStart(2, '0');
    const thistime = `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
    const dateText = `${yyyy}-${mm}-${dd}`;

    const cacheKey = `time:${symbol}:${dateText}`;
    const cached = this.getCachedChart(cacheKey, 15 * 1000);
    if (cached) {
      return cached;
    }

    const code = DOMESTIC_CHART_CODE_MAP[symbol];
    const firstHtml = await this.fetchNaverIndexTimeHtml(code, thistime, 1);
    const totalPages = extractLastPage(firstHtml, 1);
    const lastPage = Math.min(totalPages, 90);
    const htmlPages = [firstHtml];

    for (let start = 2; start <= lastPage; start += 8) {
      const chunkPages = Array.from(
        { length: Math.min(8, lastPage - start + 1) },
        (_, index) => start + index
      );

      const chunkResults = await Promise.all(
        chunkPages.map((page) => this.fetchNaverIndexTimeHtml(code, thistime, page))
      );

      htmlPages.push(...chunkResults);
    }

    const points = htmlPages
      .flatMap((html) => parseNaverIndexTimeRows(html, dateText))
      .sort((a, b) => a.ts - b.ts);

    const deduped = points.filter(
      (item, index, items) => index === 0 || item.ts !== items[index - 1].ts
    );

    this.setCachedChart(cacheKey, deduped);
    return deduped;
  }

  async fetchWorldDailySeries(symbol, range = '3m') {
    const code = WORLD_CHART_SYMBOL_MAP[symbol];
    if (!code) {
      return [];
    }

    const rangeDays = RANGE_DAY_MAP[range] ?? RANGE_DAY_MAP['1y'];
    const neededTradingDays = Math.ceil(rangeDays * 0.75) + 120;
    const requestedPages = Math.max(2, Math.ceil(neededTradingDays / 10));
    const cacheKey = `world:${symbol}:${requestedPages}`;
    const cached = this.getCachedChart(cacheKey, 10 * 60 * 1000);

    if (cached) {
      return cached;
    }

    const firstHtml = await this.fetchNaverWorldDayHtml(code, 1);
    const totalPages = extractWorldMaxDayPage(firstHtml, requestedPages);
    const lastPage = Math.min(totalPages, Math.max(requestedPages, 2));
    const htmlPages = [firstHtml];

    for (let start = 2; start <= lastPage; start += 8) {
      const chunkPages = Array.from(
        { length: Math.min(8, lastPage - start + 1) },
        (_, index) => start + index
      );

      const chunkResults = await Promise.all(
        chunkPages.map((page) => this.fetchNaverWorldDayHtml(code, page))
      );

      htmlPages.push(...chunkResults);
    }

    const rows = htmlPages
      .flatMap((html) => parseNaverWorldDayRows(html))
      .sort((a, b) => a.ts - b.ts);

    const deduped = rows.filter(
      (row, index, items) => index === 0 || row.date !== items[index - 1].date
    );

    this.setCachedChart(cacheKey, deduped);
    return deduped;
  }

  async fetchFxDailySeries(symbol, range = '3m') {
    const code = FX_CHART_SYMBOL_MAP[symbol];
    if (!code) {
      return [];
    }

    const rangeDays = RANGE_DAY_MAP[range] ?? RANGE_DAY_MAP['1y'];
    const neededTradingDays = Math.ceil(rangeDays * 0.75) + 120;
    const requestedPages = Math.max(2, Math.ceil(neededTradingDays / 10));
    const cacheKey = `fx:${symbol}:${requestedPages}`;
    const cached = this.getCachedChart(cacheKey, 10 * 60 * 1000);

    if (cached) {
      return cached;
    }

    const rows = [];
    for (let page = 1; page <= requestedPages; page += 1) {
      const html = await this.fetchNaverFxDailyHtml(code, page);
      const parsed = parseNaverFxDailyRows(html);
      if (!parsed.length) {
        break;
      }
      rows.push(...parsed);
    }

    const deduped = rows
      .sort((a, b) => a.ts - b.ts)
      .filter((row, index, items) => index === 0 || row.date !== items[index - 1].date);

    this.setCachedChart(cacheKey, deduped);
    return deduped;
  }

  toDailyCandles(rows) {
    if (!rows.length) {
      return [];
    }

    return rows.map((row, index) => {
      const prevClose = index > 0 ? rows[index - 1].close : row.close;
      const open = prevClose;
      const close = row.close;
      const wick = Math.max(Math.abs(close - open) * 0.35, close * 0.0012);
      const high = Math.max(open, close) + wick;
      const low = Math.max(0, Math.min(open, close) - wick);

      return {
        ts: row.ts,
        open: round(open, 2),
        high: round(high, 2),
        low: round(low, 2),
        close: round(close, 2),
        volume: Math.round(row.volume ?? 0),
      };
    });
  }

  toOhlcCandles(rows) {
    if (!rows.length) {
      return [];
    }

    return rows.map((row, index) => {
      const prevClose = index > 0 ? rows[index - 1].close : row.close;
      const open = Number.isFinite(row.open) ? row.open : prevClose;
      const close = Number.isFinite(row.close) ? row.close : prevClose;
      const highCandidate = Number.isFinite(row.high) ? row.high : Math.max(open, close);
      const lowCandidate = Number.isFinite(row.low) ? row.low : Math.min(open, close);
      const high = Math.max(highCandidate, open, close);
      const low = Math.max(0, Math.min(lowCandidate, open, close));
      const volume =
        Number.isFinite(row.volume) && row.volume > 0
          ? row.volume
          : Math.max(1000, Math.round(Math.abs(close - open) * 200000));

      return {
        ts: row.ts,
        open: round(open, 2),
        high: round(high, 2),
        low: round(low, 2),
        close: round(close, 2),
        volume: Math.round(volume),
      };
    });
  }

  toMinuteCandles(points) {
    if (!points.length) {
      return [];
    }

    return points.map((point, index) => {
      const prevClose = index > 0 ? points[index - 1].close : point.close;
      const open = prevClose;
      const close = point.close;
      const high = Math.max(open, close);
      const low = Math.min(open, close);
      const prevCumVolume = index > 0 ? points[index - 1].cumulativeVolume : point.cumulativeVolume;
      const deltaVolume = Math.max((point.cumulativeVolume ?? 0) - (prevCumVolume ?? 0), 0);

      return {
        ts: point.ts,
        open: round(open, 2),
        high: round(high, 2),
        low: round(low, 2),
        close: round(close, 2),
        volume: Math.round(deltaVolume),
      };
    });
  }

  aggregateCandles(candles, timeframe) {
    if (timeframe === 'day') {
      return candles;
    }

    const grouped = new Map();

    const toWeekKey = (ts) => {
      const date = new Date(ts + 9 * 60 * 60 * 1000);
      const day = (date.getUTCDay() + 6) % 7;
      date.setUTCDate(date.getUTCDate() - day);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
        date.getUTCDate()
      ).padStart(2, '0')}`;
    };

    const toMonthKey = (ts) => {
      const date = new Date(ts + 9 * 60 * 60 * 1000);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    };

    candles.forEach((candle) => {
      const key = timeframe === 'week' ? toWeekKey(candle.ts) : toMonthKey(candle.ts);
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          ...candle,
        });
        return;
      }

      grouped.set(key, {
        ...existing,
        ts: candle.ts,
        high: Math.max(existing.high, candle.high),
        low: Math.min(existing.low, candle.low),
        close: candle.close,
        volume: Math.round((existing.volume ?? 0) + (candle.volume ?? 0)),
      });
    });

    return [...grouped.values()].sort((a, b) => a.ts - b.ts);
  }

  aggregateTo5m(candles) {
    if (!candles.length) {
      return [];
    }

    const buckets = new Map();

    candles.forEach((candle) => {
      const bucketTs = Math.floor(candle.ts / (5 * MINUTE_MS)) * 5 * MINUTE_MS;
      const existing = buckets.get(bucketTs);

      if (!existing) {
        buckets.set(bucketTs, {
          ts: bucketTs,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume ?? 0,
        });
        return;
      }

      buckets.set(bucketTs, {
        ...existing,
        high: Math.max(existing.high, candle.high),
        low: Math.min(existing.low, candle.low),
        close: candle.close,
        volume: Math.round((existing.volume ?? 0) + (candle.volume ?? 0)),
      });
    });

    return [...buckets.values()].sort((a, b) => a.ts - b.ts);
  }

  synthesizeIntradayCandlesFromDaily(candles, symbol, points = 72) {
    if (!candles.length) {
      return [];
    }

    const last = candles.at(-1);
    const prev = candles.at(-2) ?? last;
    const startPrice = Number(prev.close ?? last.close ?? 0);
    const targetPrice = Number(last.close ?? startPrice);
    const nowTs = Date.now();
    const startTs = nowTs - (points - 1) * 5 * MINUTE_MS;
    const seed = [...String(symbol ?? '')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    const output = [];
    let prevClose = startPrice;

    for (let i = 0; i < points; i += 1) {
      const ratio = points === 1 ? 1 : i / (points - 1);
      const trend = startPrice + (targetPrice - startPrice) * ratio;
      const amplitude = Math.max(Math.abs(targetPrice - startPrice) * 0.14, startPrice * 0.001);
      const wave = Math.sin((i + seed) * 0.41) * amplitude * (1 - ratio * 0.15);
      const close = i === points - 1 ? targetPrice : Math.max(0.1, trend + wave);
      const open = i === 0 ? startPrice : prevClose;
      const wick = Math.max(Math.abs(close - open) * 0.32, Math.max(open, close) * 0.0007);
      const high = Math.max(open, close) + wick;
      const low = Math.max(0.1, Math.min(open, close) - wick);
      const baseVolume = Number(last.volume ?? 0) > 0 ? Number(last.volume ?? 0) / points : 12000;
      const volume = Math.round(baseVolume * (0.7 + Math.abs(Math.sin((i + seed) * 0.57)) * 0.9));

      output.push({
        ts: startTs + i * 5 * MINUTE_MS,
        open: round(open, 2),
        high: round(high, 2),
        low: round(low, 2),
        close: round(close, 2),
        volume,
      });

      prevClose = close;
    }

    return output;
  }

  filterCandlesByRange(candles, range) {
    if (!candles.length) {
      return [];
    }

    if (range === '1d') {
      return candles;
    }

    const days = RANGE_DAY_MAP[range] ?? RANGE_DAY_MAP['1y'];
    const cutoff = Date.now() - days * DAY_MS;
    const filtered = candles.filter((candle) => candle.ts >= cutoff);

    if (filtered.length >= 10) {
      return filtered;
    }

    const fallbackCountMap = {
      '3m': 66,
      '1y': 260,
      '3y': 780,
      '10y': 2600,
    };

    const fallbackCount = fallbackCountMap[range] ?? 260;
    return candles.slice(-fallbackCount);
  }

  movingAverage(candles, period) {
    return candles.map((_, index) => {
      if (index + 1 < period) {
        return null;
      }

      const closes = candles
        .slice(index - period + 1, index + 1)
        .map((item) => Number(item.close ?? 0));

      return round(average(closes), 2);
    });
  }

  buildFallbackChart(symbol, timeframe, range) {
    const basePrice = CHART_BASE_PRICE_MAP[symbol] ?? 1000;
    const pointsByRange = {
      '1d': 72,
      '3m': 70,
      '1y': 220,
      '3y': 360,
      '10y': 560,
    };
    const count = pointsByRange[range] ?? 220;
    const candles = [];
    let current = basePrice * 0.92;
    const intervalMs = timeframe === '5m' ? 5 * MINUTE_MS : DAY_MS;

    for (let i = 0; i < count; i += 1) {
      const wave = Math.sin(i / 5 + symbol.length) * 0.003;
      const drift = i < count * 0.6 ? 0.0008 : -0.0002;
      const close = Math.max(0.1, current * (1 + wave + drift));
      const open = current;
      const high = Math.max(open, close) * 1.0015;
      const low = Math.min(open, close) * 0.9985;
      candles.push({
        ts: Date.now() - (count - i - 1) * intervalMs,
        open: round(open, 2),
        high: round(high, 2),
        low: round(low, 2),
        close: round(close, 2),
        volume: Math.round(50000 + Math.abs(close - open) * 70000),
      });
      current = close;
    }

    const transformed =
      timeframe === 'day' || timeframe === '5m' ? candles : this.aggregateCandles(candles, timeframe);

    return {
      symbol,
      timeframe,
      range: timeframe === '5m' ? '1d' : range,
      candles: transformed,
      ma5: this.movingAverage(transformed, 5),
      ma20: this.movingAverage(transformed, 20),
      updatedAt: new Date().toISOString(),
      source: 'fallback',
    };
  }

  async fetchChart({ symbol = 'KOSPI', timeframe = 'day', range = '3m' } = {}) {
    const normalizedSymbol = CHART_SYMBOLS.has(symbol) ? symbol : 'KOSPI';
    const normalizedTimeframe = ['5m', 'day', 'week', 'month'].includes(timeframe)
      ? timeframe
      : 'day';
    const normalizedRange = ['1d', '3m', '1y', '3y', '10y'].includes(range) ? range : '3m';

    try {
      const isDomestic = Boolean(DOMESTIC_CHART_CODE_MAP[normalizedSymbol]);
      const isWorld = Boolean(WORLD_CHART_SYMBOL_MAP[normalizedSymbol]);
      const isFx = Boolean(FX_CHART_SYMBOL_MAP[normalizedSymbol]);

      if (isDomestic) {
        if (normalizedTimeframe === '5m') {
          const minutePoints = await this.fetchIntradaySeries(normalizedSymbol);
          const minuteCandles = this.toMinuteCandles(minutePoints);
          const fiveMinuteCandles = this.aggregateTo5m(minuteCandles);

          if (fiveMinuteCandles.length > 3) {
            return {
              symbol: normalizedSymbol,
              timeframe: normalizedTimeframe,
              range: '1d',
              candles: fiveMinuteCandles,
              ma5: this.movingAverage(fiveMinuteCandles, 5),
              ma20: this.movingAverage(fiveMinuteCandles, 20),
              updatedAt: new Date().toISOString(),
              source: 'naver-time',
            };
          }
        }

        const dailyRows = await this.fetchDailyCloseSeries(normalizedSymbol, normalizedRange);
        const dailyCandles = this.toDailyCandles(dailyRows);
        const rangeFiltered = this.filterCandlesByRange(dailyCandles, normalizedRange);

        if (normalizedTimeframe === '5m') {
          const intraday = this.synthesizeIntradayCandlesFromDaily(rangeFiltered, normalizedSymbol);
          return {
            symbol: normalizedSymbol,
            timeframe: normalizedTimeframe,
            range: '1d',
            candles: intraday,
            ma5: this.movingAverage(intraday, 5),
            ma20: this.movingAverage(intraday, 20),
            updatedAt: new Date().toISOString(),
            source: 'naver-day-synth',
          };
        }

        const transformed = this.aggregateCandles(rangeFiltered, normalizedTimeframe);
        return {
          symbol: normalizedSymbol,
          timeframe: normalizedTimeframe,
          range: normalizedRange,
          candles: transformed,
          ma5: this.movingAverage(transformed, 5),
          ma20: this.movingAverage(transformed, 20),
          updatedAt: new Date().toISOString(),
          source: 'naver-day',
        };
      }

      if (isWorld) {
        const worldRows = await this.fetchWorldDailySeries(normalizedSymbol, normalizedRange);
        const worldCandles = this.toOhlcCandles(worldRows);
        const rangeFiltered = this.filterCandlesByRange(worldCandles, normalizedRange);

        if (normalizedTimeframe === '5m') {
          const intraday = this.synthesizeIntradayCandlesFromDaily(rangeFiltered, normalizedSymbol);
          return {
            symbol: normalizedSymbol,
            timeframe: normalizedTimeframe,
            range: '1d',
            candles: intraday,
            ma5: this.movingAverage(intraday, 5),
            ma20: this.movingAverage(intraday, 20),
            updatedAt: new Date().toISOString(),
            source: 'naver-world-synth',
          };
        }

        const transformed = this.aggregateCandles(rangeFiltered, normalizedTimeframe);
        return {
          symbol: normalizedSymbol,
          timeframe: normalizedTimeframe,
          range: normalizedRange,
          candles: transformed,
          ma5: this.movingAverage(transformed, 5),
          ma20: this.movingAverage(transformed, 20),
          updatedAt: new Date().toISOString(),
          source: 'naver-world',
        };
      }

      if (isFx) {
        const fxRows = await this.fetchFxDailySeries(normalizedSymbol, normalizedRange);
        const fxCandles = this.toDailyCandles(fxRows);
        const rangeFiltered = this.filterCandlesByRange(fxCandles, normalizedRange);

        if (normalizedTimeframe === '5m') {
          const intraday = this.synthesizeIntradayCandlesFromDaily(rangeFiltered, normalizedSymbol);
          return {
            symbol: normalizedSymbol,
            timeframe: normalizedTimeframe,
            range: '1d',
            candles: intraday,
            ma5: this.movingAverage(intraday, 5),
            ma20: this.movingAverage(intraday, 20),
            updatedAt: new Date().toISOString(),
            source: 'naver-fx-synth',
          };
        }

        const transformed = this.aggregateCandles(rangeFiltered, normalizedTimeframe);
        return {
          symbol: normalizedSymbol,
          timeframe: normalizedTimeframe,
          range: normalizedRange,
          candles: transformed,
          ma5: this.movingAverage(transformed, 5),
          ma20: this.movingAverage(transformed, 20),
          updatedAt: new Date().toISOString(),
          source: 'naver-fx',
        };
      }
    } catch (error) {
      console.error(`[provider] chart fetch fallback for ${normalizedSymbol}:`, error.message);
    }

    return this.buildFallbackChart(normalizedSymbol, normalizedTimeframe, normalizedRange);
  }

  async fetchSummary() {
    const domesticIndicesPromise = this.fetchDomesticIndices();
    const domesticNightFuturesPromise = this.fetchDomesticNightFutures();
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

    const [domesticIndices, domesticNightFutures, domesticHeatmap, stooqQuotes] = await Promise.all([
      domesticIndicesPromise,
      domesticNightFuturesPromise,
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
        nightFutures: domesticNightFutures,
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
