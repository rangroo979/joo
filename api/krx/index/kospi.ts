import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';

dotenv.config();

const KRX_KOSPI_INDEX_URL = 'https://data-dbg.krx.co.kr/svc/apis/idx/kospi_dd_trd';

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

const DEMO_KOSPI_INDEX = {
  code: 'KOSPI',
  name: '코스피',
  market: 'KR',
  value: 2712.45,
  change: 24.32,
  changeRate: 0.91,
  date: '2026.09.28',
  rawDate: '20260928',
  isDemo: true,
  history: [2685, 2692, 2701, 2688, 2695, 2710, 2704, 2698, 2702, 2712.45],
};

const indexCache: Record<string, { date: string; data: any; timestamp: number }> = {};

export async function fetchKospiIndexData(targetDate?: string): Promise<{ data: any; isDemo: boolean }> {
  const apiKey = process.env.KRX_API_KEY?.trim();
  if (!apiKey) {
    return { data: DEMO_KOSPI_INDEX, isDemo: true };
  }

  // 1. If specific date provided
  if (targetDate && targetDate.replace(/\D/g, '').length === 8) {
    const cleanDate = targetDate.replace(/\D/g, '');
    if (indexCache[cleanDate] && Date.now() - indexCache[cleanDate].timestamp < 10 * 60 * 1000) {
      return { data: indexCache[cleanDate].data, isDemo: false };
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
              isDemo: false,
              history: [openVal, lowVal, highVal, closeVal],
            };
            indexCache[cleanDate] = { date: cleanDate, data: parsed, timestamp: Date.now() };
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
    if (indexCache[candidate] && Date.now() - indexCache[candidate].timestamp < 10 * 60 * 1000) {
      return { data: indexCache[candidate].data, isDemo: false };
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
              isDemo: false,
              history: [openVal, lowVal, highVal, closeVal],
            };
            indexCache[candidate] = { date: candidate, data: parsed, timestamp: Date.now() };
            return { data: parsed, isDemo: false };
          }
        }
      }
    } catch {
      // Continue searching backwards
    }
  }

  return { data: DEMO_KOSPI_INDEX, isDemo: true };
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

    const { data, isDemo } = await fetchKospiIndexData(basDdParam);

    return res.status(200).json({
      ...data,
      isDemo,
    });
  } catch (error) {
    return res.status(200).json(DEMO_KOSPI_INDEX);
  }
}
