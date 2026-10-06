import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DEMO_US_STOCKS } from '../../src/data/demoData.ts';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  return res.status(200).json(DEMO_US_STOCKS);
}
