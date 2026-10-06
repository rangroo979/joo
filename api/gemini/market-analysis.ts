import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { analyzeMarketSummary } from '../../services/geminiService.ts';
import { DEMO_MARKET_INDICES } from '../../src/data/demoData.ts';

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('OK');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    dotenv.config();
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const indices = body.indices || DEMO_MARKET_INDICES;
    const analysis = await analyzeMarketSummary(indices);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error in /api/gemini/market-analysis:', error);
    return res.status(500).json({ error: '시장 분석 생성 중 오류가 발생했습니다.' });
  }
}
