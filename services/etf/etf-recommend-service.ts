import * as EtfUtils from '@/utils/etf-recommend-utils';
import { IndicatorDirection } from '@/utils/etf-recommend-utils';
import { InvestType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { EtfTestService } from './etf-test-service';

// 타입 정의
export interface EtfData {
  id: bigint;
  issueCode: string;
  issueName: string;
  return1y: string;
  etfTotalFee: string;
  netAssetTotalAmount: string;
  traceErrRate: string;
  divergenceRate: string;
  volatility: string;
  category: {
    fullPath: string;
  };
  tradings: {
    accTotalValue: string;
    flucRate: string;
  }[];
}

export interface ProcessedEtfData {
  id: bigint;
  issueCode: string;
  issueName: string;
  category: {
    fullPath: string;
  };
  processedData: {
    return1y: number;
    etfTotalFee: number;
    netAssetTotalAmount: number;
    traceErrRate: number;
    divergenceRate: number;
    volatility: number;
    riskGrade: number;
    avgTradingVolume: number;
    flucRate: number;
  };
}

export interface MetricsData {
  return1y: { min: number; max: number };
  etfTotalFee: { min: number; max: number };
  netAssetTotalAmount: { min: number; max: number };
  traceErrRate: { min: number; max: number };
  divergenceRate: { min: number; max: number };
  volatility: { min: number; max: number };
  tradingVolume: { min: number; max: number };
}

export interface EtfRecommendationResponse {
  etfId: string;
  issueCode: string;
  issueName: string;
  category: string;
  score: number;
  riskGrade: number;
  flucRate: number;
  metrics: {
    sharpeRatio: number;
    totalFee: number;
    tradingVolume: number;
    netAssetValue: number;
    trackingError: number;
    divergenceRate: number;
    volatility: number;
    normalizedVolatility: number;
  };
  reasons: {
    title: string;
    description: string;
  }[];
}

// 의존성 주입 인터페이스
export interface EtfRecommendationDependencies {
  etfTestService?: EtfTestService;
  prismaClient?: typeof prisma;
}

// 커스텀 에러 클래스
export class InvestmentProfileNotFoundError extends Error {
  constructor() {
    super('투자 성향 테스트를 먼저 완료해주세요.');
    this.name = 'InvestmentProfileNotFoundError';
  }
}

export class NoEtfDataError extends Error {
  constructor() {
    super('추천할 수 있는 ETF가 없습니다.');
    this.name = 'NoEtfDataError';
  }
}

export class NoTradingDataError extends Error {
  constructor() {
    super('거래 데이터가 있는 ETF가 없습니다.');
    this.name = 'NoTradingDataError';
  }
}

export class EtfRecommendService {
  private etfTestService: EtfTestService;
  private prismaClient: typeof prisma;

  constructor(dependencies?: EtfRecommendationDependencies) {
    this.etfTestService = dependencies?.etfTestService || new EtfTestService();
    this.prismaClient = dependencies?.prismaClient || prisma;
  }

  async getRecommendations(
    userId: bigint,
    limit: number = 10
  ): Promise<{
    recommendations: EtfRecommendationResponse[];
    userProfile: {
      investType: InvestType;
      preferredCategories: string[];
    };
    weights: EtfUtils.WeightsData;
  }> {
    // 1. 사용자 프로필 조회 (투자 성향 + 선호 카테고리)
    const profile = await this.etfTestService.getUserInvestmentProfile(userId);

    if (!profile.investType) {
      throw new InvestmentProfileNotFoundError();
    }

    const { investType } = profile;
    const preferredCategories = profile.preferredCategories.map(
      (c) => c.fullPath
    );

    // 2. ETF 데이터 조회
    const etfs = await this.getEtfData();

    if (etfs.length === 0) {
      throw new NoEtfDataError();
    }

    // 3. 데이터 전처리 및 메트릭 계산
    const etfsWithTradingData = etfs.filter((etf) => etf.tradings.length > 0);
    if (etfsWithTradingData.length === 0) {
      throw new NoTradingDataError();
    }

    const processedEtfs = this.processEtfData(etfsWithTradingData);
    const metrics = this.calculateMetrics(processedEtfs);
    const weights = EtfUtils.getRiskBasedWeights(investType);
    const allowedRiskGrades = EtfUtils.getAllowedRiskGrades(investType);

    // 4. 점수 계산 및 필터링
    const scoredEtfs = this.calculateEtfScores(
      processedEtfs,
      metrics,
      weights,
      allowedRiskGrades,
      investType,
      preferredCategories
    );

    // 5. 정렬 및 결과 반환
    const recommendations = scoredEtfs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      recommendations,
      userProfile: {
        investType,
        preferredCategories,
      },
      weights,
    };
  }

  async getEtfData(): Promise<EtfData[]> {
    const rawEtfData = await this.prismaClient.etf.findMany({
      where: {
        AND: [
          { return1y: { not: null } },
          { etfTotalFee: { not: null } },
          { netAssetTotalAmount: { not: null } },
          { traceErrRate: { not: null } },
          { divergenceRate: { not: null } },
          { volatility: { not: null } },
          { volatility: { not: '' } },
        ],
      },
      include: {
        category: {
          select: { fullPath: true },
        },
        tradings: {
          where: {
            baseDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
            accTotalValue: { gt: 0 },
          },
          select: {
            accTotalValue: true,
            flucRate: true,
          },
          orderBy: {
            baseDate: 'desc',
          },
          take: 30,
        },
      },
      orderBy: {
        netAssetTotalAmount: 'desc',
      },
      take: 400,
    });

    return rawEtfData.map((etf) => ({
      id: etf.id,
      issueCode: etf.issueCode ?? '',
      issueName: etf.issueName ?? 'N/A',
      return1y: etf.return1y?.toString() || '0.00',
      etfTotalFee: etf.etfTotalFee?.toString() || '0.00',
      netAssetTotalAmount: etf.netAssetTotalAmount?.toString() || '0',
      traceErrRate: etf.traceErrRate?.toString() || '0.00',
      divergenceRate: etf.divergenceRate?.toString() || '0.00',
      volatility: etf.volatility?.toString() || '0.00',
      category: {
        fullPath: etf.category.fullPath,
      },
      tradings: etf.tradings.map((trading) => ({
        accTotalValue: trading.accTotalValue?.toString() || '0',
        flucRate: trading.flucRate?.toString() || '0.00',
      })),
    }));
  }

  processEtfData(etfs: EtfData[]): ProcessedEtfData[] {
    return etfs.map((etf) => {
      const return1y = Number(etf.return1y) || 0;
      const etfTotalFee = Number(etf.etfTotalFee) || 0;
      const netAssetTotalAmount = Number(etf.netAssetTotalAmount) || 0;
      const traceErrRate = Number(etf.traceErrRate) || 0;
      const divergenceRate = Number(etf.divergenceRate) || 0;
      const volatility = Number(etf.volatility) || 0;

      const avgTradingVolume =
        etf.tradings?.length > 0
          ? etf.tradings.reduce(
              (sum: number, t) => sum + (Number(t.accTotalValue) || 0),
              0
            ) / etf.tradings.length
          : 0;

      const latestFlucRate =
        etf.tradings && etf.tradings.length > 0
          ? Number(etf.tradings[0].flucRate) || 0
          : 0;

      return {
        id: etf.id,
        issueCode: etf.issueCode,
        issueName: etf.issueName,
        category: etf.category,
        processedData: {
          return1y,
          etfTotalFee,
          netAssetTotalAmount,
          traceErrRate,
          divergenceRate,
          volatility,
          riskGrade: EtfUtils.classifyRiskGrade(volatility),
          avgTradingVolume,
          flucRate: latestFlucRate,
        },
      };
    });
  }

  calculateMetrics(processedEtfs: ProcessedEtfData[]): MetricsData {
    const metrics = {
      return1y: {
        min: Math.min(...processedEtfs.map((e) => e.processedData.return1y)),
        max: Math.max(...processedEtfs.map((e) => e.processedData.return1y)),
      },
      etfTotalFee: {
        min: Math.min(...processedEtfs.map((e) => e.processedData.etfTotalFee)),
        max: Math.max(...processedEtfs.map((e) => e.processedData.etfTotalFee)),
      },
      netAssetTotalAmount: {
        min: Math.min(
          ...processedEtfs.map((e) => e.processedData.netAssetTotalAmount)
        ),
        max: Math.max(
          ...processedEtfs.map((e) => e.processedData.netAssetTotalAmount)
        ),
      },
      traceErrRate: {
        min: Math.min(
          ...processedEtfs.map((e) => e.processedData.traceErrRate)
        ),
        max: Math.max(
          ...processedEtfs.map((e) => e.processedData.traceErrRate)
        ),
      },
      divergenceRate: {
        min: Math.min(
          ...processedEtfs.map((e) => Math.abs(e.processedData.divergenceRate))
        ),
        max: Math.max(
          ...processedEtfs.map((e) => Math.abs(e.processedData.divergenceRate))
        ),
      },
      volatility: {
        min: Math.min(...processedEtfs.map((e) => e.processedData.volatility)),
        max: Math.max(...processedEtfs.map((e) => e.processedData.volatility)),
      },
    };

    const allTradingValues = processedEtfs
      .map((etf) => etf.processedData.avgTradingVolume)
      .filter((v) => v > 0);

    const tradingVolume = {
      min: allTradingValues.length > 0 ? Math.min(...allTradingValues) : 0,
      max: allTradingValues.length > 0 ? Math.max(...allTradingValues) : 0,
    };

    return { ...metrics, tradingVolume };
  }

  calculateEtfScores(
    processedEtfs: ProcessedEtfData[],
    metrics: MetricsData,
    weights: EtfUtils.WeightsData,
    allowedRiskGrades: number[],
    investType: InvestType,
    preferredCategories: string[]
  ): EtfRecommendationResponse[] {
    return processedEtfs
      .map((etf) => {
        const { processedData } = etf;
        const {
          return1y,
          etfTotalFee,
          netAssetTotalAmount,
          traceErrRate,
          divergenceRate,
          volatility,
          riskGrade,
          avgTradingVolume,
          flucRate,
        } = processedData;

        // 1. 위험등급 필터링
        if (!allowedRiskGrades.includes(riskGrade)) {
          return null;
        }

        // 2. 지표 계산 및 정규화 (방향성 고려)
        const sharpeRatio = EtfUtils.calculateSharpeRatio(return1y, riskGrade);
        const normalizedVolatility =
          EtfUtils.normalizeVolatilityByRiskGrade(riskGrade);

        const normalizedMetrics = {
          sharpeRatio: EtfUtils.normalizeIndicator(
            sharpeRatio,
            -1,
            3,
            IndicatorDirection.HIGHER_IS_BETTER
          ),
          totalFee: EtfUtils.normalizeIndicator(
            etfTotalFee,
            metrics.etfTotalFee.min,
            metrics.etfTotalFee.max,
            IndicatorDirection.LOWER_IS_BETTER
          ),
          tradingVolume: EtfUtils.normalizeIndicator(
            avgTradingVolume,
            metrics.tradingVolume.min,
            metrics.tradingVolume.max,
            IndicatorDirection.HIGHER_IS_BETTER
          ),
          netAssetValue: EtfUtils.normalizeIndicator(
            netAssetTotalAmount,
            metrics.netAssetTotalAmount.min,
            metrics.netAssetTotalAmount.max,
            IndicatorDirection.HIGHER_IS_BETTER
          ),
          trackingError: EtfUtils.normalizeIndicator(
            traceErrRate,
            metrics.traceErrRate.min,
            metrics.traceErrRate.max,
            IndicatorDirection.LOWER_IS_BETTER
          ),
          divergenceRate: EtfUtils.normalizeIndicator(
            Math.abs(divergenceRate),
            metrics.divergenceRate.min,
            metrics.divergenceRate.max,
            IndicatorDirection.LOWER_IS_BETTER
          ),
          volatility: normalizedVolatility,
        };

        // 3. 가중 평균 점수 계산
        let score =
          normalizedMetrics.sharpeRatio * weights.sharpeRatio +
          normalizedMetrics.totalFee * weights.totalFee +
          normalizedMetrics.tradingVolume * weights.tradingVolume +
          normalizedMetrics.netAssetValue * weights.netAssetValue +
          normalizedMetrics.trackingError * weights.trackingError +
          normalizedMetrics.divergenceRate * weights.divergenceRate +
          normalizedMetrics.volatility * weights.volatility;

        // 4. 선호 카테고리 보너스 적용
        const categoryBonus = EtfUtils.calculateCategoryBonus(
          etf.category.fullPath,
          preferredCategories
        );
        score += categoryBonus;

        const isPreferredCategory = categoryBonus > 0;

        return {
          etfId: etf.id.toString(),
          issueCode: etf.issueCode,
          issueName: etf.issueName,
          category: etf.category.fullPath,
          score: Math.round(score * 100) / 100,
          riskGrade,
          flucRate,
          metrics: {
            sharpeRatio: Math.round(sharpeRatio * 100) / 100,
            totalFee: etfTotalFee,
            tradingVolume: avgTradingVolume,
            netAssetValue: netAssetTotalAmount,
            trackingError: traceErrRate,
            divergenceRate: divergenceRate,
            volatility: volatility,
            normalizedVolatility,
          },
          reasons: EtfUtils.generateReasons(
            {
              sharpeRatio,
              totalFee: etfTotalFee,
              tradingVolume: avgTradingVolume,
              netAssetValue: netAssetTotalAmount,
              trackingError: traceErrRate,
              divergenceRate: divergenceRate,
            },
            investType,
            riskGrade,
            isPreferredCategory
          ),
        };
      })
      .filter((etf): etf is EtfRecommendationResponse => etf !== null);
  }
}
