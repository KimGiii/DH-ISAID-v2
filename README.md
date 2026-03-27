## 🌱 ISA로 시작하는 절세 투자, MZ세대 맞춤형 투자 솔루션


![image](https://github.com/user-attachments/assets/0817ed29-703b-4bed-90f0-43f8cac827bd)


<br/>

### 🙌🏻 프로젝트 소개

> **🧐 ISA? ETF 추천? 제대로 관리해보고 싶은데 너무 막막해요.**
>
> ISAID는 MZ세대를 위해 ISA 절세, ETF 추천, 리밸런싱, 가이드, 챌린지 미션까지 한 번에 관리할 수 있는 플랫폼입니다.
> 투자, 이제 어렵지 않게. ISAID와 함께 재미있게 시작해보세요.


- `개발 기간` : **2025.06.05 ~ 2025.07.03**
- `서비스 배포 URL` :  [https://isaid.site](https://isaid.site) 
- `시연 영상 URL` : [https://www.youtube.com/watch?v=iiYrQJj9y_g](https://www.youtube.com/watch?v=iiYrQJj9y_g)

<br/>

### 🙋🏻‍♀️ 주요 기능 소개

![image](https://github.com/user-attachments/assets/c1035788-6d3d-4455-bcb2-5d56fcae8956)

![image](https://github.com/user-attachments/assets/2500aeb3-274e-4fee-80b8-c3ee6460b8a0)

![image](https://github.com/user-attachments/assets/1cecbac0-8914-4cd8-ada5-d6394347cecc)

![image](https://github.com/user-attachments/assets/46997a7d-cdb7-4129-8531-4c0e7f049d8b)

![image](https://github.com/user-attachments/assets/90c64749-47b8-4a43-8143-1af6789aa16b)

<br/>

### 📍 세부 기능 요약

| 분류 | 기능 | 설명 |
|------|------|------|
| 사용자 | 회원가입 / 로그인 | 이메일로 간편하게 가입하고, JWT로 안전하게 로그인해요. |
| ISA  | ISA 계좌 등록/삭제 | 내 ISA 계좌, 필요할 때 등록하고 언제든 삭제할 수 있어요. |
| ISA  | 수익률 조회 | 매달 얼마나 벌었는지, 월별 수익률로 딱 보여드려요. |
| ISA  | 포트폴리오 리밸런싱 | 지금 보유 중인 자산 기준 리밸런싱 제안으로 쉽게 관리해요. |
| ISA  | 절세 리포트 | 지금까지 아낀 금액은? 일상 속 금액으로 쉽게, 직관적으로 계산해드려요. |
| ETF | 테마 / 카테고리별 ETF 조회 | 관심 있는 테마나 카테고리로, ETF 골라보세요. |
| ETF | 투자 성향 테스트 | 내 투자 스타일이 뭔지 궁금할 땐? 몇 가지 질문으로 진단해드려요. |
| ETF | 맞춤 ETF 추천 | 투자 성향과 목표에 맞는 ETF를 똑똑하게 추천해드려요. |
| ETF | ETF 차트 및 구성 | ETF 구성 비중이 어떻게 되는지, 수익률은 어떤지 한눈에 보여드려요. |
| 퀴즈 | 금융 퀴즈 | 가볍게 퀴즈 풀면서 금융 상식 쌓고, 기록도 남겨보세요. |
| 챌린지 | 동기부여 | 투자 미션 달성하면 보상 팡팡! 하나하나 쌓이는 ETF 조각과 함께 투자 고수가 되어 보세요. |
| 가이드 | MZ세대를 위한 금융 가이드 | 숏폼으로 보는 금융 가이드, 지금 필요한 정보만 쏙쏙! |

<br/>

### 🧑🏻‍💻👩🏻‍💻 팀원 소개
| <img src="https://avatars.githubusercontent.com/dbstj0403" width="130"/> | <img src="https://avatars.githubusercontent.com/HyejeongSon" width="130"/> | <img src="https://avatars.githubusercontent.com/hyo-joon" width="130"/> | <img src="https://avatars.githubusercontent.com/jjinleee" width="130"/> | <img src="https://avatars.githubusercontent.com/KimGiii" width="130"/> | <img src="https://avatars.githubusercontent.com/VarGun" width="130"/> |
|:--:|:--:|:--:|:--:|:--:|:--:|
| **Yoonseo Won**<br>[@dbstj0403](https://github.com/dbstj0403)<br/> | **Hyejeong Son**<br>[@HyejeongSon](https://github.com/HyejeongSon)<br/> | **Hyo-joon**<br>[@hyo-joon](https://github.com/hyo-joon)<br/> | **Jin Lee**<br>[@jjinleee](https://github.com/jjinleee)<br/>| **Gibo Kim**<br>[@KimGiii](https://github.com/KimGiii)<br/> | **Heegun Kwak**<br>[@VarGun](https://github.com/VarGun)<br/> |

<br/>

### 🔧 System Architecture Diagram
<p align="left">
  <img src="https://github.com/user-attachments/assets/acb31cd6-edfd-488d-8c3c-0b3b329b4505" width="600"/>
</p>

<br/>

### 🖇️ ERD
<p align="left">
 <img src="https://github.com/user-attachments/assets/efb185f2-5db4-4c8e-ae10-428bf5443cc8"/>
</p>

<br/>

### 🗂️ 폴더 구조
```
.
├── __mocks__
├── __tests__
│   ├── api
│   ├── helpers
│   └── services
├── app
│   ├── (routes)
│   │   ├── (auth)
│   │   ├── challenge
│   │   ├── etf
│   │   ├── guide
│   │   ├── isa
│   │   ├── main
│   │   ├── mypage
│   │   └── quiz
│   ├── actions
│   ├── api
│   │   ├── auth
│   │   ├── challenge
│   │   ├── etf
│   │   ├── isa
│   │   ├── isa-profit-test
│   │   ├── quiz
│   │   ├── sentry-example-api
│   │   └── user
│   └── sentry-example-page
├── components
│   ├── bottom-bar
│   ├── guide
│   ├── header-bar
│   ├── root
│   └── ui
├── context
├── data
├── hooks
├── lib
│   ├── api
│   ├── data
│   │   ├── etf
│   │   ├── general
│   │   └── insert-all
│   ├── db
│   ├── schemas
│   └── test
├── prisma
│   └── migrations
├── public
├── services
│   ├── challenge
│   ├── etf
│   └── isa
├── stories
│   └── common
├── types
└── utils
```

### 🛠 Tech Stack

### Platforms & Languages

<img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white"/> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white"/> <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white"/> <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white"/> <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white"/> <img src="https://img.shields.io/badge/AWS RDS-527FFF?style=flat&logo=amazonrds&logoColor=white"/> <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white"/> <img src="https://img.shields.io/badge/Selenium-43B02A?style=flat&logo=selenium&logoColor=white"/>

### Deployment & Version Control

<img src="https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white"/> <img src="https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white"/> <img src="https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white"/>

### Development Environment

<img src="https://img.shields.io/badge/IntelliJ IDEA-000000?style=flat&logo=intellijidea&logoColor=white"/> <img src="https://img.shields.io/badge/VSCode-007ACC?style=flat&logo=visualstudiocode&logoColor=white"/>

### Communication & Management

<img src="https://img.shields.io/badge/Notion-000000?style=flat&logo=notion&logoColor=white"/> <img src="https://img.shields.io/badge/Figma-F24E1E?style=flat&logo=figma&logoColor=white"/> <img src="https://img.shields.io/badge/Slack-4A154B?style=flat&logo=slack&logoColor=white"/>

<br/>

### 🥕 서비스 신뢰도를 위한 테스트

ISAID 서비스는 다양하고 포괄적인 테스트 케이스를 통해 서비스의 안정성과 신뢰도를 검증했어요. 

`API 통합 테스트`

| 테스트 파일 | API 경로 | 설명 |
|-------------|----------|------|
| `challenge-claim-api.test.ts` | `/api/challenge/claim` | 챌린지 보상 청구 API |
| `etf-recommend-api.test.ts` | `/api/etf/recommend` | ETF 추천 API |
| `etf-test-api.test.ts` | `/api/etf/mbti` | ETF 투자 성향 테스트 API |
| `isa-rebalancing-api.test.ts` | `/api/isa/rebalancing` | ISA 포트폴리오 리밸런싱 API |

<br>

`서비스 로직 테스트`

| 테스트 파일 | 서비스 | 설명 |
|-------------|--------|------|
| `etf-recommend-service.test.ts` | `EtfRecommendService` | ETF 추천 알고리즘 및 위험등급 분류 |
| `etf-test-service.test.ts` | `EtfTestService` | 투자 성향 분석 및 테스트 결과 처리 |
| `challenge-claim.test.ts` | `ChallengeClaimService` | 챌린지 보상 청구 조건 검증 |
| `challenge-status.test.ts` | `ChallengeStatusService` | 챌린지 진행 상태 확인 |
| `isa-rebalancing-service.test.ts` | `IsaRebalancingService` | ISA 포트폴리오 리밸런싱 전략 |
| `get-isa-portfolio.test.ts` | `GetIsaPortfolioService` | ISA 포트폴리오 조회 |
| `get-monthly-returns.test.ts` | `GetMonthlyReturnsService` | 월별 수익률 계산 |
| `tax-saving.test.ts` | `TaxSavingService` | 세금 절약 효과 계산 |

<br>

`헬퍼 함수`

| 헬퍼 파일 | 설명 |
|-----------|------|
| `etf-recommend-helpers.ts` | ETF 추천 테스트용 모의 데이터 생성 |
| `etf-test-helpers.ts` | ETF 테스트 관련 헬퍼 함수 |
| `rebalancing-helpers.ts` | 리밸런싱 테스트 헬퍼 함수 |

<br>

`테스트 환경`

| 항목 | 설명 |
|------|------|
| **테스트 프레임워크** | Jest |
| **실행 환경** | Node.js (`@jest-environment node`) |
| **모킹** | Prisma, NextAuth, 외부 서비스 |
| **스냅샷 테스트** | UI 컴포넌트 스냅샷 테스트 지원 |
