import { InvestType } from '@prisma/client';

/**
 * ETF 추천 알고리즘을 위한 지표 방향성 정의
 * HIGHER_IS_BETTER: 값이 높을수록 점수가 높음 (예: 수익률, 샤프비율)
 * LOWER_IS_BETTER: 값이 낮을수록 점수가 높음 (예: 수수료, 추적오차)
 */
export enum IndicatorDirection {
  HIGHER_IS_BETTER = 'HIGHER_IS_BETTER',
  LOWER_IS_BETTER = 'LOWER_IS_BETTER',
}

/**
 * 투자 성향 한글 명칭과 Enum 매핑
 */
export const RiskTypeMap: Record<string, InvestType> = {
  안정형: InvestType.CONSERVATIVE,
  안정추구형: InvestType.MODERATE,
  위험중립형: InvestType.NEUTRAL,
  적극투자형: InvestType.ACTIVE,
  공격투자형: InvestType.AGGRESSIVE,
};

/**
 * 지표별 정규화 함수
 * @param value 현재 값
 * @param min 전체 데이터의 최소값
 * @param max 전체 데이터의 최대값
 * @param direction 지표의 방향성
 */
export function normalizeIndicator(
  value: number,
  min: number,
  max: number,
  direction: IndicatorDirection = IndicatorDirection.HIGHER_IS_BETTER
): number {
  if (max === min) return 0.5;

  // 값의 범위를 [min, max]로 제한
  const clampedValue = Math.max(min, Math.min(max, value));
  const normalized = (clampedValue - min) / (max - min);

  return direction === IndicatorDirection.HIGHER_IS_BETTER
    ? normalized
    : 1 - normalized;
}

/**
 * 하나증권 위험등급 분류 (1~5단계)
 * 1: 초고위험, 2: 고위험, 3: 중위험, 4: 저위험, 5: 초저위험
 */
export function classifyRiskGrade(volatility: number): number {
  // 월간 변동성을 연간 변동성으로 변환 (보통 데이터가 월간일 경우)
  const annualVolatility = volatility * Math.sqrt(12);

  if (annualVolatility <= 0.05) return 5; // 초저위험 (5등급)
  if (annualVolatility <= 0.1) return 4; // 저위험 (4등급)
  if (annualVolatility <= 0.15) return 3; // 중위험 (3등급)
  if (annualVolatility <= 0.2) return 2; // 고위험 (2등급)
  return 1; // 초고위험 (1등급)
}

/**
 * 위험등급별 대표 연간 변동성 수치
 */
export function getRepresentativeVolatility(riskGrade: number): number {
  const representativeValues: Record<number, number> = {
    1: 0.3, // 초고위험
    2: 0.2, // 고위험
    3: 0.15, // 중위험
    4: 0.1, // 저위험
    5: 0.05, // 초저위험
  };
  return representativeValues[riskGrade] || 0.15;
}

/**
 * 샤프비율 계산 (위험 대비 수익성 지표)
 * (수익률 - 무위험수익률) / 변동성
 */
export function calculateSharpeRatio(
  return1y: number,
  riskGrade: number
): number {
  const riskFreeRate = 0.03; // 3% 무위험 수익률 (시장 평균 가정)
  const representativeVolatility = getRepresentativeVolatility(riskGrade);

  return (return1y - riskFreeRate) / representativeVolatility;
}

/**
 * 투자 성향별 지표 가중치 설정
 */
export interface WeightsData {
  sharpeRatio: number;
  totalFee: number;
  tradingVolume: number;
  netAssetValue: number;
  trackingError: number;
  divergenceRate: number;
  volatility: number;
}

export function getRiskBasedWeights(investType: InvestType): WeightsData {
  const weights: Record<InvestType, WeightsData> = {
    CONSERVATIVE: {
      sharpeRatio: 0.1,
      totalFee: 0.3,
      tradingVolume: 0.1,
      netAssetValue: 0.2,
      trackingError: 0.1,
      divergenceRate: 0.1,
      volatility: 0.1,
    },
    MODERATE: {
      sharpeRatio: 0.15,
      totalFee: 0.2,
      tradingVolume: 0.1,
      netAssetValue: 0.15,
      trackingError: 0.15,
      divergenceRate: 0.1,
      volatility: 0.15,
    },
    NEUTRAL: {
      sharpeRatio: 0.2,
      totalFee: 0.15,
      tradingVolume: 0.15,
      netAssetValue: 0.15,
      trackingError: 0.1,
      divergenceRate: 0.1,
      volatility: 0.15,
    },
    ACTIVE: {
      sharpeRatio: 0.25,
      totalFee: 0.1,
      tradingVolume: 0.2,
      netAssetValue: 0.1,
      trackingError: 0.1,
      divergenceRate: 0.1,
      volatility: 0.15,
    },
    AGGRESSIVE: {
      sharpeRatio: 0.3,
      totalFee: 0.05,
      tradingVolume: 0.25,
      netAssetValue: 0.05,
      trackingError: 0.1,
      divergenceRate: 0.1,
      volatility: 0.15,
    },
  };

  return weights[investType] || weights.NEUTRAL;
}

