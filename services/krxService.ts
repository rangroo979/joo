import dotenv from 'dotenv';
import { KrxRawStock, KrxResponse, Stock } from '../src/types.ts';
import { DEMO_KOREAN_STOCKS } from '../src/data/demoData.ts';

export function safeNumber(value?: string | number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value) return 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function formatDateToKrx(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export function formatKrxDateDisplay(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return dateStr || '';
  const clean = dateStr.replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.substring(0, 4)}.${clean.substring(4, 6)}.${clean.substring(6, 8)}`;
  }
  return dateStr;
}

interface CacheEntry {
  date: string;
  data: Stock[];
  timestamp: number;
}

const cache: {
  kospi: Record<string, CacheEntry>;
  kosdaq: Record<string, CacheEntry>;
  allStocks: CacheEntry | null;
} = {
  kospi: {},
  kosdaq: {},
  allStocks: null,
};

// KRX API endpoints
const KRX_KOSPI_URL = 'https://data-dbg.krx.co.kr/svc/apis/sto/stk_bydd_trd';
const KRX_KOSDAQ_URL = 'https://data-dbg.krx.co.kr/svc/apis/sto/ksq_bydd_trd';

function mapRawToStock(raw: KrxRawStock, isDemo = false): Stock {
  const close = safeNumber(raw.TDD_CLSPRC);
  let change = safeNumber(raw.CMPPREVDD_PRC);
  const changeRate = safeNumber(raw.FLUC_RT);

  // Maintain sign consistency between changeRate and change
  if (changeRate < 0 && change > 0) {
    change = -change;
  } else if (changeRate > 0 && change < 0) {
    change = Math.abs(change);
  }

  return {
    date: raw.BAS_DD || '',
    code: (raw.ISU_CD || '').trim(),
    name: (raw.ISU_NM || '').trim(),
    market: raw.MKT_NM || 'KOSPI',
    securityType: raw.SECT_TP_NM || '',
    close,
    change,
    changeRate,
    open: safeNumber(raw.TDD_OPNPRC),
    high: safeNumber(raw.TDD_HGPRC),
    low: safeNumber(raw.TDD_LWPRC),
    volume: safeNumber(raw.ACC_TRDVOL),
    tradingValue: safeNumber(raw.ACC_TRDVAL),
    marketCap: safeNumber(raw.MKTCAP),
    listedShares: safeNumber(raw.LIST_SHRS),
    isDemo,
  };
}

export async function fetchKrxMarket(url: string, marketName: 'KOSPI' | 'KOSDAQ', date: string): Promise<Stock[] | null> {
  dotenv.config();
  const apiKey = process.env.KRX_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  const endpoint = `${url}?basDd=${date}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        AUTH_KEY: apiKey.trim(),
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    console.log(`KRX ${marketName} response status: ${res.status}`);

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as KrxResponse;
    if (json && Array.isArray(json.OutBlock_1) && json.OutBlock_1.length > 0) {
      console.log(`KRX ${marketName} stocks loaded: ${json.OutBlock_1.length}`);
      return json.OutBlock_1.map((item) => mapRawToStock(item, false));
    } else {
      console.log(`KRX ${marketName} stocks loaded: 0 (empty OutBlock_1)`);
      return null;
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`KRX ${marketName} fetch error: ${errMsg}`);
    return null;
  }
}

export async function getKospiDaily(date: string): Promise<Stock[] | null> {
  if (cache.kospi[date]) {
    return cache.kospi[date].data;
  }
  const stocks = await fetchKrxMarket(KRX_KOSPI_URL, 'KOSPI', date);
  if (stocks && stocks.length > 0) {
    cache.kospi[date] = { date, data: stocks, timestamp: Date.now() };
    return stocks;
  }
  return null;
}

export async function getKosdaqDaily(date: string): Promise<Stock[] | null> {
  if (cache.kosdaq[date]) {
    return cache.kosdaq[date].data;
  }
  const stocks = await fetchKrxMarket(KRX_KOSDAQ_URL, 'KOSDAQ', date);
  if (stocks && stocks.length > 0) {
    cache.kosdaq[date] = { date, data: stocks, timestamp: Date.now() };
    return stocks;
  }
  return null;
}

export function clearKrxCache(): void {
  cache.kospi = {};
  cache.kosdaq = {};
  cache.allStocks = null;
}

