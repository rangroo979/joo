import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DEMO_MARKET_INDICES } from '../../src/data/demoData.ts';
import { fetchKospiIndexData } from '../krx/index/kospi.ts';
import { fetchKosdaqIndexData } from '../krx/index/kosdaq.ts';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  try {
    const basDd = (req.query?.basDd || req.query?.date) as string | undefined;

    const [kospiRes, kosdaqRes] = await Promise.all([
      fetchKospiIndexData(basDd),
      fetchKosdaqIndexData(basDd),
    ]);

    const usIndices = DEMO_MARKET_INDICES.filter((idx) => idx.code === 'SP500' || idx.code === 'NASDAQ');

    const result = [
      kospiRes.data,
      kosdaqRes.data,
      ...usIndices,
    ];

    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json(DEMO_MARKET_INDICES);
  }
}
