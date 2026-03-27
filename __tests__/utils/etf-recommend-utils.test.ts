import * as EtfUtils from '@/utils/etf-recommend-utils';
import { IndicatorDirection } from '@/utils/etf-recommend-utils';
import { InvestType } from '@prisma/client';

describe('EtfRecommendUtils', () => {
  describe('normalizeIndicator', () => {
    it('HIGHER_IS_BETTER 방향으로 정규화한다', () => {
      expect(
        EtfUtils.normalizeIndicator(
          7,
          0,
          10,
          IndicatorDirection.HIGHER_IS_BETTER
        )
      ).toBe(0.7);
      expect(
        EtfUtils.normalizeIndicator(
          12,
          0,
          10,
          IndicatorDirection.HIGHER_IS_BETTER
        )
      ).toBe(1);
      expect(
        EtfUtils.normalizeIndicator(
          -2,
          0,
          10,
          IndicatorDirection.HIGHER_IS_BETTER
        )
      ).toBe(0);
    });

    it('LOWER_IS_BETTER 방향으로 정규화한다', () => {
      expect(
        EtfUtils.normalizeIndicator(
          3,
          0,
          10,
          IndicatorDirection.LOWER_IS_BETTER
        )
      ).toBe(0.7);
      expect(
        EtfUtils.normalizeIndicator(
          10,
          0,
          10,
          IndicatorDirection.LOWER_IS_BETTER
        )
      ).toBe(0);
      expect(
        EtfUtils.normalizeIndicator(
          0,
          0,
          10,
          IndicatorDirection.LOWER_IS_BETTER
        )
      ).toBe(1);
    });

    it('min과 max가 같으면 0.5를 반환한다', () => {
      expect(EtfUtils.normalizeIndicator(5, 5, 5)).toBe(0.5);
    });
  });

  describe('classifyRiskGrade', () => {
    it('변동성에 따라 위험등급을 분류한다', () => {
      // 연간 변동성 기준: <= 5%(5), <= 10%(4), <= 15%(3), <= 20%(2), > 20%(1)
      // 월간 변동성 * sqrt(12)
      expect(EtfUtils.classifyRiskGrade(0.01)).toBe(5); // 0.01 * 3.46 = 0.0346 (3.46%)
      expect(EtfUtils.classifyRiskGrade(0.025)).toBe(4); // 0.025 * 3.46 = 0.0865 (8.65%)
      expect(EtfUtils.classifyRiskGrade(0.04)).toBe(3); // 0.04 * 3.46 = 0.1384 (13.84%)
      expect(EtfUtils.classifyRiskGrade(0.055)).toBe(2); // 0.055 * 3.46 = 0.1903 (19.03%)
      expect(EtfUtils.classifyRiskGrade(0.07)).toBe(1); // 0.07 * 3.46 = 0.2422 (24.22%)
    });
  });

  describe('calculateCategoryBonus', () => {
    it('선호 카테고리에 포함되면 보너스를 반환한다', () => {
      const preferred = ['주식/국내', '채권'];
      expect(EtfUtils.calculateCategoryBonus('주식/국내/배당', preferred)).toBe(
        0.1
      );
      expect(EtfUtils.calculateCategoryBonus('채권/국공채', preferred)).toBe(
        0.1
      );
      expect(EtfUtils.calculateCategoryBonus('주식/해외', preferred)).toBe(0);
    });
  });

  describe('normalizeVolatilityByRiskGrade', () => {
    it('안전한 등급일수록 높은 점수를 반환한다', () => {
      expect(EtfUtils.normalizeVolatilityByRiskGrade(5)).toBe(1.0); // 초저위험
      expect(EtfUtils.normalizeVolatilityByRiskGrade(1)).toBe(0.2); // 초고위험
    });
  });

  describe('generateReasons', () => {
    it('조건에 맞는 추천 이유를 생성한다', () => {
      const metrics = {
        sharpeRatio: 1.5,
        totalFee: 0.1,
        tradingVolume: 2000000000,
        netAssetValue: 500000000000,
        trackingError: 0.2,
        divergenceRate: 0.1,
      };

      const reasons = EtfUtils.generateReasons(
        metrics,
        InvestType.MODERATE,
        3,
        true
      );

      expect(reasons.some((r) => r.title === '관심 분야 일치')).toBe(true);
      expect(reasons.some((r) => r.title === '우수한 위험 대비 수익')).toBe(
        true
      );
      expect(reasons.some((r) => r.title === '매우 낮은 운용 비용')).toBe(true);
      expect(reasons.length).toBeLessThanOrEqual(3);
    });
  });
});
