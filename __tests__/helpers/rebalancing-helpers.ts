import { UserHoldingDetails } from '@/services/isa/rebalancing-service';
import { InvestType } from '@prisma/client';

export const TEST_USER_ID = BigInt('123');

export const ERROR_MESSAGES = {
  INVESTMENT_PROFILE_NOT_FOUND: '투자 성향 정보를 찾을 수 없습니다.',
  ISA_ACCOUNT_NOT_FOUND: 'ISA 계좌 정보를 찾을 수 없습니다.',
};

export function createMockInvestmentProfile(
  investType: InvestType = InvestType.MODERATE
) {
  return {
    userId: TEST_USER_ID,
    investType,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockISAAccount() {
  return {
    id: BigInt(1),
    userId: TEST_USER_ID,
    accountNumber: '1234567890',
    generalHoldingSnapshots: [],
    generalHoldings: [],
    etfHoldingSnapshots: [],
    etfHoldings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createMockGeneralHolding(
  instrumentType: 'BOND' | 'FUND' | 'ELS',
  totalCost: number,
  productName?: string
) {
  return {
    id: BigInt(Math.floor(Math.random() * 1000)),
    totalCost,
    product: {
      instrumentType,
      productName: productName || `${instrumentType} 상품`,
    },
  };
}

export function createMockEtfHoldingSnapshot(
  etfId: bigint,
  evaluatedAmount: number,
  idxMarketType: '국내' | '해외' | '국내&해외',
  issueNameKo?: string
) {
  return {
    etfId,
    evaluatedAmount,
    snapshotDate: new Date(),
    etf: {
      id: etfId,
      issueNameKo: issueNameKo || `${idxMarketType} ETF`,
      idxMarketType,
    },
  };
}

export function createMockEtfHolding(
  etfId: bigint,
  quantity: number,
  avgCost: number,
  idxMarketType: '국내' | '해외' | '국내&해외',
  issueNameKo?: string,
  currentPrice?: number
) {
  return {
    id: BigInt(Math.floor(Math.random() * 1000)),
    etfId,
    quantity,
    avgCost,
    etf: {
      id: etfId,
      issueNameKo: issueNameKo || `${idxMarketType} ETF`,
      idxMarketType,
      tradings: currentPrice
        ? [
            {
              tddClosePrice: currentPrice,
              baseDate: new Date(),
            },
          ]
        : [],
    },
  };
}

export function createMockUserHolding(
  id: bigint = BigInt(1),
  name = '테스트 자산',
  totalCost = 1000000,
  currentValue = 1100000,
  category = '국내 주식',
  assetType: 'ETF' | 'BOND' | 'FUND' | 'ELS' | 'CASH' = 'ETF'
): UserHoldingDetails {
  const profitOrLoss = currentValue - totalCost;
  const returnRate = totalCost > 0 ? (profitOrLoss / totalCost) * 100 : 0;

  return {
    id,
    name,
    totalCost,
    currentValue,
    profitOrLoss,
    returnRate,
    category,
    assetType,
  };
}