// Auto-detect recent business day (up to 7 days backwards)
export async function findRecentBusinessDate(): Promise<{
  date: string;
  kospiStocks: Stock[];
  kosdaqStocks: Stock[];
  isDemo: boolean;
}> {
  dotenv.config();
  const apiKey = process.env.KRX_API_KEY;
  const isKeyConfigured = Boolean(apiKey && apiKey.trim().length > 0);
  console.log(`KRX_API_KEY configured: ${isKeyConfigured}`);

  if (!isKeyConfigured) {
    return {
      date: '20260928',
      kospiStocks: DEMO_KOREAN_STOCKS.filter((s) => s.market === 'KOSPI'),
      kosdaqStocks: DEMO_KOREAN_STOCKS.filter((s) => s.market === 'KOSDAQ'),
      isDemo: true,
    };
  }

  // Calculate current date in KST (UTC + 9)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kstNow = new Date(utc + 9 * 3600000);

  // Search backwards up to 7 days
  for (let i = 0; i < 7; i++) {
    const candidateDate = new Date(kstNow);
    candidateDate.setDate(candidateDate.getDate() - i);
    const dateStr = formatDateToKrx(candidateDate);

    try {
      const [kospi, kosdaq] = await Promise.all([
        getKospiDaily(dateStr),
        getKosdaqDaily(dateStr),
      ]);

      if ((kospi && kospi.length > 0) || (kosdaq && kosdaq.length > 0)) {
        return {
          date: dateStr,
          kospiStocks: kospi || [],
          kosdaqStocks: kosdaq || [],
          isDemo: false,
        };
      }
    } catch {
      // Continue to previous day
    }
  }

  // Fallback to demo data
  return {
    date: '20260928',
    kospiStocks: DEMO_KOREAN_STOCKS.filter((s) => s.market === 'KOSPI'),
    kosdaqStocks: DEMO_KOREAN_STOCKS.filter((s) => s.market === 'KOSDAQ'),
    isDemo: true,
  };
}

export async function getAllKoreanStocks(targetDate?: string, forceRefresh = false): Promise<{
  stocks: Stock[];
  date: string;
  isDemo: boolean;
  totalCount: number;
}> {
  dotenv.config();
  const apiKey = process.env.KRX_API_KEY?.trim();

  // If forceRefresh or if cached data was demo but API key is now present, clear cache
  if (forceRefresh || (cache.allStocks && cache.allStocks.data[0]?.isDemo && apiKey)) {
    clearKrxCache();
  }

  if (cache.allStocks && (!targetDate || cache.allStocks.date === targetDate)) {
    // Return cached if under 10 minutes old
    if (Date.now() - cache.allStocks.timestamp < 10 * 60 * 1000) {
      return {
        stocks: cache.allStocks.data,
        date: cache.allStocks.date,
        isDemo: cache.allStocks.data[0]?.isDemo ?? true,
        totalCount: cache.allStocks.data.length,
      };
    }
  }

  const result = await findRecentBusinessDate();
  const merged: Stock[] = [...result.kospiStocks, ...result.kosdaqStocks];

  cache.allStocks = {
    date: result.date,
    data: merged,
    timestamp: Date.now(),
  };

  return {
    stocks: merged,
    date: result.date,
    isDemo: result.isDemo,
    totalCount: merged.length,
  };
}

export async function searchKoreanStocks(query: string): Promise<Stock[]> {
  const { stocks } = await getAllKoreanStocks();
  if (!query || !query.trim()) {
    // Return top 20 by marketCap or tradingValue
    return stocks.slice(0, 20);
  }

  const cleanQuery = query.trim().toLowerCase();
  const matched = stocks.filter((stock) => {
    const codeMatch = stock.code.toLowerCase().includes(cleanQuery);
    const nameMatch = stock.name.toLowerCase().includes(cleanQuery);
    return codeMatch || nameMatch;
  });

  // Sort exact match first, then by market cap
  matched.sort((a, b) => {
    const aExact = a.name.toLowerCase() === cleanQuery || a.code === cleanQuery;
    const bExact = b.name.toLowerCase() === cleanQuery || b.code === cleanQuery;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStarts = a.name.toLowerCase().startsWith(cleanQuery) || a.code.startsWith(cleanQuery);
    const bStarts = b.name.toLowerCase().startsWith(cleanQuery) || b.code.startsWith(cleanQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return b.marketCap - a.marketCap;
  });

  return matched.slice(0, 20);
}

export async function getStockByCode(code: string): Promise<Stock | null> {
  const cleanCode = code.trim();
  const { stocks } = await getAllKoreanStocks();
  const found = stocks.find((s) => s.code === cleanCode);
  if (found) return found;

  // Check demo fallback if not found
  const demoFound = DEMO_KOREAN_STOCKS.find((s) => s.code === cleanCode);
  return demoFound || null;
}
