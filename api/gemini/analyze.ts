import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { analyzeStock } from '../../services/geminiService.ts';

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
    const stock = body.stock;
    if (!stock) {
      return res.status(400).json({ error: '종목 데이터가 제공되지 않았습니다.' });
    }
    const analysis = await analyzeStock(stock);
    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Error in /api/gemini/analyze:', error);
    return res.status(500).json({ error: 'AI 분석 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
}
