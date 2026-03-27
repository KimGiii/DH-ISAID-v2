/**
 * @jest-environment node
 */
import {
  InvestmentProfileNotFoundError,
  ISAAccountNotFoundError,
  RebalancingService,
} from '@/services/isa/rebalancing-service';
import { InvestType } from '@prisma/client';
import {
  createMockEtfHolding,
  createMockEtfHoldingSnapshot,
  createMockGeneralHolding,
  createMockInvestmentProfile,
  createMockISAAccount,
  ERROR_MESSAGES,
  TEST_USER_ID,
} from '../helpers/rebalancing-helpers';

// Mock Prisma Client
const mockPrismaClient = {
  investmentProfile: {
    findUnique: jest.fn(),
  },
  iSAAccount: {
    findUnique: jest.fn(),
  },
} as any;

describe('RebalancingService', () => {
  let rebalancingService: RebalancingService;

  beforeEach(() => {
    jest.clearAllMocks();
    rebalancingService = new RebalancingService({
      prismaClient: mockPrismaClient,
    });
  });

  describe('getRebalancingRecommendation', () => {
    it('투자 성향 정보가 없으면 InvestmentProfileNotFoundError를 던진다', async () => {
      mockPrismaClient.investmentProfile.findUnique.mockResolvedValue(null);

      await expect(
        rebalancingService.getRebalancingRecommendation(TEST_USER_ID)
      ).rejects.toThrow(InvestmentProfileNotFoundError);
    });

    it('자산 데이터가 없을 때 0점을 반환한다', async () => {
      mockPrismaClient.investmentProfile.findUnique.mockResolvedValue(
        createMockInvestmentProfile(InvestType.MODERATE)
      );
      mockPrismaClient.iSAAccount.findUnique.mockResolvedValue(
        createMockISAAccount()
      );

      const result =
        await rebalancingService.getRebalancingRecommendation(TEST_USER_ID);

      expect(result.score).toBe(0);
      expect(result.currentPortfolio).toHaveLength(0);
    });

    it('Snapshot 데이터가 있으면 이를 우선적으로 사용한다', async () => {
      mockPrismaClient.investmentProfile.findUnique.mockResolvedValue(
        createMockInvestmentProfile(InvestType.MODERATE)
      );

      const isaAccount = createMockISAAccount();
      isaAccount.etfHoldings = [
        createMockEtfHolding(BigInt(1), 10, 10000, '국내', '국내 ETF', 11000),
      ];
      isaAccount.etfHoldingSnapshots = [
        createMockEtfHoldingSnapshot(BigInt(1), 150000, '국내', '국내 ETF'), // 스냅샷 평가액 15만원
      ];

      mockPrismaClient.iSAAccount.findUnique.mockResolvedValue(isaAccount);

      const result =
        await rebalancingService.getRebalancingRecommendation(TEST_USER_ID);

      const domesticStock = result.currentPortfolio.find(
        (p) => p.category === '국내 주식'
      );
      expect(domesticStock?.totalValue).toBe(150000);
    });

    it('Snapshot 데이터가 없으면 Fallback 로직(최근가 * 수량)을 사용한다', async () => {
      mockPrismaClient.investmentProfile.findUnique.mockResolvedValue(
        createMockInvestmentProfile(InvestType.MODERATE)
      );

      const isaAccount = createMockISAAccount();
      isaAccount.etfHoldings = [
        createMockEtfHolding(BigInt(1), 10, 10000, '국내', '국내 ETF', 12000), // 10개 * 1.2만원 = 12만원
      ];
      // Snapshot 없음

      mockPrismaClient.iSAAccount.findUnique.mockResolvedValue(isaAccount);

      const result =
        await rebalancingService.getRebalancingRecommendation(TEST_USER_ID);

      const domesticStock = result.currentPortfolio.find(
        (p) => p.category === '국내 주식'
      );
      expect(domesticStock?.totalValue).toBe(120000);
    });

    it('일치도 점수가 Rule-based 공식에 따라 정확히 계산된다', async () => {
      // 공식: 100 - (절대 편차의 합) / 2
      // MODERATE 권장: 국내 25, 해외 25, 채권 40, ELS 5, 펀드 5
      mockPrismaClient.investmentProfile.findUnique.mockResolvedValue(
        createMockInvestmentProfile(InvestType.MODERATE)
      );

      const isaAccount = createMockISAAccount();
      // 채권에 100% 몰빵한 경우: 편차 = |25-0| + |25-0| + |40-100| + |5-0| + |5-0| = 25+25+60+5+5 = 120
      // 점수 = 100 - 120/2 = 40점
      isaAccount.generalHoldings = [
        createMockGeneralHolding('BOND', 1000000, '채권'),
      ];

      mockPrismaClient.iSAAccount.findUnique.mockResolvedValue(isaAccount);

      const result =
        await rebalancingService.getRebalancingRecommendation(TEST_USER_ID);

      expect(result.score).toBe(40);
    });
  });
});
