import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { Stock, KrxRawStock, KrxResponse } from '../../src/types.ts';
import { DEMO_KOREAN_STOCKS } from '../../src/data/demoData.ts';

dotenv.config();

const KRX_KOSDAQ_URL = 'https://data-dbg.krx.co.kr/svc/apis/sto/ksq_bydd_trd';

function safeNumber(value?: string | number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value) return 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function formatKrxDateDisplay(dateStr: string): string {
  if (!dateStr || dateStr.length < 8) return dateStr || '';
  const clean = dateStr.replace(/\D/g, '');
  if (clean.length === 8) {
    return `${clean.substring(0, 4)}.${clean.substring(4, 6)}.${clean.substring(6, 8)}`;
  }
  return dateStr;
}

function getKstDate(offsetDays = 0): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000 - offsetDays * 86400000);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function mapRawToStock(raw: KrxRawStock, isDemo = false): Stock {
  const close = safeNumber(raw.TDD_CLSPRC);
  let change = safeNumber(raw.CMPPREVDD_PRC);
  const changeRate = safeNumber(raw.FLUC_RT);

  if (changeRate < 0 && change > 0) {
    change = -change;
  } else if (changeRate > 0 && change < 0) {
    change = Math.abs(change);
  }

  return {
    date: raw.BAS_DD || '',
    code: (raw.ISU_CD || '').trim(),
    name: (raw.ISU_NM || '').trim(),
    market: raw.MKT_NM || 'KOSDAQ',
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

// In-memory cache for serverless execution
const kosdaqCache: Record<string, { date: string; data: Stock[]; timestamp: number }> = {};

async function fetchKosdaqKrx(date: string): Promise<Stock[] | null> {
  const apiKey = process.env.KRX_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  if (kosdaqCache[date] && Date.now() - kosdaqCache[date].timestamp < 10 * 60 * 1000) {
    return kosdaqCache[date].data;
  }

  const endpoint = `${KRX_KOSDAQ_URL}?basDd=${date}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        AUTH_KEY: apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return null;
    }

    const json = (await res.json()) as KrxResponse;
    if (json && Array.isArray(json.OutBlock_1) && json.OutBlock_1.length > 0) {
      const stocks = json.OutBlock_1.map((item) => mapRawToStock(item, false));
      kosdaqCache[date] = { date, data: stocks, timestamp: Date.now() };
      return stocks;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AUTH_KEY');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  try {
    dotenv.config();
    const query = req.query || {};
    const basDdParam = (query.basDd || query.date) as string | undefined;
    const code = query.code as string | undefined;
    const q = query.q as string | undefined;

    let targetDate = basDdParam ? basDdParam.replace(/\D/g, '') : '';
    let kosdaqStocks: Stock[] | null = null;
    let isDemo = false;

    // If specific basDd provided (8 digits)
    if (targetDate.length === 8) {
      kosdaqStocks = await fetchKosdaqKrx(targetDate);
    }

    // If no basDd or specific basDd returned nothing, search backwards up to 7 days
    if (!kosdaqStocks || kosdaqStocks.length === 0) {
      const apiKey = process.env.KRX_API_KEY?.trim();
      if (apiKey) {
        for (let i = 0; i < 7; i++) {
          const candidate = getKstDate(i);
          const result = await fetchKosdaqKrx(candidate);
          if (result && result.length > 0) {
            kosdaqStocks = result;
            targetDate = candidate;
            isDemo = false;
            break;
          }
        }
      }
    }

    // Fallback to Demo if KRX returned nothing or key missing
    if (!kosdaqStocks || kosdaqStocks.length === 0) {
      isDemo = true;
      targetDate = targetDate.length === 8 ? targetDate : '20260928';
      kosdaqStocks = DEMO_KOREAN_STOCKS.filter((s) => s.market === 'KOSDAQ');
    }

    // Handle code lookup
    if (code) {
      const cleanCode = code.trim();
      const found = kosdaqStocks.find((s) => s.code === cleanCode);
      if (found) {
        return res.status(200).json(found);
      }
      return res.status(404).json({ error: '해당 종목을 찾을 수 없습니다.' });
    }

    // Handle search query
    if (q !== undefined && q !== '') {
      const cleanQuery = q.trim().toLowerCase();
      const matched = kosdaqStocks.filter((s) =>
        s.name.toLowerCase().includes(cleanQuery) || s.code.includes(cleanQuery)
      );
      return res.status(200).json({ count: matched.length, stocks: matched });
    }

    return res.status(200).json({
      date: formatKrxDateDisplay(targetDate),
      rawDate: targetDate,
      market: 'KOSDAQ',
      isDemo,
      count: kosdaqStocks.length,
      stocks: kosdaqStocks,
    });
  } catch (error) {
    const demoKosdaq = DEMO_KOREAN_STOCKS.filter((s) => s.market === 'KOSDAQ');
    return res.status(200).json({
      date: '2026.09.28',
      rawDate: '20260928',
      market: 'KOSDAQ',
      isDemo: true,
      count: demoKosdaq.length,
      stocks: demoKosdaq,
      error: 'KRX KOSDAQ API 호출 중 오류가 발생하여 DEMO 데이터로 대체되었습니다.',
    });
  }
}
