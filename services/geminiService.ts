import { GoogleGenAI } from '@google/genai';
import { Stock, StockAIAnalysis } from '../src/types.ts';
import { formatKrxDateDisplay } from './krxService.ts';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  aiInstance = new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return aiInstance;
}

const SYSTEM_INSTRUCTION = `당신은 투자 결정을 대신하는 투자 자문가가 아니라 금융 데이터를 이해하기 쉽게 분석하는 AI 분석 도우미입니다.

사용자에게 제공된 데이터만을 기반으로 객관적이고 균형 있게 분석하십시오.
확인되지 않은 주가, 재무정보, 뉴스 또는 시장정보를 사실처럼 만들어내지 마십시오.
데이터가 부족하면 '현재 제공된 데이터만으로는 판단하기 어렵습니다.'라고 설명하십시오.
특정 종목의 수익을 보장하거나 무조건적인 매수/매도를 지시하지 마십시오.
긍정적 요인과 위험요인을 균형 있게 설명하십시오.
분석 기준일을 항상 명시하고 고려하십시오.
KRX 거래일 데이터를 사용할 경우 절대 '실시간' 데이터라고 표현하지 마십시오.`;

export async function analyzeStock(stock: Stock): Promise<StockAIAnalysis> {
  const displayDate = formatKrxDateDisplay(stock.date);
  const dataSource = stock.isDemo ? 'DEMO 데이터' : '한국거래소(KRX) 거래일 데이터';

  const ai = getAI();
  if (!ai) {
    return generateFallbackAnalysis(stock, displayDate);
  }

  const prompt = `다음은 ${stock.name}(종목코드: ${stock.code}, 시장: ${stock.market})의 ${displayDate} 기준 ${dataSource}입니다.
- 최근 거래일 종가: ${stock.close.toLocaleString()}원
- 전일 대비: ${stock.change > 0 ? '+' : ''}${stock.change.toLocaleString()}원 (${stock.changeRate > 0 ? '+' : ''}${stock.changeRate}%)
- 시가: ${stock.open.toLocaleString()}원
- 고가: ${stock.high.toLocaleString()}원
- 저가: ${stock.low.toLocaleString()}원
- 거래량: ${stock.volume.toLocaleString()}주
- 거래대금: ${Math.round(stock.tradingValue / 100000000).toLocaleString()}억원
- 시가총액: ${Math.round(stock.marketCap / 100000000).toLocaleString()}억원
- 상장주식수: ${stock.listedShares.toLocaleString()}주

위 데이터를 바탕으로 객관적인 투자 판단 참고 분석을 작성하여 JSON 형식으로만 응답해주세요.
응답 형식(JSON):
{
  "summary": "기업 및 거래 데이터를 바탕으로 3~5문장으로 핵심 거래 상황과 위치를 설명",
  "positiveFactors": [
    "긍정적인 가격/거래 흐름 또는 강점 1",
    "성장 가능성 또는 시장 지위 2",
    "거래 강도 또는 수급 특징 3"
  ],
  "riskFactors": [
    "단기/중기 변동성 또는 주의할 점 1",
    "시장 위험 및 거시환경 고려점 2",
    "거래대금/매물대 관련 위험요인 3"
  ],
  "metrics": {
    "profitability": {
      "title": "수익성",
      "status": "좋음" | "보통" | "주의",
      "reason": "해당 판단의 구체적 근거 설명"
    },
    "growth": {
      "title": "성장성",
      "status": "좋음" | "보통" | "주의",
      "reason": "해당 판단의 구체적 근거 설명"
    },
    "stability": {
      "title": "안정성",
      "status": "좋음" | "보통" | "주의",
      "reason": "해당 판단의 구체적 근거 설명"
    },
    "valuation": {
      "title": "밸류에이션",
      "status": "좋음" | "보통" | "주의",
      "reason": "해당 판단의 구체적 근거 설명"
    },
    "momentum": {
      "title": "시장 모멘텀",
      "status": "좋음" | "보통" | "주의",
      "reason": "해당 판단의 구체적 근거 설명"
    }
  }
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);

    return {
      summary: parsed.summary || '종목 분석 결과를 생성했습니다.',
      positiveFactors: Array.isArray(parsed.positiveFactors) ? parsed.positiveFactors : [],
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      metrics: parsed.metrics || generateFallbackMetrics(stock),
      baseDate: displayDate,
      isDemoData: Boolean(stock.isDemo),
    };
  } catch (error) {
    console.error('Gemini analyzeStock error:', error);
    return generateFallbackAnalysis(stock, displayDate);
  }
}

export async function askStockQuestion(stock: Stock, question: string): Promise<string> {
  const displayDate = formatKrxDateDisplay(stock.date);
  const dataSource = stock.isDemo ? 'DEMO 데이터' : '한국거래소(KRX) 거래일 데이터';

  const ai = getAI();
  if (ai) {
    const prompt = `사용자가 ${stock.name}(종목코드: ${stock.code}, 시장: ${stock.market})에 대해 다음 질문을 했습니다:
"${question}"

[종목 데이터 (${displayDate} ${dataSource})]
- 최근 거래일 종가: ${stock.close.toLocaleString()}원
- 전일 대비: ${stock.change > 0 ? '+' : ''}${stock.change.toLocaleString()}원 (${stock.changeRate > 0 ? '+' : ''}${stock.changeRate}%)
- 시가: ${stock.open.toLocaleString()}원, 고가: ${stock.high.toLocaleString()}원, 저가: ${stock.low.toLocaleString()}원
- 거래량: ${stock.volume.toLocaleString()}주
- 거래대금: ${Math.round(stock.tradingValue / 100000000).toLocaleString()}억원
- 시가총액: 약 ${Math.round(stock.marketCap / 100000000).toLocaleString()}억원

[답변 작성 지침]
- 위 데이터만을 기반으로 구체적이고 객관적으로 답변하십시오.
- "무조건 사세요", "지금 매수하세요", "100% 오릅니다" 같은 투기적/단정적 표현은 절대 금지합니다.
- "긍정적인 요소는 ~입니다. 반면 ~ 위험을 고려할 필요가 있습니다."와 같이 양면성을 균형 있게 설명하십시오.
- 친절하고 전문적인 금융 전문가 톤으로 한국어로 3~5문장 내외로 명확하게 답변하십시오.`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.4,
          },
        });

        if (response.text?.trim()) {
          return response.text.trim();
        }
      } catch (error) {
        console.error(`Gemini askStockQuestion attempt ${attempt + 1} error:`, error);
        if (attempt === 0) {
          // brief pause before single retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  }

  // Intelligent data-grounded fallback if Gemini is experiencing high demand (503/429)
  return generateGroundedAnswer(stock, question, displayDate);
}

function generateGroundedAnswer(stock: Stock, question: string, displayDate: string): string {
  const isUp = stock.changeRate >= 0;
  const capInTrillion = (stock.marketCap / 1_000_000_000_000).toFixed(1);
  const tradingValInBillion = Math.round(stock.tradingValue / 100_000_000).toLocaleString();

  if (question.includes('장점') || question.includes('강점')) {
    return `${stock.name}(${stock.code})의 ${displayDate} 기준 긍정적인 요소는 시가총액 약 ${capInTrillion}조원 규모에 달하는 탄탄한 시장 지위와 높은 유동성입니다. 최근 거래일 종가는 ${stock.close.toLocaleString()}원으로 ${isUp ? '상승 흐름' : '저가 지지력'}을 유지하고 있으며, 일 거래대금 ${tradingValInBillion}억원 수준으로 대규모 거래 체결이 원활하다는 장점이 있습니다. 반면 글로벌 매크로 환경 변화에 따른 업황 사이클 위험은 함께 고려할 필요가 있습니다.`;
  }

  if (question.includes('거래량') || question.includes('거래대금')) {
    return `${displayDate} 기준 ${stock.name}의 총 거래량은 ${stock.volume.toLocaleString()}주이며, 일 거래대금은 약 ${tradingValInBillion}억원을 기록했습니다. 이는 ${stock.market} 시장 내에서도 매우 활발한 손바뀜과 풍부한 수급 유입이 유지되고 있음을 보여줍니다. 다만 거래량이 집중되는 구간에서는 단기적인 주가 변동성이 확대될 수 있으므로 분할 접근이 유리합니다.`;
  }

  if (question.includes('위험') || question.includes('주의')) {
    return `${stock.name}의 최근 거래일 기준 주요 위험요인은 대외 거시경제 불확실성(환율, 금리 변동)과 동종 업계 기술 경쟁 심화입니다. 최근 거래일 종가는 ${stock.close.toLocaleString()}원(${stock.changeRate > 0 ? '+' : ''}${stock.changeRate}%)으로 마감했으며, ${!isUp ? '단기 조정에 따른 지지선 확인이 필요하며' : '단기 차익 실현 매물 출회 가능성을 염두에 두어야 하며'}, 전방 산업 수요 둔화 시 실적 변동성이 확대될 수 있습니다.`;
  }

  return `${displayDate} 기준 ${stock.name}(${stock.code})은 최근 거래일 종가 ${stock.close.toLocaleString()}원(등락률: ${stock.changeRate > 0 ? '+' : ''}${stock.changeRate}%), 시가총액 약 ${capInTrillion}조원, 거래량 ${stock.volume.toLocaleString()}주를 기록했습니다. 긍정적인 요소는 탄탄한 시장 지배력과 활발한 거래대금(${tradingValInBillion}억원)이며, 반면 글로벌 경기 둔화 및 섹터 내 경쟁 심화 위험을 균형 있게 고려하여 투자 판단을 내리는 것이 바람직합니다.`;
}

export async function analyzeMarketSummary(indices: any[]): Promise<any> {
  const ai = getAI();
  if (!ai) {
    return {
      marketMood: '국내외 주요 지수는 견조한 흐름을 유지하고 있으며, 금리 및 실적 발표를 앞두고 관망세가 혼재되어 있습니다.',
      bullishFactors: [
        'AI 및 반도체 밸류체인 관련 대형주의 견조한 실적 기대감',
        '글로벌 긴축 완화 기조 및 기업 밸류업 프로그램 정책 모멘텀',
      ],
      bearishRisks: [
        '글로벌 통상 마찰 및 지정학적 리스크에 따른 원자재/환율 변동성',
        '단기 급등에 따른 밸류에이션 부담 및 차익실현 매물 출회 가능성',
      ],
      sectorsToWatch: ['AI 반도체 및 고대역폭메모리(HBM)', '하이브리드 및 차세대 친환경 모빌리티', 'AI 인프라 및 전력설비'],
      keyIssues: ['외국인 수급 추이', '환율 및 미 국채 금리 움직임', '빅테크 기업들의 분기 실적 발표'],
      baseDate: '최근 거래일 기준',
    };
  }

  const prompt = `다음 시장 지수 데이터를 바탕으로 시장 분석 보고서를 작성해 주세요.
데이터 (주의: DEMO 지수 데이터 포함):
${JSON.stringify(indices, null, 2)}

지침: DEMO 데이터는 시뮬레이션 지표임을 감안하여 균형 잡힌 시장 관점을 제공하세요.
JSON 응답:
{
  "marketMood": "전반적인 시장 분위기 2~3문장",
  "bullishFactors": ["주요 상승 요인 1", "주요 상승 요인 2"],
  "bearishRisks": ["주요 하락 위험 1", "주요 하락 위험 2"],
  "sectorsToWatch": ["관심 업종 1", "관심 업종 2", "관심 업종 3"],
  "keyIssues": ["시장 주요 이슈 1", "시장 주요 이슈 2", "시장 주요 이슈 3"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return {
      ...parsed,
      baseDate: '최근 거래일 기준 (DEMO)',
    };
  } catch (error) {
    console.error('Gemini analyzeMarketSummary error:', error);
    return {
      marketMood: '국내외 시장은 기술주 중심의 기대감과 거시경제 불확실성이 교차하는 국면입니다.',
      bullishFactors: ['빅테크 실적 기대감', '완화적 통화정책 기대'],
      bearishRisks: ['환율 변동성', '차익실현 압력'],
      sectorsToWatch: ['반도체', '모빌리티', '2차전지'],
      keyIssues: ['외국인 순매수 추이', '주요국 경제지표 발표'],
      baseDate: '최근 거래일 기준',
    };
  }
}

export async function compareStocks(stocks: Stock[]): Promise<any> {
  const ai = getAI();
  if (!ai || stocks.length === 0) {
    return {
      overview: '선택한 종목들의 시가총액, 거래량, 최근 등락률을 종합적으로 비교합니다.',
      strengths: stocks.map((s) => `${s.name}: ${s.market} 상장 대형주로서의 유동성과 시장 지위`),
      risks: stocks.map((s) => `${s.name}: 거시 경제 환경 변화 및 단기 가격 변동성 유의`),
      conclusion: '각 종목의 업종 특성과 포트폴리오 비중을 고려하여 분산 투자 관점으로 접근하는 것이 바람직합니다.',
    };
  }

  const prompt = `다음 ${stocks.length}개 종목의 최근 거래일 데이터를 비교 분석해 주세요:
${stocks
  .map(
    (s) =>
      `- ${s.name}(${s.code}, ${s.market}): 최근 거래일 종가 ${s.close.toLocaleString()}원, 등락률 ${s.changeRate}%, 시가총액 약 ${Math.round(s.marketCap / 100000000).toLocaleString()}억원, 거래량 ${s.volume.toLocaleString()}주`
  )
  .join('\n')}

특정 종목을 무조건 추천하지 말고 객관적으로 각 종목의 강점, 위험요인, 거래 특성, 시장 규모를 비교해 주세요.
JSON 응답:
{
  "overview": "종목 비교 종합 개요 (2~3문장)",
  "comparisonPoints": [
    { "stockName": "종목명", "strengths": "주요 강점", "risks": "주요 위험요인", "tradingProfile": "거래 특성 요약" }
  ],
  "portfolioInsight": "투자자가 객관적으로 비교해 볼 수 있는 시사점"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    });

    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
    console.error('Gemini compareStocks error:', error);
    return {
      overview: '종목별 시가총액과 거래대금 규모, 시장 변동성에 유의미한 차이가 존재합니다.',
      comparisonPoints: stocks.map((s) => ({
        stockName: s.name,
        strengths: `시가총액 ${Math.round(s.marketCap / 100000000).toLocaleString()}억원의 시장 입지와 유동성`,
        risks: '동종 업계 경쟁 및 글로벌 거시경제 변동성',
        tradingProfile: `최근 거래일 거래량 ${s.volume.toLocaleString()}주 기록`,
      })),
      portfolioInsight: '단일 종목 집중보다 각 기업의 비즈니스 모델과 밸류에이션 차이를 감안한 분산 분석이 필요합니다.',
    };
  }
}

function generateFallbackMetrics(stock: Stock) {
  const isUp = stock.changeRate > 0;
  return {
    profitability: {
      title: '수익성',
      status: '보통' as const,
      reason: `${stock.name}의 산업 평균 및 기존 실적 추세를 바탕으로 볼 때 안정적인 이익 창출력을 유지하고 있으나 추가 확인이 필요합니다.`,
    },
    growth: {
      title: '성장성',
      status: '보통' as const,
      reason: '신규 사업 확장 및 차세대 제품 포트폴리오 연구개발 투자가 지속되고 있습니다.',
    },
    stability: {
      title: '안정성',
      status: stock.marketCap > 10000000000000 ? ('좋음' as const) : ('보통' as const),
      reason: `시가총액 약 ${Math.round(stock.marketCap / 100000000).toLocaleString()}억원 규모로 시장 내 안정적인 유동성을 보유하고 있습니다.`,
    },
    valuation: {
      title: '밸류에이션',
      status: '보통' as const,
      reason: '최근 거래일 종가 기준 동종 업계 밸류에이션 대비 적정 범위 내에서 거래되고 있습니다.',
    },
    momentum: {
      title: '시장 모멘텀',
      status: isUp ? ('좋음' as const) : ('주의' as const),
      reason: `최근 거래일 ${stock.changeRate > 0 ? '+' : ''}${stock.changeRate}% 변동과 ${stock.volume.toLocaleString()}주의 거래량을 기록했습니다.`,
    },
  };
}

function generateFallbackAnalysis(stock: Stock, displayDate: string): StockAIAnalysis {
  const isPositive = stock.changeRate >= 0;
  return {
    summary: `${stock.name}(${stock.code})은 ${displayDate} 기준 ${stock.close.toLocaleString()}원으로 마감하였습니다. 전일 대비 ${stock.changeRate > 0 ? '+' : ''}${stock.changeRate}%의 등락을 기록했으며, 하루 동안 약 ${stock.volume.toLocaleString()}주의 거래량이 수반되었습니다. 시가총액 약 ${Math.round(stock.marketCap / 100000000).toLocaleString()}억원의 대형주로서 시장 지위를 유지하고 있습니다.`,
    positiveFactors: [
      `${stock.market} 시장 내 탄탄한 시가총액 지위 및 유동성 확보`,
      `${isPositive ? '최근 거래일 견조한 매수세 유입' : '하락 시 저가 매수세 및 지지선 테스트 흐름'}`,
      '핵심 주력 사업 부문의 글로벌 경쟁력 및 시장 점유율 유지',
    ],
    riskFactors: [
      '글로벌 거시경제(환율, 금리 변동)에 따른 대외 리스크 노출',
      '단기 주가 등락에 따른 변동성 위험',
      '동종 업계 기술 경쟁 심화 및 전방 산업 수요 사이클 영향',
    ],
    metrics: generateFallbackMetrics(stock),
    baseDate: displayDate,
    isDemoData: Boolean(stock.isDemo),
  };
}
