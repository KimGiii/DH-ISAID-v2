import * as RebalancingUtils from '@/utils/isa-rebalancing-utils';
import { InvestType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * 사용자 보유 자산 세부 정보
 */
export interface UserHoldingDetails {
  id: bigint;
  name: string;
  totalCost: number;
  currentValue: number;
  profitOrLoss: number;
  returnRate: number;
  category: string;
  assetType: 'ETF' | 'BOND' | 'FUND' | 'ELS' | 'CASH';
}

/**
 * 리밸런싱 응답 인터페이스
 */
export interface RebalancingResponse {
  recommendedPortfolio: { category: string; percentage: number }[];
  currentPortfolio: {
    category: string;
    percentage: number;
    totalValue: number;
  }[];
  score: number;
  rebalancingOpinions: {
    category: string;
    userPercentage: number;
    recommendedPercentage: number;
    opinion: '적정 비중' | '비중 확대 필요' | '비중 축소 필요';
    detail: string;
  }[];
}

// 커스텀 에러 정의
export class InvestmentProfileNotFoundError extends Error {
  constructor() {
    super('투자 성향 정보를 찾을 수 없습니다.');
    this.name = 'InvestmentProfileNotFoundError';
  }
}

export class ISAAccountNotFoundError extends Error {
  constructor() {
    super('ISA 계좌 정보를 찾을 수 없습니다.');
    this.name = 'ISAAccountNotFoundError';
  }
}

/**
 * ISA 리밸런싱 서비스
 * End-to-End 단일 파이프라인 아키텍처 구현
 */
export class RebalancingService {
  private prismaClient: typeof prisma;

  constructor(dependencies?: { prismaClient: typeof prisma }) {
    this.prismaClient = dependencies?.prismaClient || prisma;
  }

  /**
   * 단일 파이프라인: 투자 성향 조회 -> 자산 평가 -> 비중 분석 -> 리밸런싱 의견 생성
   */
  async getRebalancingRecommendation(
    userId: bigint
  ): Promise<RebalancingResponse> {
    // 1. 투자 성향 조회
    const investType = await this.getInvestType(userId);
    const recommendedPortfolio =
      RebalancingUtils.RECOMMENDED_PORTFOLIOS[investType];

    // 2. 자산 데이터 조회 및 평가 (Snapshot + Fallback 로직 적용)
    const userHoldings = await this.evaluateUserAssets(userId);

    // 3. 카테고리별 비중 집계
    const currentPortfolio = this.aggregatePortfolioByCategory(userHoldings);

    if (currentPortfolio.length === 0) {
      return {
        recommendedPortfolio,
        currentPortfolio,
        score: 0,
        rebalancingOpinions: [],
      };
    }

    // 4. 일치도 점수 산출 및 리밸런싱 의견 생성
    const score = RebalancingUtils.calculateAlignmentScore(
      currentPortfolio,
      recommendedPortfolio
    );
    const rebalancingOpinions = this.generateOpinions(
      currentPortfolio,
      recommendedPortfolio
    );

    return {
      recommendedPortfolio,
      currentPortfolio,
      score,
      rebalancingOpinions,
    };
  }

  /**
   * 투자 성향 조회 (Prisma InvestType 사용)
   */
  private async getInvestType(userId: bigint): Promise<InvestType> {
    const profile = await this.prismaClient.investmentProfile.findUnique({
      where: { userId },
      select: { investType: true },
    });

    if (!profile || !profile.investType) {
      throw new InvestmentProfileNotFoundError();
    }

    return profile.investType;
  }

  /**
   * 자산 평가 로직 (Snapshot & Fallback 기반)
   */
  private async evaluateUserAssets(
    userId: bigint
  ): Promise<UserHoldingDetails[]> {
    const now = new Date();
    const [year, month] = [now.getFullYear(), now.getMonth() + 1];
    const snapshotDate = new Date(Date.UTC(year, month, 0)); // 이번 달 마지막 날

    const isaAccount = await this.prismaClient.iSAAccount.findUnique({
      where: { userId },
      include: {
        generalHoldings: { include: { product: true } },
        etfHoldings: {
          include: {
            etf: {
              include: {
                tradings: { orderBy: { baseDate: 'desc' }, take: 1 },
              },
            },
          },
        },
        generalHoldingSnapshots: {
          where: {
            snapshotDate: {
              gte: snapshotDate,
              lt: new Date(snapshotDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { snapshotDate: 'desc' },
        },
        etfHoldingSnapshots: {
          where: {
            snapshotDate: {
              gte: snapshotDate,
              lt: new Date(snapshotDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { snapshotDate: 'desc' },
        },
      },
    });

    if (!isaAccount) throw new ISAAccountNotFoundError();

    const results: UserHoldingDetails[] = [];

    // --- 1. 일반 자산 (BOND, FUND, ELS) 평가: 원금 기준 통합 관리 ---
    for (const holding of isaAccount.generalHoldings) {
      // 일반 자산은 개별 상품별 스냅샷 없이 통합 관리되므로,
      // 개별 자산의 평가액은 투자 원금(totalCost)을 그대로 사용합니다.
      const totalCost = Number(holding.totalCost || 0);
      const currentValue = totalCost;
      const profitOrLoss = 0;

      results.push({
        id: holding.id,
        name: holding.product.productName || '일반 자산',
        totalCost,
        currentValue,
        profitOrLoss,
        returnRate: 0,
        category: RebalancingUtils.mapAssetToCategory(
          holding.product.instrumentType
        ),
        assetType: holding.product.instrumentType as any,
      });
    }

    // --- 2. ETF 자산 평가: 기존의 스냅샷/거래가 혼합 방식 ---
    for (const holding of isaAccount.etfHoldings) {
      const snapshot = isaAccount.etfHoldingSnapshots.find(
        (s) => s.etfId === holding.etfId
      );

      let currentValue: number;
      if (snapshot) {
        // Snapshot 우선
        currentValue = Number(snapshot.evaluatedAmount);
      } else {
        // Fallback: 최근 거래가 * 보유 수량
        const latestPrice = Number(
          holding.etf.tradings?.[0]?.tddClosePrice || 0
        );
        currentValue = Number(holding.quantity) * latestPrice;
      }

      const totalCost = Number(holding.avgCost) * Number(holding.quantity);
      const profitOrLoss = currentValue - totalCost;

      results.push({
        id: holding.id,
        name: holding.etf.issueNameKo || 'ETF 상품',
        totalCost,
        currentValue,
        profitOrLoss,
        returnRate: totalCost > 0 ? (profitOrLoss / totalCost) * 100 : 0,
        category: RebalancingUtils.mapAssetToCategory(
          'ETF',
          holding.etf.idxMarketType
        ),
        assetType: 'ETF',
      });
    }

    return results;
  }

  /**
   * 카테고리별 비중 집계
   */
  private aggregatePortfolioByCategory(holdings: UserHoldingDetails[]) {
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const categoryMap: Record<string, number> = {};

    holdings.forEach((h) => {
      categoryMap[h.category] = (categoryMap[h.category] || 0) + h.currentValue;
    });

    if (totalValue === 0) return [];

    return Object.entries(categoryMap).map(([category, value]) => ({
      category,
      totalValue: value,
      percentage: Number(((value / totalValue) * 100).toFixed(1)),
    }));
  }

  /**
   * 리밸런싱 의견 생성
   */
  private generateOpinions(
    currentPortfolio: { category: string; percentage: number }[],
    recommendedPortfolio: { category: string; percentage: number }[]
  ) {
    const userMap = new Map(
      currentPortfolio.map((p) => [p.category, p.percentage])
    );

    return recommendedPortfolio.map((rec) => {
      const userPercentage = userMap.get(rec.category) || 0;
      const opinionData = RebalancingUtils.getRebalancingOpinion(
        rec.category,
        userPercentage,
        rec.percentage
      );

      return {
        category: rec.category,
        userPercentage,
        recommendedPercentage: rec.percentage,
        ...opinionData,
      };
    });
  }
}