/**
 * 위험등급별 정규화된 점수 (안전할수록 높은 점수)
 * 5등급(초저위험) -> 1.0, 1등급(초고위험) -> 0.2
 */
export function normalizeVolatilityByRiskGrade(riskGrade: number): number {
  return Math.min(Math.max(riskGrade / 5, 0), 1);
}

/**
 * 투자 성향별 허용 위험등급
 */
export function getAllowedRiskGrades(investType: InvestType): number[] {
  const allowedGrades: Record<InvestType, number[]> = {
    CONSERVATIVE: [4, 5], // 저위험, 초저위험만
    MODERATE: [3, 4, 5], // 중위험 이상
    NEUTRAL: [2, 3, 4, 5], // 고위험 이상
    ACTIVE: [1, 2, 3, 4, 5], // 전체 허용
    AGGRESSIVE: [1, 2, 3, 4, 5], // 전체 허용
  };

  return allowedGrades[investType] || [3, 4, 5];
}

/**
 * 선호 카테고리 가중치 (선호 카테고리에 속할 경우 점수 보너스)
 */
export function calculateCategoryBonus(
  etfCategoryPath: string,
  preferredCategories: string[]
): number {
  if (!preferredCategories || preferredCategories.length === 0) return 0;

  // 전체 경로가 일치하거나 상위 경로가 일치할 경우 보너스
  const isPreferred = preferredCategories.some(
    (pref) =>
      etfCategoryPath.startsWith(pref) || pref.startsWith(etfCategoryPath)
  );

  return isPreferred ? 0.1 : 0; // 최대 점수(1.0)의 10% 보너스
}

/**
 * 추천 이유 생성 함수
 */
export function generateReasons(
  metrics: {
    sharpeRatio: number;
    totalFee: number;
    tradingVolume: number;
    netAssetValue: number;
    trackingError: number;
    divergenceRate: number;
  },
  investType: InvestType,
  riskGrade: number,
  isPreferredCategory: boolean
): { title: string; description: string }[] {
  const reasons: { title: string; description: string }[] = [];

  // 선호 카테고리
  if (isPreferredCategory) {
    reasons.push({
      title: '관심 분야 일치',
      description: '평소 고객님이 관심을 가지셨던 투자 분야의 상품입니다.',
    });
  }

  // 샤프비율 기반 이유
  if (metrics.sharpeRatio > 1.0) {
    reasons.push({
      title: '우수한 위험 대비 수익',
      description:
        '동일한 위험 수준에서 시장 평균보다 높은 수익을 기대할 수 있는 우수한 성과를 보이고 있습니다.',
    });
  }

  // 총보수 기반 이유
  if (metrics.totalFee < 0.2) {
    reasons.push({
      title: '매우 낮은 운용 비용',
      description:
        '운용 보수가 업계 최저 수준으로, 장기 투자 시 실질 수익률을 높이는 데 큰 도움이 됩니다.',
    });
  }

  // 거래대금 기반 이유
  if (metrics.tradingVolume > 1000000000) {
    reasons.push({
      title: '풍부한 유동성',
      description:
        '거래가 활발하여 원하는 시점에 언제든 합리적인 가격으로 매수와 매도가 가능합니다.',
    });
  }

  // 위험등급 기반 이유
  const riskGradeLabels: Record<number, string> = {
    1: '초고위험',
    2: '고위험',
    3: '중위험',
    4: '저위험',
    5: '초저위험',
  };

  if (riskGrade >= 4) {
    reasons.push({
      title: `${riskGradeLabels[riskGrade]} 등급의 안정성`,
      description:
        '변동성이 낮아 자산의 가치를 비교적 안정적으로 보존할 수 있는 상품입니다.',
    });
  }

  // 투자 성향별 맞춤 이유
  if (investType === InvestType.CONSERVATIVE && riskGrade >= 4) {
    reasons.push({
      title: '보수적 투자 최적화',
      description:
        '고객님의 신중한 투자 성향을 고려하여, 원금 보호 능력이 뛰어난 안정적인 상품을 추천드립니다.',
    });
  }

  if (investType === InvestType.AGGRESSIVE && metrics.sharpeRatio > 0.8) {
    reasons.push({
      title: '공격적 수익 추구',
      description:
        '적극적인 수익을 선호하시는 성향에 맞춰, 높은 효율로 자산 증대를 노릴 수 있는 전략적 상품입니다.',
    });
  }

  return reasons.slice(0, 3); // 최대 3개만 반환
}
