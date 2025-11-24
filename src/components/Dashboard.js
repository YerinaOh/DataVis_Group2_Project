import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { csvParse } from 'd3-dsv';
import './Admin.css'; // Admin 공통 스타일 사용
import './Dashboard.css'; // 대시보드 전용 스타일

const CSV_FILE_PATH = '/suwon_food_weather_2024_01.csv';

// 아이콘 매핑 (AdSimulation.js와 동일하게 사용)
const CATEGORY_ICON_MAP = {
  "한식": "/icons/korean.png",
  "커피/음료": "/icons/coffee.png",
  "고기요리": "/icons/meat.png",
  "간이주점": "/icons/pub.png",
  "일식/수산물": "/icons/sushi.png",
  "제과/제빵/떡/케익": "/icons/bakery.png",
  "닭/오리요리": "/icons/chicken.png",
  "분식": "/icons/tteokbokki.png",
  "패스트푸드": "/icons/burger.png",
  "별식/퓨전요리": "/icons/fusion.png",
};
const DEFAULT_ICON = "/icons/default_food.png";

const AGE_MAP = {
  1: '10대 미만', 2: '10대', 3: '20대', 4: '30대',
  5: '40대', 6: '50대', 7: '60대', 8: '70대', 9: '80대 이상'
};

  // --- 1. 가상의 '현재' 환경 설정 ---
const currentStatus = {
    date: '2024년 1월 2일 (월)',
    time: '14:00', // 오후 2시 (hour: 4 범위)
    temp: 1,      // 기온 1도
    humidity: 75,  // 습도 45%
    rain: 80,
    weatherIcon: '🌧️',
    weatherDesc: '비',
    // 데이터 필터링용 키값
    filterHour: 4, // 11-14시
    filterDay: 1,  // 월요일
};

