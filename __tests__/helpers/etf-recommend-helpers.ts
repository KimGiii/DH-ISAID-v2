import {
  EtfData,
  EtfRecommendationResponse,
  MetricsData,
  ProcessedEtfData,
} from '@/services/etf/etf-recommend-service';
import { WeightsData } from '@/utils/etf-recommend-utils';
import { InvestType } from '@prisma/client';

// Mock ETF 데이터 생성
export const createMockEtfData = (
  overrides: Partial<EtfData> = {}
): EtfData => ({
  id: BigInt(1),
  issueCode: 'TEST001',
  issueName: '테스트 ETF',
  return1y: '0.08',
  etfTotalFee: '0.25',
  netAssetTotalAmount: '2000000000',
  traceErrRate: '0.08',
  divergenceRate: '0.03',
  volatility: '0.12',
  category: {
    fullPath: '주식/국내',
  },
  tradings: [
    {
      accTotalValue: '1000000000',
      flucRate: '0.02',
    },
    {
      accTotalValue: '1200000000',
      flucRate: '0.01',
    },
  ],
  ...overrides,
});

// Mock Processed ETF 데이터 생성
export const createMockProcessedEtfData = (
  overrides: Partial<ProcessedEtfData> = {}
): ProcessedEtfData => ({
  id: BigInt(1),
  issueCode: 'TEST001',
  issueName: '테스트 ETF',
  category: {
    fullPath: '주식/국내',
  },
  processedData: {
    return1y: 0.08,
    etfTotalFee: 0.25,
    netAssetTotalAmount: 2000000000,
    traceErrRate: 0.08,
    divergenceRate: 0.03,
    volatility: 0.12,
    riskGrade: 3,
    avgTradingVolume: 1100000000,
    flucRate: 0.02,
  },
  ...overrides,
});

// Mock Metrics 데이터 생성
export const createMockMetricsData = (
  overrides: Partial<MetricsData> = {}
): MetricsData => ({
  return1y: { min: 0.05, max: 0.15 },
  etfTotalFee: { min: 0.2, max: 0.5 },
  netAssetTotalAmount: { min: 1000000000, max: 5000000000 },
  traceErrRate: { min: 0.05, max: 0.15 },
  divergenceRate: { min: 0.01, max: 0.1 },
  volatility: { min: 0.1, max: 0.2 },
  tradingVolume: { min: 500000000, max: 2000000000 },
  ...overrides,
});

// Mock Weights 데이터 생성
export const createMockWeightsData = (
  overrides: Partial<WeightsData> = {}
): WeightsData => ({
  sharpeRatio: 0.15,
  totalFee: 0.2,
  tradingVolume: 0.15,
  netAssetValue: 0.15,
  trackingError: 0.1,
  divergenceRate: 0.1,
  volatility: 0.15,
  ...overrides,
});

// Mock ETF 추천 응답 생성
export const createMockEtfRecommendationResponse = (
  overrides: Partial<EtfRecommendationResponse> = {}
): EtfRecommendationResponse => ({
  etfId: '1',
  issueCode: 'TEST001',
  issueName: '테스트 ETF',
  category: '주식/국내',
  score: 0.75,
  riskGrade: 3,
  flucRate: 0.02,
  metrics: {
    sharpeRatio: 0.8,
    totalFee: 0.25,
    tradingVolume: 1100000000,
    netAssetValue: 2000000000,
    trackingError: 0.08,
    divergenceRate: 0.03,
    volatility: 0.12,
    normalizedVolatility: 0.6,
  },
  reasons: [
    {
      title: '중위험 등급',
      description:
        '중위험 등급(리스크 등급 3)으로, 가격 변동성이 낮고 안정적인 운용이 기대됩니다.',
    },
  ],
  ...overrides,
});

// 다양한 투자 성향별 테스트 데이터
export const createConservativeEtfData = (): EtfData =>
  createMockEtfData({
    issueCode: 'CONS001',
    issueName: '보수형 ETF',
    volatility: '0.08', // 저위험
    etfTotalFee: '0.15', // 낮은 수수료
  });

export const createAggressiveEtfData = (): EtfData =>
  createMockEtfData({
    issueCode: 'AGGR001',
    issueName: '공격형 ETF',
    volatility: '0.25', // 고위험
    return1y: '0.15', // 높은 수익률
  });

// 테스트용 ETF 목록 생성
export const createMockEtfList = (count: number = 5): EtfData[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockEtfData({
      id: BigInt(index + 1),
      issueCode: `TEST${String(index + 1).padStart(3, '0')}`,
      issueName: `테스트 ETF ${index + 1}`,
      return1y: String(0.05 + index * 0.02),
      volatility: String(0.1 + index * 0.02),
    })
  );
};

// 테스트용 Processed ETF 목록 생성
export const createMockProcessedEtfList = (
  count: number = 5
): ProcessedEtfData[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockProcessedEtfData({
      id: BigInt(index + 1),
      issueCode: `TEST${String(index + 1).padStart(3, '0')}`,
      issueName: `테스트 ETF ${index + 1}`,
      processedData: {
        return1y: 0.05 + index * 0.02,
        etfTotalFee: 0.2 + index * 0.05,
        netAssetTotalAmount: 1000000000 + index * 500000000,
        traceErrRate: 0.05 + index * 0.01,
        divergenceRate: 0.01 + index * 0.01,
        volatility: 0.1 + index * 0.02,
        riskGrade: Math.max(1, 5 - index), // 위험등급 다양화
        avgTradingVolume: 500000000 + index * 200000000,
        flucRate: 0.01 + index * 0.005,
      },
    })
  );
};

// 투자 성향별 허용 위험등급 테스트 데이터
export const getTestRiskGradesByInvestType = (
  investType: InvestType
): number[] => {
  const riskGradeMap = {
    CONSERVATIVE: [4, 5],
    MODERATE: [3, 4, 5],
    NEUTRAL: [2, 3, 4, 5],
    ACTIVE: [1, 2, 3, 4, 5],
    AGGRESSIVE: [1, 2, 3, 4, 5],
  };
  return riskGradeMap[investType] || [3, 4, 5];
};

// 테스트용 사용자 ID
export const TEST_USER_ID = BigInt(61);

// 테스트용 에러 메시지
export const ERROR_MESSAGES = {
  INVESTMENT_PROFILE_NOT_FOUND: '투자 성향 테스트를 먼저 완료해주세요.',
  NO_ETF_DATA: '추천할 수 있는 ETF가 없습니다.',
  NO_TRADING_DATA: '거래 데이터가 있는 ETF가 없습니다.',
};
