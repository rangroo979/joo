import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import { askStockQuestion } from '../../services/geminiService.ts';

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
    const { stock, question } = body;
    if (!stock || !question) {
      return res.status(400).json({ error: '종목 데이터 또는 질문 내용이 누락되었습니다.' });
    }
    const answer = await askStockQuestion(stock, question);
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Error in /api/gemini/ask:', error);
    return res.status(500).json({ error: 'AI 응답 중 오류가 발생했습니다.' });
  }
}
