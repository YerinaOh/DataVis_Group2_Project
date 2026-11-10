# 날씨 기반 매출 분석 솔루션

데이터 시각화 프로젝트입니다.
수원시 음식점 카드 매출 데이터와 기상 데이터(2024년 1~12월)를 결합해, 기온·습도·시간대·요일·고객층에 따라 업종별 매출이 어떻게 달라지는지 보여주는 웹 대시보드입니다.
레스토랑 예약 플랫폼(캐치테이블 파트너센터 컨셉)의 관리자 화면 형태로 구성했으며, 분석 결과를 바탕으로 날씨 맞춤형 타겟 광고 노출 화면을 시뮬레이션할 수 있습니다.

## 주요 기능

| 메뉴 | 설명 |
| --- | --- |
| 🏠 **대시보드** | 가상의 '현재' 조건(날짜·시간·기온)에 맞는 업종별 매출 Top 3, 주문 고객 연령대 비율, 예상 총매출 |
| 📊 **매출 분석 › 기온별 분석** | 기온·습도·요일·시간대·성별·연령 필터로 업종별 매출 순위 막대 차트 및 인사이트 제공, 결과를 JSON으로 내보내기 |
| 📊 **매출 분석 › 카테고리별 분석** | 업종을 선택하면 시간대별 매출 추이, 피크 타임 Top 3, 핵심 고객층(성별×연령) Top 3 |
| 📊 **매출 분석 › 요일별 분석** | 요일별 시간대 매출 트렌드와 피크 시간 |
| 📱 **타겟광고 시뮬레이션** | 기온별 분석에서 내보낸 JSON을 업로드하면, 상위 업종이 앱 화면(아이폰 목업)에 어떻게 노출되는지 미리 보기 |
| 📢 광고 관리 | 준비 중 |

### 로그인 역할

별도 인증 서버 없이 아이디로 역할만 구분합니다. (비밀번호는 검사하지 않음)

| 아이디 | 역할 | 보이는 메뉴 |
| --- | --- | --- |
| `admin` | 플랫폼 마케팅 담당자 | 전체 메뉴 |
| 그 외 아무 값 | 매장 사장님 | 타겟광고 시뮬레이션 메뉴 숨김 |

## 기술 스택

- **React 19** (Create React App, `react-scripts` 5)
- **Plotly.js** / `react-plotly.js` — 차트 시각화
- **d3-dsv** — CSV 파싱
- React Context API — 전체 데이터 공유 상태 관리

## 시작하기

Node.js 18 이상을 권장합니다.

```bash
npm install
npm start        # http://localhost:3000 에서 개발 서버 실행
npm run build    # build/ 폴더에 프로덕션 빌드 생성
npm test         # 테스트 실행
```

> 앱이 처음 뜰 때 12개월치 CSV(약 270MB, 470만여 행)를 브라우저에서 한꺼번에 내려받아 파싱하므로, 첫 로딩에 시간이 걸리고 메모리를 많이 씁니다.

## 데이터

`public/suwon_food_weather_2024_MM.csv` (01~12월, 월별 1개 파일)

| 컬럼 | 의미 | 앱 내 사용 |
| --- | --- | --- |
| `ta_ymd` | 거래 일자 (YYYYMMDD) | – |
| `admi_cty_no` | 행정동 코드 | – |
| `card_tpbuz_nm_2` | 업종명 (한식, 커피/음료, 간이주점 등) | `category` |
| `hour` | 시간대 코드 (1: 00–07시 … 10: 23–24시) | `hour` |
| `sex` | 성별 (`M` / `F`) | `sex` |
| `age` | 연령대 코드 (1: 10대 미만 … 9: 80대 이상) | `age` |
| `day` | 요일 (1: 월 … 7: 일) | `day` |
| `amt` | 매출 금액 (원) | `amount` (만원 단위로 변환) |
| `temp` | 기온 (°C) | `temp` (정수 반올림) |
| `humidity` | 습도 (%) | `humidity` (정수 반올림) |
| `rainfall`, `snow`, `snow_3h` | 강수량, 적설량 | – |

불러올 파일 목록은 [src/contexts/DataContext.js](src/contexts/DataContext.js)의 `CSV_FILES`에서 관리합니다. 월 데이터를 추가하거나 빼려면 이 배열을 수정하세요.

### 타겟광고 시뮬레이션 JSON 형식

기온별 분석 화면에서 내보낸 파일(`target_simulation_<timestamp>.json`)의 구조입니다.

```json
{
  "title": "캐치테이블 타겟광고 시뮬레이션 데이터",
  "created_at": "2024. 1. 2. 오후 2:00:00",
  "conditions": {
    "temperature": 1, "humidity": 75,
    "hour": "11-14시", "day": "월요일", "sex": "ALL", "age": "ALL"
  },
  "top_10_rankings": [
    { "rank": 1, "category": "한식", "amount": 12345 }
  ]
}
```

## 프로젝트 구조

```
src/
├── App.js                    # 로그인 상태·사용자 역할 관리, DataProvider로 감싸기
├── LoginPage.js              # 로그인 화면
├── Main.js                   # 사이드바 메뉴, 매출 분석 탭 전환
├── contexts/
│   └── DataContext.js        # 월별 CSV 병렬 로딩·파싱·병합, useData() 훅 제공
└── components/
    ├── Dashboard.js          # 대시보드
    ├── SalesBarChart.js      # 기온별 분석 + JSON 내보내기
    ├── CategoryAnalysis.js   # 카테고리별 분석
    ├── DayAnalysis.js        # 요일별 분석
    ├── AdSimulation.js       # 타겟광고 시뮬레이션
    └── useDataParsing.js     # (초기 버전에서 쓰던 훅, 현재 미사용)
public/
├── suwon_food_weather_2024_*.csv
├── icons/                    # 업종별 아이콘 이미지
└── sample_iphone.png         # 광고 시뮬레이션용 아이폰 목업
```
