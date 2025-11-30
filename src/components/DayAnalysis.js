import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { useData } from '../contexts/DataContext'; 
import './DayAnalysis.css'; 

const DAY_LABELS = [
  { id: 1, label: '월요일' }, { id: 2, label: '화요일' }, { id: 3, label: '수요일' },
  { id: 4, label: '목요일' }, { id: 5, label: '금요일' }, { id: 6, label: '토요일' },
  { id: 7, label: '일요일' }
];

const HOUR_LABELS = {
  1: '00-07시', 2: '07-09시', 3: '09-11시', 4: '11-14시', 5: '14-17시',
  6: '17-18시', 7: '18-20시', 8: '20-21시', 9: '21-23시', 10: '23-24시'
};

const DayAnalysis = () => {
  const { fullData, isDataLoading: isLoading } = useData();

  const [selectedDay, setSelectedDay] = useState(1); 
  const [chartData, setChartData] = useState({ x: [], y: [] });
  const [peakInfo, setPeakInfo] = useState(null); 

  useEffect(() => {
    if (isLoading || fullData.length === 0) return;

    const filtered = fullData.filter(d => d.day === selectedDay);

    const salesByHour = {};
    for (let i = 1; i <= 10; i++) salesByHour[i] = 0; 

    filtered.forEach(row => {
      if (salesByHour[row.hour] !== undefined) {
        salesByHour[row.hour] += row.amount;
      }
    });

    const xValues = Object.keys(salesByHour).map(h => HOUR_LABELS[h]);
    const yValues = Object.values(salesByHour);

    let maxAmount = -1;
    let maxHourKey = -1;
    
    Object.entries(salesByHour).forEach(([h, amt]) => {
      if (amt > maxAmount) {
        maxAmount = amt;
        maxHourKey = parseInt(h);
      }
    });

    setChartData({ x: xValues, y: yValues });
    setPeakInfo({ 
      hourLabel: HOUR_LABELS[maxHourKey], 
      amount: maxAmount,
      hourKey: maxHourKey
    });

  }, [selectedDay, fullData, isLoading]);

  const getMarketingTip = (hourKey) => {
    if (hourKey <= 2) return "🌅 아침 출근길 고객을 위해 모닝 커피/샌드위치 할인을 해보는 건 어떨까요?";
    if (hourKey <= 4) return "🕛 점심 피크입니다! 직장인을 위한 '빠른 점심 세트' 메뉴를 상단에 노출하세요.";
    if (hourKey <= 5) return "☕ 나른한 오후, 달달한 디저트와 음료 할인을 해보는 건 어떨까요?";
    if (hourKey <= 8) return "🍽️ 저녁 식사 시간대입니다. 객단가를 높일 수 있는 가족 세트나 주류 콤보 프로모션이 효과적이에요!";
    return "🌙 야식 주문이 많은 시간입니다! 배달비 할인 이벤트로 심야 고객을 사로잡으세요.";
  };

  if (isLoading) {
    return <div className="loading-msg">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="day-analysis-container">
      <div className="analysis-header">
        <h3>요일별 매출 트렌드 분석</h3>
        <p>요일마다 달라지는 고객들의 주문 패턴을 파악해보세요.</p>
      </div>

      <div className="day-tabs-wrapper">
        <div className="day-tabs">
          {DAY_LABELS.map((day) => (
            <button
              key={day.id}
              className={`day-tab ${selectedDay === day.id ? 'active' : ''}`}
              onClick={() => setSelectedDay(day.id)}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-box">
          <Plot
            data={[
              {
                x: chartData.x,
                y: chartData.y,
                type: 'scatter',
                mode: 'lines+markers',
                marker: { color: '#2ac1bc', size: 10, symbol: 'circle' },
                line: { color: '#2ac1bc', width: 4, shape: 'spline' },
                fill: 'tozeroy',
                fillcolor: 'rgba(42, 193, 188, 0.15)'
              }
            ]}
            layout={{
              title: {
                text: `<b>${DAY_LABELS.find(d => d.id === selectedDay)?.label}</b> 시간대별 매출 추이`,
                font: { family: 'Pretendard', size: 20 }
              },
              xaxis: { 
                title: '시간대 (0~24시)', 
                automargin: true,
                tickangle: -30,
                autorange: true // [추가] X축 자동 범위
              },
              yaxis: { 
                title: '매출액 (만원)', 
                tickformat: ',.0f',
                automargin: true,
                autorange: true // [추가] Y축 높이를 데이터 최댓값에 맞춰 자동 조절
              },
              autosize: true,
              height: 500,
              margin: { l: 60, r: 30, b: 80, t: 60 },
              font: { family: 'Pretendard' },
              
              // 애니메이션 설정
            //   transition: { duration: 500, easing: 'cubic-in-out' },
              
              // [삭제] uirevision: 'true' 제거함 
              // -> 이것을 지워야 요일 변경 시 축이 리셋되어 잘리지 않습니다.
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: true, // true로 변경하거나 이 줄을 삭제하면 됩니다.
              responsive: true }}
          />
        </div>
      </div>

      {peakInfo && (
        <div className="insight-card">
          <div className="insight-icon">💡</div>
          <div className="insight-content">
            <h4>
              {DAY_LABELS.find(d => d.id === selectedDay)?.label}은 
              <span className="highlight"> {peakInfo.hourLabel}</span>에 가장 붐벼요!
            </h4>
            <p className="tip-text">
              {getMarketingTip(peakInfo.hourKey)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayAnalysis;