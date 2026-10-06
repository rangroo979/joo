import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { compareStocks } from '../../services/geminiService.ts';

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
    const { stocks } = body;
    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ error: '비교할 종목 목록이 없습니다.' });
    }
    const result = await compareStocks(stocks);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/gemini/compare:', error);
    return res.status(500).json({ error: '종목 비교 분석 중 오류가 발생했습니다.' });
  }
}
