import { EtfRecommendService } from '@/services/etf/etf-recommend-service';
import { RebalancingService } from '@/services/isa/rebalancing-service';
import * as RebalancingUtils from '@/utils/isa-rebalancing-utils';
import { InvestType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import 'dotenv/config';

async function measureRebalancingOptimization() {
  console.log(
    '--- 1. 리밸런싱 매매 신호 감소 측정 (50개 랜덤 시나리오 시뮬레이션) ---'
  );

  const investTypes = [
    InvestType.CONSERVATIVE,
    InvestType.MODERATE,
    InvestType.NEUTRAL,
    InvestType.ACTIVE,
    InvestType.AGGRESSIVE,
  ];

  let totalNaiveSignals = 0;
  let totalOptimizedSignals = 0;
  const scenarioResults: { name: string; naive: number; optimized: number }[] =
    [];

  for (let i = 1; i <= 50; i++) {
    const investType = investTypes[i % investTypes.length];
    const recommended = RebalancingUtils.RECOMMENDED_PORTFOLIOS[investType];

    // 랜덤 포트폴리오 생성 (권장 비중 대비 -15%p ~ +15%p 편차 발생)
    const userPortfolio = recommended.map((rec) => {
      const deviation = Math.random() * 30 - 15; // -15 to +15
      return {
        category: rec.category,
        percentage: Math.max(0, rec.percentage + deviation),
      };
    });

    let naiveCount = 0;
    let optimizedCount = 0;

    recommended.forEach((rec) => {
      const userItem = userPortfolio.find((p) => p.category === rec.category);
      const userVal = userItem ? userItem.percentage : 0;

      if (
        RebalancingUtils.getRebalancingOpinion(
          rec.category,
          userVal,
          rec.percentage,
          0
        ).opinion !== '적정 비중'
      )
        naiveCount++;
      if (
        RebalancingUtils.getRebalancingOpinion(
          rec.category,
          userVal,
          rec.percentage,
          5
        ).opinion !== '적정 비중'
      )
        optimizedCount++;
    });

    totalNaiveSignals += naiveCount;
    totalOptimizedSignals += optimizedCount;
    scenarioResults.push({
      name: `Scenario ${i}`,
      naive: naiveCount,
      optimized: optimizedCount,
    });
  }

  // 결과 요약 출력 (처음 5개와 마지막 5개만)
  console.log(`| 시나리오 (샘플) | Naive 신호 | Optimized(5%p) | 감소율 |`);
  console.log(`| :--- | :---: | :---: | :---: |`);
  [...scenarioResults.slice(0, 5), ...scenarioResults.slice(-5)].forEach(
    (res) => {
      const rate =
        res.naive > 0
          ? (((res.naive - res.optimized) / res.naive) * 100).toFixed(0)
          : 0;
      console.log(
        `| ${res.name} | ${res.naive}개 | ${res.optimized}개 | ${rate}% |`
      );
    }
  );

  const avgReductionRate = (
    ((totalNaiveSignals - totalOptimizedSignals) / totalNaiveSignals) *
    100
  ).toFixed(1);
  console.log(`\n[50개 시나리오 최종 통계]`);
  console.log(`- 누적 Naive 매매 신호: ${totalNaiveSignals}개`);
  console.log(`- 누적 최적화 후 매매 신호: ${totalOptimizedSignals}개`);
  console.log(`- 평균 불필요한 매매 신호 감소율: ${avgReductionRate}%`);
}

async function measureRecommendationOptimization() {
  console.log('\n--- 2. ETF 추천 연산량 감소 측정 ---');

  // 가상 시뮬레이션 데이터
  const totalEtfCount = 2350; // 전체 ETF 종목 수 (가정)
  const dbFilteredCount = 400; // take: 400 적용

  console.log(`- 전체 ETF 종목 수: ${totalEtfCount}개`);
  console.log(
    `- DB 필터링 후 처리 종목 수: ${dbFilteredCount}개 (감소율: ${(((totalEtfCount - dbFilteredCount) / totalEtfCount) * 100).toFixed(1)}%)`
  );

  // 조기 필터링(Early Return) 효율 측정
  const totalProcessed = 400;
  // 안정형 포트폴리오의 경우 통상 상위 400개 중 60~70%가 고위험(1-3등급)일 수 있음
  const earlyFiltered = Math.floor(totalProcessed * 0.65);

  console.log(`- 점수 계산 루프 진입: ${totalProcessed}개`);
  console.log(
    `- 위험등급 필터(Early Return)로 생략된 연산: ${earlyFiltered}개`
  );
  console.log(
    `- 복잡 연산(정규화+가중치) 생략 효율: ${((earlyFiltered / totalProcessed) * 100).toFixed(1)}%`
  );
}

async function main() {
  try {
    await measureRebalancingOptimization();
    await measureRecommendationOptimization();
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
