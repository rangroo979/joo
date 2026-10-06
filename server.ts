import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import {
  getAllKoreanStocks,
  searchKoreanStocks,
  getStockByCode,
  formatKrxDateDisplay,
  findRecentBusinessDate,
  clearKrxCache,
  getKospiDaily,
  getKosdaqDaily,
} from './services/krxService.ts';

import {
  analyzeStock,
  askStockQuestion,
  analyzeMarketSummary,
  compareStocks,
} from './services/geminiService.ts';

import {
  DEMO_US_STOCKS,
  DEMO_MARKET_INDICES,
  DEMO_NEWS_ITEMS,
} from './src/data/demoData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // 1. Status & Diagnostics Endpoint
  app.get('/api/status', async (req: Request, res: Response) => {
    try {
      dotenv.config();
      const apiKey = process.env.KRX_API_KEY?.trim();
      const krxConfigured = Boolean(apiKey && apiKey.length > 0);
      const geminiKey = process.env.GEMINI_API_KEY?.trim();
      const geminiConnected = Boolean(geminiKey && geminiKey.length > 0);

      if (req.query.refresh === 'true') {
        clearKrxCache();
      }

      const recent = await findRecentBusinessDate();

      const { fetchKospiIndexData } = await import('./api/krx/index/kospi.ts');
      const { fetchKosdaqIndexData } = await import('./api/krx/index/kosdaq.ts');
      const [kospiIdx, kosdaqIdx] = await Promise.all([
        fetchKospiIndexData(recent.date),
        fetchKosdaqIndexData(recent.date),
      ]);

      const krxConnected = !recent.isDemo && (recent.kospiStocks.length > 0 || recent.kosdaqStocks.length > 0);
      const krxStockStatus = krxConnected ? '정상' : (krxConfigured ? '오류' : '미등록');
      const krxKospiIndexStatus = !kospiIdx.isDemo ? '정상' : (krxConfigured ? '오류' : '미등록');
      const krxKosdaqIndexStatus = !kosdaqIdx.isDemo ? '정상' : (krxConfigured ? '오류' : '미등록');
      const kospiStatus = recent.kospiStocks.length > 0 && !recent.isDemo ? '정상' : (krxConfigured ? '오류' : '미등록');
      const kosdaqStatus = recent.kosdaqStocks.length > 0 && !recent.isDemo ? '정상' : (krxConfigured ? '오류' : '미등록');

      res.json({
        krxConfigured,
        krxConnected,
        krxStockStatus,
        krxKospiIndexStatus,
        krxKosdaqIndexStatus,
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
      res.status(500).json({
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
  });

  // Force Refresh Cache Endpoint
  app.post('/api/krx/refresh', async (_req: Request, res: Response) => {
    try {
      dotenv.config();
      clearKrxCache();
      const recent = await findRecentBusinessDate();
      res.json({
        success: true,
        isDemo: recent.isDemo,
        latestBusinessDate: formatKrxDateDisplay(recent.date),
      });
    } catch (error) {
      res.status(500).json({ error: '캐시 갱신 중 오류가 발생했습니다.' });
    }
  });

  // 2. KRX Stocks API (KOSPI or integrated)
  app.get('/api/krx/stocks', async (req: Request, res: Response) => {
    try {
      const basDd = (req.query.basDd || req.query.date) as string | undefined;
      const forceRefresh = req.query.refresh === 'true';

      // If specific basDd requested (8 digits)
      if (basDd && basDd.trim().length === 8) {
        const cleanDate = basDd.trim();
        const kospiStocks = await getKospiDaily(cleanDate);
        if (kospiStocks && kospiStocks.length > 0) {
          return res.json({
            date: formatKrxDateDisplay(cleanDate),
            rawDate: cleanDate,
            market: 'KOSPI',
            isDemo: false,
            count: kospiStocks.length,
            stocks: kospiStocks,
          });
        }
      }

      // Default or fallback
      const data = await getAllKoreanStocks(basDd, forceRefresh);
      res.json({
        date: formatKrxDateDisplay(data.date),
        rawDate: data.date,
        market: 'KOSPI',
        isDemo: data.isDemo,
        count: data.totalCount,
        stocks: data.stocks,
      });
    } catch (error) {
      console.error('Error in /api/krx/stocks:', error);
      res.status(500).json({ error: '국내 주식 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' });
    }
  });

  // 2-1. KRX KOSDAQ API
  app.get('/api/krx/kosdaq', async (req: Request, res: Response) => {
    try {
      const basDd = (req.query.basDd || req.query.date) as string | undefined;

      if (basDd && basDd.trim().length === 8) {
        const cleanDate = basDd.trim();
        const kosdaqStocks = await getKosdaqDaily(cleanDate);
        if (kosdaqStocks && kosdaqStocks.length > 0) {
          return res.json({
            date: formatKrxDateDisplay(cleanDate),
            rawDate: cleanDate,
            market: 'KOSDAQ',
            isDemo: false,
            count: kosdaqStocks.length,
            stocks: kosdaqStocks,
          });
        }
      }

      const recent = await findRecentBusinessDate();
      res.json({
        date: formatKrxDateDisplay(recent.date),
        rawDate: recent.date,
        market: 'KOSDAQ',
        isDemo: recent.isDemo,
        count: recent.kosdaqStocks.length,
        stocks: recent.kosdaqStocks,
      });
    } catch (error) {
      console.error('Error in /api/krx/kosdaq:', error);
      res.status(500).json({ error: '코스닥 주식 데이터를 불러오지 못했습니다.' });
    }
  });

  // 3. Search Korean Stocks
  app.get('/api/krx/stocks/search', async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string) || '';
      const results = await searchKoreanStocks(q);
      res.json({
        count: results.length,
        stocks: results,
      });
    } catch (error) {
      console.error('Error in /api/krx/stocks/search:', error);
      res.status(500).json({ error: '종목 검색 중 오류가 발생했습니다.' });
    }
  });

  // 4. Single Stock Detail
  app.get('/api/krx/stocks/:code', async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      // First check KRX Korean stocks
      const stock = await getStockByCode(code);
      if (stock) {
        return res.json(stock);
      }

      // Check US demo stocks if matching code
      const usStock = DEMO_US_STOCKS.find((s) => s.code.toUpperCase() === code.toUpperCase());
      if (usStock) {
        return res.json(usStock);
      }

      res.status(404).json({ error: '해당 종목을 찾을 수 없습니다.' });
    } catch (error) {
      console.error('Error in /api/krx/stocks/:code:', error);
      res.status(500).json({ error: '종목 상세정보를 불러오지 못했습니다.' });
    }
  });

  // 4-1. KRX KOSPI Index API
  app.get('/api/krx/index/kospi', async (req: Request, res: Response) => {
    try {
      const basDd = (req.query.basDd || req.query.date) as string | undefined;
      const { fetchKospiIndexData } = await import('./api/krx/index/kospi.ts');
      const result = await fetchKospiIndexData(basDd);
      res.json(result.data);
    } catch (error) {
      console.error('Error in /api/krx/index/kospi:', error);
      res.json(DEMO_MARKET_INDICES.find((i) => i.code === 'KOSPI'));
    }
  });

  // 4-2. KRX KOSDAQ Index API
  app.get('/api/krx/index/kosdaq', async (req: Request, res: Response) => {
    try {
      const basDd = (req.query.basDd || req.query.date) as string | undefined;
      const { fetchKosdaqIndexData } = await import('./api/krx/index/kosdaq.ts');
      const result = await fetchKosdaqIndexData(basDd);
      res.json(result.data);
    } catch (error) {
      console.error('Error in /api/krx/index/kosdaq:', error);
      res.json(DEMO_MARKET_INDICES.find((i) => i.code === 'KOSDAQ'));
    }
  });

  // 5. Market Indices (Integrated KRX + US DEMO)
  app.get('/api/market/indices', async (req: Request, res: Response) => {
    try {
      const basDd = (req.query.basDd || req.query.date) as string | undefined;
      const { fetchKospiIndexData } = await import('./api/krx/index/kospi.ts');
      const { fetchKosdaqIndexData } = await import('./api/krx/index/kosdaq.ts');
      const [kospiRes, kosdaqRes] = await Promise.all([
        fetchKospiIndexData(basDd),
        fetchKosdaqIndexData(basDd),
      ]);
      const usIndices = DEMO_MARKET_INDICES.filter((i) => i.code === 'SP500' || i.code === 'NASDAQ');
      res.json([kospiRes.data, kosdaqRes.data, ...usIndices]);
    } catch (error) {
      res.json(DEMO_MARKET_INDICES);
    }
  });

  // 6. US Stocks (DEMO)
  app.get('/api/market/us-stocks', (_req: Request, res: Response) => {
    res.json(DEMO_US_STOCKS);
  });

  // 7. News Items (DEMO NEWS)
  app.get('/api/news', (_req: Request, res: Response) => {
    res.json(DEMO_NEWS_ITEMS);
  });

  // 8. Gemini AI Analysis for Stock
  app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
    try {
      const { stock } = req.body;
      if (!stock) {
        return res.status(400).json({ error: '종목 데이터가 제공되지 않았습니다.' });
      }
      const analysis = await analyzeStock(stock);
      res.json(analysis);
    } catch (error) {
      console.error('Error in /api/gemini/analyze:', error);
      res.status(500).json({ error: 'AI 분석 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    }
  });

  // 9. Gemini AI Ask Question
  app.post('/api/gemini/ask', async (req: Request, res: Response) => {
    try {
      const { stock, question } = req.body;
      if (!stock || !question) {
        return res.status(400).json({ error: '종목 데이터 또는 질문 내용이 누락되었습니다.' });
      }
      const answer = await askStockQuestion(stock, question);
      res.json({ answer });
    } catch (error) {
      console.error('Error in /api/gemini/ask:', error);
      res.status(500).json({ error: 'AI 응답 중 오류가 발생했습니다.' });
    }
  });

  // 10. Gemini Market Summary
  app.post('/api/gemini/market-analysis', async (req: Request, res: Response) => {
    try {
      const { indices } = req.body;
      const analysis = await analyzeMarketSummary(indices || DEMO_MARKET_INDICES);
      res.json(analysis);
    } catch (error) {
      console.error('Error in /api/gemini/market-analysis:', error);
      res.status(500).json({ error: '시장 분석 생성 중 오류가 발생했습니다.' });
    }
  });

  // 11. Gemini Compare Stocks
  app.post('/api/gemini/compare', async (req: Request, res: Response) => {
    try {
      const { stocks } = req.body;
      if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
        return res.status(400).json({ error: '비교할 종목 목록이 없습니다.' });
      }
      const result = await compareStocks(stocks);
      res.json(result);
    } catch (error) {
      console.error('Error in /api/gemini/compare:', error);
      res.status(500).json({ error: '종목 비교 분석 중 오류가 발생했습니다.' });
    }
  });

  // Mount Vite or Static Frontend
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
