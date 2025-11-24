import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { useData } from '../contexts/DataContext'; 
import './CategoryAnalysis.css'; 

const HOUR_LABELS = {
  1: '00-07시', 2: '07-09시', 3: '09-11시', 4: '11-14시', 5: '14-17시',
  6: '17-18시', 7: '18-20시', 8: '20-21시', 9: '21-23시', 10: '23-24시'
};

const CATEGORY_ICONS = {
  "한식": "🍚", "분식": "🍢", "카페/디저트": "☕", "치킨": "🍗",
  "피자/양식": "🍕", "중식": "🥟", "일식/돈까스": "🍣", "족발/보쌈": "🐷",
  "야식": "🌙", "패스트푸드": "🍔", "도시락": "🍱", "아시안": "🍜",
  "백반/죽/국수": "🍲", "찜/탕": "🥘", "고기/구이": "🥩", "회/일식": "🐟",
  "별식/퓨전요리": "🌮"
};

const AGE_MAP = {
  1: '10대 미만', 2: '10대', 3: '20대', 4: '30대',
  5: '40대', 6: '50대', 7: '60대', 8: '70대', 9: '80대 이상'
};

const CategoryAnalysis = () => {
  const { fullData, isDataLoading: isLoading } = useData();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chartData, setChartData] = useState({ x: [], y: [] });
  
  // [수정] Top 3 state 제거 (섹션 삭제됨), 인사이트 state 유지
  const [categoryInsights, setCategoryInsights] = useState(null);

  // 1. 초기 데이터 가공 (카테고리 목록만 추출)
  useEffect(() => {
    if (isLoading || fullData.length === 0) return;

    // 1-1. 카테고리 목록 (가나다순 정렬)
    const uniqueCategories = [...new Set(fullData.map(d => d.category))].sort();
    setCategories(uniqueCategories);

    // (삭제됨: 전체 매출 Top 3 로직 제거)

  }, [fullData, isLoading]);

  // 2. 카테고리 선택 시 상세 분석 (차트 + 인사이트 Top 3)
  useEffect(() => {
    if (!selectedCategory || fullData.length === 0) return;

    const filtered = fullData.filter(d => d.category === selectedCategory);

    // 2-1. 시간대별 매출 집계
    const salesByHour = {};
    for (let i = 1; i <= 10; i++) salesByHour[i] = 0;

    // 2-2. 고객층 분석
    const salesByDemo = {}; 

    filtered.forEach(row => {
      // (1) 시간대 집계
      if (salesByHour[row.hour] !== undefined) {
        salesByHour[row.hour] += row.amount;
      }
      
      // (2) 데모(고객층) 집계
      const ageLabel = AGE_MAP[row.age] || '기타';
      const sexLabel = row.sex === 'M' ? '남성' : '여성';
      const demoKey = `${sexLabel} ${ageLabel}`;
      
      salesByDemo[demoKey] = (salesByDemo[demoKey] || 0) + row.amount;
    });

    // 차트용 데이터
    const xValues = Object.keys(salesByHour).map(h => HOUR_LABELS[h]);
    const yValues = Object.values(salesByHour);
    
    // [수정] 피크 타임 Top 3 찾기
    const sortedHours = Object.entries(salesByHour)
      .sort(([, a], [, b]) => b - a) // 매출액 내림차순
      .slice(0, 3) // 상위 3개
      .map(([h]) => HOUR_LABELS[h]);

    // [수정] 핵심 고객층 Top 3 찾기
    const sortedDemos = Object.entries(salesByDemo)
      .sort(([, a], [, b]) => b - a) // 매출액 내림차순
      .slice(0, 3) // 상위 3개
      .map(([key]) => key);

    // 상태 업데이트
    setChartData({ x: xValues, y: yValues });
    
    setCategoryInsights({
      peakTimes: sortedHours, // 배열로 저장
      topDemographics: sortedDemos, // 배열로 저장
      totalSales: filtered.reduce((acc, r) => acc + r.amount, 0)
    });

  }, [selectedCategory, fullData]);

  const formatMoney = (v) => Math.round(v).toLocaleString();

  if (isLoading) {
    return <div className="loading-msg">데이터 분석 중...</div>;
  }

  return (
    <div className="category-analysis-container">
      
      {/* (삭제됨: 상단 전체 매출 Top 3 섹션) */}

      {/* 기존에 있던 구분선도 상단 섹션이 없으므로 제거하거나, 헤더와 간격을 위해 유지할 수 있음. 여기서는 깔끔하게 헤더 바로 시작 */}
      
      <div className="analysis-header" style={{ marginTop: '20px' }}>
        <h3>업종별 상세 리포트</h3>
        <p>궁금한 업종을 선택하여 <strong>시간대별 흐름</strong>과 <strong>핵심 타겟</strong>을 확인하세요.</p>
      </div>

      {/* 업종 선택 카드 그리드 */}
      <div className="category-grid">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-card ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            <span className="cat-icon">{CATEGORY_ICONS[cat] || "🍽️"}</span>
            <span className="cat-name">{cat}</span>
          </button>
        ))}
      </div>

      {/* 하단: 상세 분석 영역 */}
      <div className="detail-section">
        {selectedCategory ? (
          <>
            {/* 좌측: 차트 */}
            <div className="chart-box-wrapper">
              <Plot
                data={[
                  {
                    x: chartData.x,
                    y: chartData.y,
                    type: 'scatter',
                    mode: 'lines+markers',
                    marker: { color: '#2ac1bc', size: 8 },
                    line: { color: '#2ac1bc', width: 3, shape: 'spline' },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(42, 193, 188, 0.1)'
                  }
                ]}
                layout={{
                  title: {
                    text: `<b>${selectedCategory}</b> 시간대별 매출 추이`,
                    font: { family: 'Pretendard', size: 18, color: '#333' }
                  },
                  xaxis: { 
                    title: '시간대', 
                    tickangle: -45, 
                    automargin: true 
                  },
                  yaxis: { 
                    title: '매출 (만원)', 
                    tickformat: ',.0f', 
                    automargin: true 
                  },
                  autosize: true,
                  height: 450,
                  margin: { l: 60, r: 30, b: 80, t: 60 },
                  font: { family: 'Pretendard' },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)'
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false }}
              />
            </div>

            {/* [수정] 우측: 분석 인사이트 패널 (Top 3 표시) */}
            <div className="insight-panel">
              <div className="insight-card-header">
                <h4>📊 {selectedCategory} 분석 요약</h4>
              </div>
              <div className="insight-card-body">
                {/* 피크타임 Top 3 */}
                <div className="insight-item">
                  <span className="label">🔥 피크 타임 TOP 3</span>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {categoryInsights?.peakTimes.map((time, idx) => (
                      <div key={idx} style={{ fontSize: '0.95rem', color: '#333' }}>
                        <span style={{ fontWeight: 'bold', color: '#ff6b6b', marginRight: '8px' }}>{idx + 1}위</span>
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 핵심 고객층 Top 3 */}
                <div className="insight-item">
                  <span className="label">🎯 핵심 고객층 TOP 3</span>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {categoryInsights?.topDemographics.map((demo, idx) => (
                      <div key={idx} style={{ fontSize: '0.95rem', color: '#333' }}>
                        <span style={{ fontWeight: 'bold', color: '#2ac1bc', marginRight: '8px' }}>{idx + 1}위</span>
                        {demo}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 총 매출 */}
                <div className="insight-item total">
                  <span className="label">(2024년 1월 1일 ~ 2024년 1월 14일)</span>  
                  <span className="label">분석 기간 총 매출</span>
                  <span className="value">{formatMoney(categoryInsights?.totalSales)}만원</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state-full">
            <p>👆 위에서 분석할 업종 카드를 선택해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryAnalysis;