import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { DEMO_MARKET_INDICES } from '../../src/data/demoData.ts';

dotenv.config();

const KRX_KOSPI_INDEX_URL = 'https://data-dbg.krx.co.kr/svc/apis/idx/kospi_dd_trd';
const KRX_KOSDAQ_INDEX_URL = 'https://data-dbg.krx.co.kr/svc/apis/idx/kosdaq_dd_trd';

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

const DEFAULT_DEMO_KOSPI = {
  code: 'KOSPI',
  name: '코스피',
  market: 'KR',
  value: 2712.45,
  change: 24.32,
  changeRate: 0.91,
  date: '2026.09.28',
  rawDate: '20260928',
  source: 'DEMO',
  isDemo: true,
  history: [2685, 2692, 2701, 2688, 2695, 2710, 2704, 2698, 2702, 2712.45],
};

const DEFAULT_DEMO_KOSDAQ = {
  code: 'KOSDAQ',
  name: '코스닥',
  market: 'KR',
  value: 782.1,
  change: -3.85,
  changeRate: -0.49,
  date: '2026.09.28',
  rawDate: '20260928',
  source: 'DEMO',
  isDemo: true,
  history: [778, 785, 781, 789, 792, 787, 784, 789, 785, 782.1],
};

const kospiCache: Record<string, { date: string; data: any; timestamp: number }> = {};
const kosdaqCache: Record<string, { date: string; data: any; timestamp: number }> = {};

export async function fetchKospiIndexData(targetDate?: string): Promise<{ data: any; isDemo: boolean }> {
  const apiKey = process.env.KRX_API_KEY?.trim();
  if (!apiKey) {
    return { data: DEFAULT_DEMO_KOSPI, isDemo: true };
  }

  // 1. If specific date provided
  if (targetDate && targetDate.replace(/\D/g, '').length === 8) {
    const cleanDate = targetDate.replace(/\D/g, '');
    if (kospiCache[cleanDate] && Date.now() - kospiCache[cleanDate].timestamp < 10 * 60 * 1000) {
      return { data: kospiCache[cleanDate].data, isDemo: false };
    }

    try {
      const res = await fetch(`${KRX_KOSPI_INDEX_URL}?basDd=${cleanDate}`, {
        headers: { AUTH_KEY: apiKey, Accept: 'application/json' },
      });
      if (res.ok) {
        const json: any = await res.json();
        if (json && Array.isArray(json.OutBlock_1) && json.OutBlock_1.length > 0) {
          const item =
            json.OutBlock_1.find((i: any) => i.IDX_NM === '코스피') ||
            json.OutBlock_1.find((i: any) => i.IDX_NM?.trim() === '코스피') ||
            json.OutBlock_1[1] ||
            json.OutBlock_1[0];

          const closeVal = safeNumber(item.CLSPRC_IDX);
          if (closeVal > 0) {
            const openVal = safeNumber(item.OPNPRC_IDX) || closeVal;
            const highVal = safeNumber(item.HGPRC_IDX) || closeVal;
            const lowVal = safeNumber(item.LWPRC_IDX) || closeVal;
            const changeVal = safeNumber(item.CMPPREVDD_IDX);
            let rateVal = safeNumber(item.FLUC_RT);
            if (changeVal < 0 && rateVal > 0) rateVal = -rateVal;

            const parsed = {
              code: 'KOSPI',
              name: '코스피',
              market: 'KR',
              value: closeVal,
              change: changeVal,
              changeRate: rateVal,
              open: openVal,
              high: highVal,
              low: lowVal,
              date: formatKrxDateDisplay(item.BAS_DD || cleanDate),
              rawDate: item.BAS_DD || cleanDate,
              source: 'KRX',
              isDemo: false,
              history: [openVal, lowVal, highVal, closeVal],
            };
            kospiCache[cleanDate] = { date: cleanDate, data: parsed, timestamp: Date.now() };
            return { data: parsed, isDemo: false };
          }
        }
      }
    } catch {
      // Fall through to auto-detect
    }
  }

  // 2. Auto-detect recent business date (up to 7 days back)
  for (let i = 0; i < 7; i++) {
    const candidate = getKstDate(i);
    if (kospiCache[candidate] && Date.now() - kospiCache[candidate].timestamp < 10 * 60 * 1000) {
      return { data: kospiCache[candidate].data, isDemo: false };
    }

    try {
      const res = await fetch(`${KRX_KOSPI_INDEX_URL}?basDd=${candidate}`, {
        headers: { AUTH_KEY: apiKey, Accept: 'application/json' },
      });
      if (res.ok) {
        const json: any = await res.json();
        if (json && Array.isArray(json.OutBlock_1) && json.OutBlock_1.length > 0) {
          const item =
            json.OutBlock_1.find((it: any) => it.IDX_NM === '코스피') ||
            json.OutBlock_1.find((it: any) => it.IDX_NM?.trim() === '코스피') ||
            json.OutBlock_1[1] ||
            json.OutBlock_1[0];

          const closeVal = safeNumber(item.CLSPRC_IDX);
          if (closeVal > 0) {
            const openVal = safeNumber(item.OPNPRC_IDX) || closeVal;
            const highVal = safeNumber(item.HGPRC_IDX) || closeVal;
            const lowVal = safeNumber(item.LWPRC_IDX) || closeVal;
            const changeVal = safeNumber(item.CMPPREVDD_IDX);
            let rateVal = safeNumber(item.FLUC_RT);
            if (changeVal < 0 && rateVal > 0) rateVal = -rateVal;

            const parsed = {
              code: 'KOSPI',
              name: '코스피',
              market: 'KR',
              value: closeVal,
              change: changeVal,
              changeRate: rateVal,
              open: openVal,
              high: highVal,
              low: lowVal,
              date: formatKrxDateDisplay(item.BAS_DD || candidate),
              rawDate: item.BAS_DD || candidate,
              source: 'KRX',
              isDemo: false,
              history: [openVal, lowVal, highVal, closeVal],
            };
            kospiCache[candidate] = { date: candidate, data: parsed, timestamp: Date.now() };
            return { data: parsed, isDemo: false };
          }
        }
      }
    } catch {
      // Continue backwards
    }
  }

  return { data: DEFAULT_DEMO_KOSPI, isDemo: true };
}

// Helper function to extract array rows from varied KRX response wrappers
function extractKrxRows(json: any): any[] {
  if (!json) return [];
  if (Array.isArray(json.OutBlock_1)) return json.OutBlock_1;
  if (Array.isArray(json.outBlock_1)) return json.outBlock_1;
  if (Array.isArray(json.output)) return json.output;
  if (Array.isArray(json.Output)) return json.Output;
  if (Array.isArray(json.OutBlock)) return json.OutBlock;
  if (Array.isArray(json.block1)) return json.block1;
  if (Array.isArray(json)) return json;
  return [];
}

// Helper to identify the representative KOSDAQ index row from KRX series according to priority:
// 1) IDX_NM === "코스닥"
// 2) IDX_NM.trim() === "코스닥"
// 3) IDX_NM.includes("코스닥") && !IDX_NM.includes("150") && !IDX_NM.includes("레버리지") && !IDX_NM.includes("인버스")
// 4) 위 조건에 맞지 않으면 OutBlock_1 중 CLSPRC_IDX가 0보다 큰 첫 번째 항목
function selectKosdaqRepresentative(rows: any[]): any | null {
  if (!rows || rows.length === 0) return null;

  // 1. IDX_NM === "코스닥"
  let item = rows.find((r: any) => r.IDX_NM === '코스닥');
  if (item) return item;

  // 2. IDX_NM.trim() === "코스닥"
  item = rows.find((r: any) => typeof r.IDX_NM === 'string' && r.IDX_NM.trim() === '코스닥');
  if (item) return item;

  // 3. IDX_NM.includes("코스닥") && !IDX_NM.includes("150") && !IDX_NM.includes("레버리지") && !IDX_NM.includes("인버스")
  item = rows.find((r: any) => {
    const nm = typeof r.IDX_NM === 'string' ? r.IDX_NM : '';
    return nm.includes('코스닥') && !nm.includes('150') && !nm.includes('레버리지') && !nm.includes('인버스');
  });
  if (item) return item;

  // 4. CLSPRC_IDX > 0 in OutBlock_1
  item = rows.find((r: any) => safeNumber(r.CLSPRC_IDX) > 0);
  if (item) return item;

  return rows[0] || null;
}

