import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { clearKrxCache, findRecentBusinessDate, formatKrxDateDisplay } from '../../services/krxService.ts';

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  try {
    dotenv.config();
    clearKrxCache();
    const recent = await findRecentBusinessDate();
    return res.status(200).json({
      success: true,
      isDemo: recent.isDemo,
      latestBusinessDate: formatKrxDateDisplay(recent.date),
      rawDate: recent.date,
    });
  } catch (error) {
    return res.status(500).json({ error: '캐시 갱신 중 오류가 발생했습니다.' });
  }
}
