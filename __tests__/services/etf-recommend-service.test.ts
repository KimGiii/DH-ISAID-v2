/**
 * @jest-environment node
 */
import {
  EtfRecommendService,
  InvestmentProfileNotFoundError,
  NoEtfDataError,
  NoTradingDataError,
} from '@/services/etf/etf-recommend-service';
import { EtfTestService } from '@/services/etf/etf-test-service';
import * as EtfUtils from '@/utils/etf-recommend-utils';
import { InvestType } from '@prisma/client';
import {
  createAggressiveEtfData,
  createConservativeEtfData,
  createMockEtfData,
  createMockEtfList,
  createMockMetricsData,
  createMockProcessedEtfList,
  createMockWeightsData,
  ERROR_MESSAGES,
  TEST_USER_ID,
} from '../helpers/etf-recommend-helpers';

// Mock EtfTestService
const mockEtfTestService = {
  getUserInvestmentProfile: jest.fn(),
} as unknown as jest.Mocked<EtfTestService>;

// Mock Prisma Client
const mockPrismaClient = {
  etf: {
    findMany: jest.fn(),
  },
} as any;

describe('EtfRecommendService', () => {
  let etfRecommendService: EtfRecommendService;

  beforeEach(() => {
    jest.clearAllMocks();
    etfRecommendService = new EtfRecommendService({
      etfTestService: mockEtfTestService,
      prismaClient: mockPrismaClient,
    });
  });

  describe('getRecommendations', () => {
    it('정상적으로 ETF 추천을 반환한다', async () => {
      // Given
      const mockEtfs = [
        createMockEtfData({
          id: BigInt(1),
          issueCode: 'TEST001',
          issueName: '저위험 ETF',
          volatility: '0.03', // 4등급
          return1y: '0.06',
        }),
        createMockEtfData({
          id: BigInt(2),
          issueCode: 'TEST002',
          issueName: '중위험 ETF',
          volatility: '0.04', // 3등급
          return1y: '0.08',
        }),
      ];

      mockEtfTestService.getUserInvestmentProfile.mockResolvedValue({
        investType: InvestType.MODERATE,
        preferredCategories: [{ id: BigInt(1), fullPath: '주식/배당' }],
      });
      mockPrismaClient.etf.findMany.mockResolvedValue(mockEtfs);

      // When
      const result = await etfRecommendService.getRecommendations(
        TEST_USER_ID,
        2
      );

      // Then
      expect(result.recommendations).toHaveLength(2);
      expect(result.userProfile.investType).toBe(InvestType.MODERATE);
      expect(result.userProfile.preferredCategories).toContain('주식/배당');
      expect(mockEtfTestService.getUserInvestmentProfile).toHaveBeenCalledWith(
        TEST_USER_ID
      );
    });

    it('투자 성향이 없으면 InvestmentProfileNotFoundError를 던진다', async () => {
      // Given
      mockEtfTestService.getUserInvestmentProfile.mockResolvedValue({
        investType: null,
        preferredCategories: [],
      });

      // When & Then
      await expect(
        etfRecommendService.getRecommendations(TEST_USER_ID)
      ).rejects.toThrow(InvestmentProfileNotFoundError);
    });

    it('ETF 데이터가 없으면 NoEtfDataError를 던진다', async () => {
      // Given
      mockEtfTestService.getUserInvestmentProfile.mockResolvedValue({
        investType: InvestType.MODERATE,
        preferredCategories: [],
      });
      mockPrismaClient.etf.findMany.mockResolvedValue([]);

      // When & Then
      await expect(
        etfRecommendService.getRecommendations(TEST_USER_ID)
      ).rejects.toThrow(NoEtfDataError);
    });

    it('거래 데이터가 있는 ETF가 없으면 NoTradingDataError를 던진다', async () => {
      // Given
      const etfWithoutTradingData = createMockEtfData({ tradings: [] });
      mockEtfTestService.getUserInvestmentProfile.mockResolvedValue({
        investType: InvestType.MODERATE,
        preferredCategories: [],
      });
      mockPrismaClient.etf.findMany.mockResolvedValue([etfWithoutTradingData]);

      // When & Then
      await expect(
        etfRecommendService.getRecommendations(TEST_USER_ID)
      ).rejects.toThrow(NoTradingDataError);
    });
  });

  describe('processEtfData', () => {
    it('ETF 데이터를 올바르게 처리한다', () => {
      // Given
      const mockEtfs = createMockEtfList(2);

      // When
      const result = etfRecommendService.processEtfData(mockEtfs);

      // Then
      expect(result).toHaveLength(2);
      result.forEach((processedEtf, index) => {
        expect(processedEtf.id).toBe(BigInt(index + 1));
        expect(processedEtf.processedData.riskGrade).toBeDefined();
      });
    });
  });

  describe('calculateEtfScores', () => {
    it('ETF 점수를 올바르게 계산한다', () => {
      // Given
      const processedEtfs = createMockProcessedEtfList(3);
      const metrics = createMockMetricsData();
      const weights = createMockWeightsData();
      const allowedRiskGrades = [3, 4, 5];
      const investType = InvestType.MODERATE;
      const preferredCategories = ['주식/국내'];

      // When
      const result = etfRecommendService.calculateEtfScores(
        processedEtfs,
        metrics,
        weights,
        allowedRiskGrades,
        investType,
        preferredCategories
      );

      // Then
      expect(result).toHaveLength(3);
      result.forEach((etf) => {
        expect(etf.score).toBeGreaterThanOrEqual(0);
        expect(etf.metrics.sharpeRatio).toBeDefined();
        expect(etf.reasons).toBeInstanceOf(Array);
      });
    });
  });
});