export async function fetchKosdaqIndexData(targetDate?: string): Promise<{ data: any; isDemo: boolean }> {
  const apiKey = (process.env.KRX_API_KEY || '').replace(/^["']|["']$/g, '').trim();
  if (!apiKey) {
    console.warn('[KOSDAQ Index] KRX_API_KEY is not configured. Falling back to DEMO.');
    return { data: { ...DEFAULT_DEMO_KOSDAQ, source: 'DEMO', isDemo: true }, isDemo: true };
  }

  const candidates: string[] = [];
  if (targetDate && targetDate.replace(/\D/g, '').length === 8) {
    candidates.push(targetDate.replace(/\D/g, ''));
  }
  for (let i = 0; i < 10; i++) {
    const candidate = getKstDate(i);
    if (!candidates.includes(candidate)) {
      candidates.push(candidate);
    }
  }

  for (const candidate of candidates) {
    // Check cache
    if (kosdaqCache[candidate] && Date.now() - kosdaqCache[candidate].timestamp < 10 * 60 * 1000) {
      return { data: kosdaqCache[candidate].data, isDemo: false };
    }

    try {
      const res = await fetch(`${KRX_KOSDAQ_INDEX_URL}?basDd=${candidate}`, {
        method: 'GET',
        headers: {
          AUTH_KEY: apiKey,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const errorBody = await res.text();

        console.error('[KOSDAQ Index] KRX error', {
          date: candidate,
          status: res.status,
          statusText: res.statusText,
          bodyPreview: errorBody.slice(0, 300),
        });

        continue;
      }

      const json: any = await res.json();
      const hasOutBlock1 = Boolean(json && (json.OutBlock_1 || json.outBlock_1 || json.output));
      const rows = extractKrxRows(json);
      const rowCount = rows.length;
      const first10IdxNames = rows.slice(0, 10).map((r: any) => String(r.IDX_NM || ''));

      const selectedItem = selectKosdaqRepresentative(rows);
      const selectedIdxName = selectedItem?.IDX_NM || 'none';
      const clsprcIdx = selectedItem ? safeNumber(selectedItem.CLSPRC_IDX) : 0;

      // Diagnostic logging (date, status, statusText, OutBlock_1 exists, row count, first 10 names, selected IDX_NM, CLSPRC_IDX)
      console.log('[KOSDAQ Index] Diagnostic info:', {
        date: candidate,
        status: res.status,
        statusText: res.statusText,
        hasOutBlock1,
        rowCount,
        first10IdxNames,
        selectedIdxName,
        clsprcIdx,
      });

      if (!selectedItem || clsprcIdx <= 0) {
        continue;
      }

      // Mapping:
      // CLSPRC_IDX -> value
      // CMPPREVDD_IDX -> change
      // FLUC_RT -> changeRate
      // BAS_DD -> date
      const openVal = safeNumber(selectedItem.OPNPRC_IDX) || clsprcIdx;
      const highVal = safeNumber(selectedItem.HGPRC_IDX) || clsprcIdx;
      const lowVal = safeNumber(selectedItem.LWPRC_IDX) || clsprcIdx;
      const changeVal = safeNumber(selectedItem.CMPPREVDD_IDX);
      let rateVal = safeNumber(selectedItem.FLUC_RT);
      if (changeVal < 0 && rateVal > 0) rateVal = -rateVal;
      if (changeVal > 0 && rateVal < 0) rateVal = Math.abs(rateVal);

      const parsed = {
        code: 'KOSDAQ',
        name: '코스닥',
        market: 'KR',
        value: clsprcIdx,
        change: changeVal,
        changeRate: rateVal,
        open: openVal,
        high: highVal,
        low: lowVal,
        date: formatKrxDateDisplay(selectedItem.BAS_DD || candidate),
        rawDate: selectedItem.BAS_DD || candidate,
        source: 'KRX',
        isDemo: false,
        history: [openVal, lowVal, highVal, clsprcIdx],
      };

      kosdaqCache[candidate] = { date: candidate, data: parsed, timestamp: Date.now() };
      return { data: parsed, isDemo: false };
    } catch (error) {
      console.error('[KOSDAQ Index] request failed', {
        date: candidate,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
  }

  // Fallback to DEMO if all requests fail
  return { data: { ...DEFAULT_DEMO_KOSDAQ, source: 'DEMO', isDemo: true }, isDemo: true };
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
    const basDd = (req.query?.basDd || req.query?.date) as string | undefined;

    // Fetch KOSPI and KOSDAQ independently so one failure does not affect the other
    const [kospiRes, kosdaqRes] = await Promise.all([
      fetchKospiIndexData(basDd).catch(() => ({ data: DEFAULT_DEMO_KOSPI, isDemo: true })),
      fetchKosdaqIndexData(basDd).catch(() => ({ data: DEFAULT_DEMO_KOSDAQ, isDemo: true })),
    ]);

    const demoIndices = DEMO_MARKET_INDICES;
    const sp500Demo = demoIndices.find((idx) => idx.code === 'SP500') || {
      code: 'SP500',
      name: 'S&P 500',
      market: 'US',
      value: 5738.17,
      change: -7.65,
      changeRate: -0.13,
      date: '2026.09.28',
      rawDate: '20260928',
      source: 'DEMO',
      isDemo: true,
      history: [5680, 5700, 5720, 5710, 5740, 5755, 5730, 5745, 5750, 5738.17],
    };

    const nasdaqDemo = demoIndices.find((idx) => idx.code === 'NASDAQ') || {
      code: 'NASDAQ',
      name: '나스닥',
      market: 'US',
      value: 18119.59,
      change: 70.32,
      changeRate: 0.39,
      date: '2026.09.28',
      rawDate: '20260928',
      source: 'DEMO',
      isDemo: true,
      history: [17950, 18020, 18090, 18050, 18130, 18180, 18100, 18140, 18160, 18119.59],
    };

    const sp500 = { ...sp500Demo, source: 'DEMO', isDemo: true };
    const nasdaq = { ...nasdaqDemo, source: 'DEMO', isDemo: true };

    const kospiItem = {
      ...kospiRes.data,
      source: kospiRes.isDemo ? 'DEMO' : 'KRX',
      isDemo: kospiRes.isDemo,
    };

    const kosdaqItem = {
      ...kosdaqRes.data,
      source: kosdaqRes.isDemo ? 'DEMO' : 'KRX',
      isDemo: kosdaqRes.isDemo,
    };

    // Both array (for backwards compat and lists) and named properties can be supported or standardized
    // The request specified:
    // kospi: { value, change, changeRate, date, source: 'KRX' }, kosdaq, sp500, nasdaq
    // We return both structured dictionary AND list so all callers thrive!
    return res.status(200).json({
      kospi: kospiItem,
      kosdaq: kosdaqItem,
      sp500,
      nasdaq,
      // Array list for convenience:
      indices: [kospiItem, kosdaqItem, sp500, nasdaq],
    });
  } catch (error) {
    const fallbackList = DEMO_MARKET_INDICES.map((i) => ({ ...i, source: 'DEMO', isDemo: true }));
    return res.status(200).json({
      kospi: { ...DEFAULT_DEMO_KOSPI, source: 'DEMO', isDemo: true },
      kosdaq: { ...DEFAULT_DEMO_KOSDAQ, source: 'DEMO', isDemo: true },
      sp500: { code: 'SP500', name: 'S&P 500', market: 'US', value: 5738.17, change: -7.65, changeRate: -0.13, source: 'DEMO', isDemo: true, history: [] },
      nasdaq: { code: 'NASDAQ', name: '나스닥', market: 'US', value: 18119.59, change: 70.32, changeRate: 0.39, source: 'DEMO', isDemo: true, history: [] },
      indices: fallbackList,
    });
  }
}
