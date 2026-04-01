import { performance } from 'perf_hooks';

// 시뮬레이션을 위한 가상 데이터 생성 함수
function generateMockEtfs(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    riskGrade: Math.floor(Math.random() * 5) + 1, // 1~5등급
    metrics: {
      return1y: Math.random() * 20,
      fee: Math.random() * 0.5,
      volume: Math.random() * 1000000,
      nav: Math.random() * 500000000,
    },
  }));
}

// 1. 기존 방식 (Naive): 전체 2,350개 처리 + Early Return 없음
function runNaiveRecommendation(data: any[]) {
  const start = performance.now();

  // 전체 데이터에 대해 복잡한 연산(정규화, 가중치 등) 수행 시뮬레이션
  const scored = data.map((item) => {
    // 복잡한 연산을 흉내내기 위한 루프
    let score = 0;
    for (let i = 0; i < 100; i++) {
      score += Math.sqrt(item.metrics.return1y * i);
    }
    return { ...item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const end = performance.now();
  return end - start;
}

// 2. 최적화 방식 (Optimized): 400개 제한 + Early Return 적용
function runOptimizedRecommendation(data: any[]) {
  const start = performance.now();

  // DB 선필터링 시뮬레이션: 400개만 추출
  const limitedData = data.slice(0, 400);

  // Early Return 시뮬레이션: 위험등급 4,5만 처리 (안정형 기준)
  const allowedGrades = [4, 5];
  const scored = limitedData
    .map((item) => {
      if (!allowedGrades.includes(item.riskGrade)) return null;

      let score = 0;
      for (let i = 0; i < 100; i++) {
        score += Math.sqrt(item.metrics.return1y * i);
      }
      return { ...item, score };
    })
    .filter((item) => item !== null);

  scored.sort((a: any, b: any) => b.score - a.score);
  const end = performance.now();
  return end - start;
}

async function main() {
  console.log('--- 추천 알고리즘 레이턴시(속도) 비교 측정 ---');

  const totalEtfs = generateMockEtfs(2350);
  const iterations = 100; // 정확도를 위해 100번 반복 측정

  let totalNaiveTime = 0;
  let totalOptimizedTime = 0;

  // 측정 시작
  for (let i = 0; i < iterations; i++) {
    totalNaiveTime += runNaiveRecommendation(totalEtfs);
    totalOptimizedTime += runOptimizedRecommendation(totalEtfs);
  }

  const avgNaive = totalNaiveTime / iterations;
  const avgOptimized = totalOptimizedTime / iterations;
  const improvement = (avgNaive / avgOptimized).toFixed(1);

  console.log(`\n[측정 결과 (평균 실행 시간)]`);
  console.log(`- 기존 방식 (Naive): ${avgNaive.toFixed(4)}ms`);
  console.log(`- 최적화 방식 (Optimized): ${avgOptimized.toFixed(4)}ms`);
  console.log(`- 성능 향상: 약 ${improvement}배 빨라짐`);

  const reductionPercent = (
    ((avgNaive - avgOptimized) / avgNaive) *
    100
  ).toFixed(1);
  console.log(`- 시간 소요 감소율: ${reductionPercent}%`);
}

main();