const Dashboard = () => {


  const [top3Items, setTop3Items] = useState([]);
  const [ageData, setAgeData] = useState(null);
  const [totalSales, setTotalSales] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // --- 2. 데이터 로딩 및 '현재 상황' 분석 ---
  // --- Effect 1: CSV 파일 로드 및 파싱 (디버깅용 로그 추가) ---
   useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("1. CSV 로딩 시작..."); 
        const response = await fetch(CSV_FILE_PATH);
        
        if (!response.ok) {
            console.error("❌ 파일 로드 실패! 상태 코드:", response.status);
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        console.log("2. 파일 찾음! 텍스트 변환 중...");
        const csvText = await response.text();
        console.log("3. 텍스트 변환 완료. 파싱 시작... (길이:", csvText.length, ")");

        // 필요한 데이터만 파싱
        const parsedData = csvParse(csvText, (row) => ({
          temp: Math.round(+row.temp),
          humidity: Math.round(+row.humidity),
          category: row.card_tpbuz_nm_2,
          amount: +row.amt / 10000,
          age: +row.age,
          day: +row.day,
          hour: +row.hour
        }));

console.log("2. 전체 데이터 로드 완료:", parsedData.length, "개");

        // [1차 시도] 모든 조건(요일 + 시간 + 기온 범위) 적용
        let currentData = parsedData.filter(row => 
          row.day === currentStatus.filterDay &&
          row.hour === currentStatus.filterHour &&
          (row.temp >= currentStatus.temp - 2 && row.temp <= currentStatus.temp + 2)
        );

        // [안전장치] 만약 데이터가 없다면? 조건을 완화합니다.
        if (currentData.length === 0) {
          console.warn("⚠️ 조건(요일+시간+기온)에 맞는 데이터가 없음! -> 기온 조건 제거하고 재시도");
          // [2차 시도] 기온 제외하고 요일+시간만 봄
          currentData = parsedData.filter(row => 
            row.day === currentStatus.filterDay &&
            row.hour === currentStatus.filterHour
          );
        }

        if (currentData.length === 0) {
           console.warn("⚠️ 요일+시간 데이터도 없음! -> 전체 데이터 샘플 사용 (비상용)");
           // [3차 시도] 그냥 전체 데이터에서 앞부분 1000개만 가져옴 (화면이 비어보이지 않게)
           currentData = parsedData.slice(0, 1000);
        }

        console.log("3. 최종 필터링된 데이터 개수:", currentData.length, "개");

        // 분석 1: 업종별 매출 순위 (Top 3)
        const salesByCategory = currentData.reduce((acc, row) => {
          acc[row.category] = (acc[row.category] || 0) + row.amount;
          return acc;
        }, {});
        
        const sortedCategories = Object.entries(salesByCategory)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3) 
          .map(([category, amount], index) => ({ rank: index + 1, category, amount }));

        setTop3Items(sortedCategories);

        // 분석 2: 연령대별 주문 비율
        const salesByAge = currentData.reduce((acc, row) => {
          // AGE_MAP에 없는 값은 '기타'로 처리
          const ageLabel = AGE_MAP[row.age] || '기타';
          acc[ageLabel] = (acc[ageLabel] || 0) + row.amount;
          return acc;
        }, {});

        // [디버깅] 연령대 데이터 확인
        console.log("4. 연령대별 집계 결과:", salesByAge);

        setAgeData({
          labels: Object.keys(salesByAge),
          values: Object.values(salesByAge)
        });

        // 분석 3: 총 예상 매출
        const total = Object.values(salesByCategory).reduce((a, b) => a + b, 0);
        setTotalSales(total);

        setIsLoading(false);

      } catch (error) {
        console.error("Dashboard Load Error:", error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 숫자 포맷팅
  const formatMoney = (val) => Math.round(val).toLocaleString();

  return (
    <div className="dashboard-home">
      
      {/* 상단: 날씨 및 시간 위젯 */}
      <div className="dashboard-top-widgets">
        {/* 1. 날씨 위젯 (SalesBarChart에서 가져옴) */}
        <div className="widget-card weather-card">
          <div className="card-header">
            <h4>우리 동네 날씨</h4>
            <span>실시간 업데이트</span>
          </div>
          <div className="weather-content">
            <div className="weather-main">
              <span className="weather-icon">{currentStatus.weatherIcon}</span>
              <div className="weather-text">
                <span className="temp">{currentStatus.temp}°C</span>
                <span className="desc">{currentStatus.weatherDesc}</span>
              </div>
            </div>
            <div className="weather-details">
              <div className="detail-item">
                <span className="label">습도</span>
                <span className="value">{currentStatus.humidity}%</span>
              </div>
              <div className="detail-item">
                <span className="label">강수</span>
                <span className="value">{currentStatus.rain}mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 시간/요일 위젯 */}
        <div className="widget-card time-card">
          <div className="card-header">
            <h4>현재 시각</h4>
          </div>
          <div className="time-content">
            <div className="date-text">{currentStatus.date}</div>
            <div className="time-text">{currentStatus.time}</div>
            <div className="time-badge">점심 피크 타임 🔥</div>
          </div>
        </div>
      </div>

      {/* 중단: 메인 인사이트 (Top 3) */}
      <div className="dashboard-section">
        <h3 className="section-title">지금 이 순간, 가장 잘 팔리는 메뉴 TOP 3 🏆</h3>
        <h1 className="section-sub">※경기도 수원시 2024년 날씨 데이터 기준 분석 결과입니다</h1>
        <div className="top3-container">
          {isLoading ? (
            <div className="loading-box">데이터 분석 중...</div>
          ) : (
            top3Items.map((item, index) => (
              <div key={item.category} className={`top3-card rank-${item.rank}`}>
                <div className="medal-badge">
                  {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}
                </div>
                <div className="food-icon">
                  <img 
                    src={CATEGORY_ICON_MAP[item.category] || DEFAULT_ICON} 
                    alt={item.category}
                    onError={(e) => e.target.src = DEFAULT_ICON}
                  />
                </div>
                <div className="food-info">
                  <span className="category-name">{item.category}</span>
                  <span className="sales-amount">{formatMoney(item.amount)}만원</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 하단: 추가 시각화 (연령대 & 총 매출) */}
      <div className="dashboard-bottom-row">
        
        {/* 3. 실시간 주문 고객 연령대 (도넛 차트) */}
        <div className="widget-card chart-card">
          <div className="card-header">
            <h4>실시간 주문 고객 연령대</h4>
          </div>
          <div className="mini-chart-wrapper">
            {ageData && (
              <Plot
                data={[{
                  values: ageData.values,
                  labels: ageData.labels,
                  type: 'pie',
                  hole: 0.4, // 도넛 차트
                  marker: { colors: ['#2ac1bc', '#6ddad6', '#aeebea', '#d6f5f4', '#f1f3f5'] },
                  textinfo: 'label+percent',
                  hoverinfo: 'label+value',
                  showlegend: false
                }]}
                layout={{
                  height: 250,
                  margin: { t: 10, b: 10, l: 10, r: 10 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Pretendard' }
                }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
        </div>

        {/* 4. 예상 매출 요약 카드 */}
        <div className="widget-card summary-card">
          <div className="card-header">
            <h4>현재 조건 총 예상 매출</h4>
            <span className="info-icon">ⓘ</span>
          </div>
          <div className="summary-content">
            <p className="summary-desc">
              비슷한 날씨와 요일, 시간대의<br/>
              수원시 전체 평균 매출입니다.
            </p>
            <div className="total-amount">
              {isLoading ? '...' : formatMoney(totalSales)}
              <span className="unit">만원</span>
            </div>
            <button className="action-btn">상세 분석 보러가기 &gt;</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;