import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
// [수정] d3-dsv 제거, Context Hook 임포트
import { useData } from '../contexts/DataContext'; 
import './Admin.css'; 
import './Dashboard.css'; 

// CSV_FILE_PATH 제거

// 아이콘 매핑 (변경 없음)
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

// 가상의 '현재' 환경 설정 (변경 없음)
const currentStatus = {
    date: '2024년 1월 2일 (월)',
    time: '14:00',
    temp: 1,
    humidity: 75,
    rain: 80,
    weatherIcon: '🌧️',
    weatherDesc: '비',
    filterHour: 4, 
    filterDay: 1,
};

const Dashboard = () => {
  // [수정] 로컬 state 대신 Context에서 데이터 가져오기
  // const [isLoading, setIsLoading] = useState(true); <-- 삭제
  const { fullData, isDataLoading: isLoading } = useData();

  const [top3Items, setTop3Items] = useState([]);
  const [ageData, setAgeData] = useState(null);
  const [totalSales, setTotalSales] = useState(0);

  // [삭제] Effect 1: CSV 파일 로드 부분 삭제됨

  // --- Effect: 데이터 분석 ---
  // fullData가 준비되면(로딩 완료되면) 실행
  useEffect(() => {
    if (isLoading || fullData.length === 0) return;

    // [수정] parsedData 대신 fullData 사용
    // [1차 시도] 모든 조건(요일 + 시간 + 기온 범위) 적용
    let currentData = fullData.filter(row => 
      row.day === currentStatus.filterDay &&
      row.hour === currentStatus.filterHour &&
      (row.temp >= currentStatus.temp - 2 && row.temp <= currentStatus.temp + 2)
    );

    // [안전장치] (기존 로직 유지)
    if (currentData.length === 0) {
      console.warn("⚠️ 조건(요일+시간+기온)에 맞는 데이터가 없음! -> 기온 조건 제거하고 재시도");
      currentData = fullData.filter(row => 
        row.day === currentStatus.filterDay &&
        row.hour === currentStatus.filterHour
      );
    }

    if (currentData.length === 0) {
        console.warn("⚠️ 요일+시간 데이터도 없음! -> 전체 데이터 샘플 사용 (비상용)");
        currentData = fullData.slice(0, 1000);
    }

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
      const ageLabel = AGE_MAP[row.age] || '기타';
      acc[ageLabel] = (acc[ageLabel] || 0) + row.amount;
      return acc;
    }, {});

    // 매출액 기준 내림차순 정렬 후 상위 5개 추출
    const sortedAgeData = Object.entries(salesByAge)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    setAgeData({
      labels: sortedAgeData.map(([label]) => label),
      values: sortedAgeData.map(([, value]) => value)
    });
    
    // 분석 3: 총 예상 매출
    const total = Object.values(salesByCategory).reduce((a, b) => a + b, 0);
    setTotalSales(total);

  }, [fullData, isLoading]); // fullData가 로드되면 실행

  // 숫자 포맷팅
  const formatMoney = (val) => Math.round(val).toLocaleString();

  // 로딩 화면 (Context 로딩 상태 사용)
  // 대시보드는 첫 화면이라 로딩 UI가 필요할 수 있음
  if (isLoading) {
      // 기존 return JSX 구조를 유지하되, 내용물만 로딩으로 대체하거나
      // 전체 화면 로딩을 띄울 수도 있습니다. 여기선 간단히 텍스트만.
      return <div className="dashboard-home" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>
          <div className="loading-box">전체 데이터 로딩 중...</div>
      </div>;
  }

  return (
    <div className="dashboard-home">
      
      {/* 상단: 날씨 및 시간 위젯 */}
      <div className="dashboard-top-widgets">
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
        <h3 className="section-title">이 시간대, 가장 잘 팔리는 메뉴 TOP 3 🏆</h3>
        <h1 className="section-sub">※경기도 수원시 2024년 날씨 데이터 기준 분석 결과입니다</h1>
        <div className="top3-container">
            {/* 데이터가 로드된 상태이므로 바로 렌더링 */}
            {top3Items.map((item, index) => (
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
            ))}
        </div>
      </div>

      {/* 하단: 추가 시각화 (연령대 & 총 매출) */}
      <div className="dashboard-bottom-row">
        
        <div className="widget-card chart-card">
          <div className="card-header">
            <h4>주문 고객 연령대</h4>
          </div>
          <div className="mini-chart-wrapper">
            {ageData && (
              <Plot
                data={[{
                  values: ageData.values,
                  labels: ageData.labels,
                  type: 'pie',
                  hole: 0.4,
                  marker: { colors: ['#ff3d00', '#d32f2f', '#aeebea', '#d6f5f4', '#f1f3f5'] },
                  textinfo: 'label+percent',
                  hoverinfo: 'label+value',
                  showlegend: false
                }]}
                layout={{
                  height: 250,
                  margin: { t: 10, b: 10, l: 10, r: 10 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  font: { family: 'Pretendard, sans-serif' }
                }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
        </div>

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
              {formatMoney(totalSales)}
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