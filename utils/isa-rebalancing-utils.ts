import { InvestType } from '@prisma/client';

/**
 * 투자 성향별 권장 포트폴리오 템플릿
 */
export const RECOMMENDED_PORTFOLIOS: Record<
  InvestType,
  { category: string; percentage: number }[]
> = {
  [InvestType.CONSERVATIVE]: [
    { category: '국내 주식', percentage: 10 },
    { category: '해외 주식', percentage: 10 },
    { category: '채권', percentage: 60 },
    { category: 'ELS', percentage: 5 },
    { category: '펀드', percentage: 15 },
  ],
  [InvestType.MODERATE]: [
    { category: '국내 주식', percentage: 25 },
    { category: '해외 주식', percentage: 25 },
    { category: '채권', percentage: 40 },
    { category: 'ELS', percentage: 5 },
    { category: '펀드', percentage: 5 },
  ],
  [InvestType.NEUTRAL]: [
    { category: '국내 주식', percentage: 30 },
    { category: '해외 주식', percentage: 30 },
    { category: '채권', percentage: 30 },
    { category: 'ELS', percentage: 5 },
    { category: '펀드', percentage: 5 },
  ],
  [InvestType.ACTIVE]: [
    { category: '국내 주식', percentage: 35 },
    { category: '해외 주식', percentage: 35 },
    { category: '채권', percentage: 20 },
    { category: 'ELS', percentage: 5 },
    { category: '펀드', percentage: 5 },
  ],
  [InvestType.AGGRESSIVE]: [
    { category: '국내 주식', percentage: 40 },
    { category: '해외 주식', percentage: 40 },
    { category: '채권', percentage: 10 },
    { category: 'ELS', percentage: 5 },
    { category: '펀드', percentage: 5 },
  ],
};

/**
 * 자산 카테고리 매핑 로직
 */
export function mapAssetToCategory(
  assetType: string,
  marketType?: string | null
): string {
  if (assetType === 'BOND') return '채권';
  if (assetType === 'FUND') return '펀드';
  if (assetType === 'ELS') return 'ELS';

  if (assetType === 'ETF' || assetType === 'STOCK') {
    if (marketType === '해외') return '해외 주식';
    return '국내 주식'; // '국내' 또는 '국내&해외'는 국내 주식으로 간주
  }

  return '기타';
}

/**
 * 일치도 점수 산출 (Rule-based)
 * 공식: MAX(0, 100 - (절대 편차의 합) / 2)
 */
export function calculateAlignmentScore(
  userPortfolio: { category: string; percentage: number }[],
  recommendedPortfolio: { category: string; percentage: number }[]
): number {
  const userMap = new Map(userPortfolio.map((p) => [p.category, p.percentage]));
  let totalDeviation = 0;

  recommendedPortfolio.forEach((rec) => {
    const userPercentage = userMap.get(rec.category) || 0;
    totalDeviation += Math.abs(userPercentage - rec.percentage);
  });

  // 권장 포트폴리오에 없는 사용자의 자산군 편차도 합산
  userPortfolio.forEach((user) => {
    if (!recommendedPortfolio.find((rec) => rec.category === user.category)) {
      totalDeviation += user.percentage;
    }
  });

  return Math.max(0, Math.round(100 - totalDeviation / 2));
}

/**
 * 리밸런싱 의견 생성 규칙
 */
export function getRebalancingOpinion(
  category: string,
  userPercentage: number,
  recommendedPercentage: number,
  threshold: number = 5
): {
  opinion: '적정 비중' | '비중 확대 필요' | '비중 축소 필요';
  detail: string;
} {
  const diff = userPercentage - recommendedPercentage;

  if (diff > threshold) {
    return {
      opinion: '비중 축소 필요',
      detail: `${category} 비중이 권장 수준보다 ${diff.toFixed(1)}%p 높습니다. 일부 자산의 매도를 검토해보세요.`,
    };
  }

  if (diff < -threshold) {
    return {
      opinion: '비중 확대 필요',
      detail: `${category} 비중이 권장 수준보다 ${Math.abs(diff).toFixed(1)}%p 낮습니다. 해당 자산군에 대한 추가 매수를 고려해보세요.`,
    };
  }

  return {
    opinion: '적정 비중',
    detail: `${category} 비중이 권장 범위 내에 있습니다.`,
  };
}
