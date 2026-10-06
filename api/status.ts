import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import {
  findRecentBusinessDate,
  formatKrxDateDisplay,
  clearKrxCache,
} from '../services/krxService.ts';

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AUTH_KEY');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  try {
    dotenv.config();
    const apiKey = process.env.KRX_API_KEY?.trim();
    const krxConfigured = Boolean(apiKey && apiKey.length > 0);
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    const geminiConnected = Boolean(geminiKey && geminiKey.length > 0);

    if (req.query?.refresh === 'true') {
      clearKrxCache();
    }

    const recent = await findRecentBusinessDate();

    const krxConnected = !recent.isDemo && (recent.kospiStocks.length > 0 || recent.kosdaqStocks.length > 0);
    const kospiStatus = recent.kospiStocks.length > 0 && !recent.isDemo ? '정상' : (krxConfigured ? '오류' : '미등록');
    const kosdaqStatus = recent.kosdaqStocks.length > 0 && !recent.isDemo ? '정상' : (krxConfigured ? '오류' : '미등록');

    return res.status(200).json({
      krxConfigured,
      krxConnected,
      kospiStatus,
      kosdaqStatus,
      kospiStocksLoaded: recent.kospiStocks.length,
      kosdaqStocksLoaded: recent.kosdaqStocks.length,
      latestBusinessDate: formatKrxDateDisplay(recent.date),
      rawDate: recent.date,
      isDemoFallback: recent.isDemo,
      geminiConnected,
    });
  } catch (error) {
    return res.status(200).json({
      krxConfigured: false,
      krxConnected: false,
      kospiStatus: '오류',
      kosdaqStatus: '오류',
      kospiStocksLoaded: 0,
      kosdaqStocksLoaded: 0,
      latestBusinessDate: '2026.09.28',
      rawDate: '20260928',
      isDemoFallback: true,
      geminiConnected: false,
      error: '상태 정보를 불러오지 못했습니다.',
    });
  }
}
