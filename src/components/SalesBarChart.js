import React, { useState, useEffect, useRef } from 'react'; // useRef는 애니메이션용이었다면 제거 가능하지만 일단 유지
import Plot from 'react-plotly.js';
import { csvParse } from 'd3-dsv';
import './SalesBarChart.css';

const CSV_FILE_PATH = '/suwon_food_weather_2024_01.csv';

const SEX_OPTIONS = { 'F': '여성', 'M': '남성' };
const AGE_OPTIONS = {
  1: '0-9세', 2: '10-19세', 3: '20-29세', 4: '30-39세',
  5: '40-49세', 6: '50-59세', 7: '60-69세', 8: '70-79세', 9: '80세 이상'
};
const DAY_OPTIONS = {
  1: '월요일', 2: '화요일', 3: '수요일', 4: '목요일',
  5: '금요일', 6: '토요일', 7: '일요일'
};
const HOUR_OPTIONS = {
  1: '00-07시 (새벽)', 2: '07-09시 (아침)', 3: '09-11시 (오전)',
  4: '11-14시 (점심)', 5: '14-17시 (오후)', 6: '17-18시 (저녁1)',
  7: '18-20시 (저녁2)', 8: '20-21시 (저녁3)', 9: '21-23시 (밤)',
  10: '23-24시 (심야)'
};

const SalesBarChart = () => {
  // --- State 정의 ---
  const [selectedTemp, setSelectedTemp] = useState(0);
  const [selectedHumidity, setSelectedHumidity] = useState(null);
  const [availableHumidities, setAvailableHumidities] = useState([]);
  
  const [selectedSex, setSelectedSex] = useState('ALL');
  const [selectedAge, setSelectedAge] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('ALL');
  const [selectedHour, setSelectedHour] = useState('ALL');
  
  const [isTempAll, setIsTempAll] = useState(false);
  const [isHumidityAll, setIsHumidityAll] = useState(false);

  const [fullData, setFullData] = useState([]);
  const [chartDisplayData, setChartDisplayData] = useState(null);
  const [insightData, setInsightData] = useState(null); // 인사이트 데이터
  const [isLoading, setIsLoading] = useState(true);

  // 임의의 현재 날씨 데이터
  const currentWeather = {
    temp: 18.5,
    rain: 0,
    humidity: 45,
    status: '맑음 ☀️'
  };

  // --- [신규] JSON 다운로드 핸들러 ---
  const handleDownloadJSON = () => {
    if (!chartDisplayData || chartDisplayData.x.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    // 1. 현재 필터링 조건 정리
    const conditions = {
      temperature: isTempAll ? 'ALL' : selectedTemp,
      humidity: isHumidityAll ? 'ALL' : selectedHumidity,
      hour: selectedHour === 'ALL' ? 'ALL' : HOUR_OPTIONS[selectedHour],
      day: selectedDay === 'ALL' ? 'ALL' : DAY_OPTIONS[selectedDay],
      sex: selectedSex === 'ALL' ? 'ALL' : SEX_OPTIONS[selectedSex],
      age: selectedAge === 'ALL' ? 'ALL' : AGE_OPTIONS[selectedAge]
    };

    // 2. 상위 10개 업종 데이터 추출
    const top10 = chartDisplayData.x.slice(0, 10).map((category, index) => ({
      rank: index + 1,
      category: category,
      amount: chartDisplayData.y[index] // 해당 인덱스의 매출액
    }));

    // 3. 최종 저장할 데이터 객체 생성
    const exportData = {
      title: "배달의민족 타겟광고 시뮬레이션 데이터",
      created_at: new Date().toLocaleString(),
      conditions: conditions,
      top_10_rankings: top10
    };

    // 4. JSON 파일 생성 및 다운로드 트리거
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `target_simulation_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // --- Effect 1: CSV 파일 로드 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_FILE_PATH);
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        const csvText = await response.text();

        const parsedData = csvParse(csvText, (row) => {
          return {
            temp: Math.round(+row.temp),
            humidity: Math.round(+row.humidity),
            category: row.card_tpbuz_nm_2,
            amount: +row.amt / 10000, // 만원 단위
            sex: row.sex,
            age: +row.age,
            day: +row.day,
            hour: +row.hour
          };
        });
        
        setFullData(parsedData);
        setIsLoading(false);
      } catch (error) {
        console.error("CSV 로딩 중 오류 발생:", error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Effect 2: 유효 습도 목록 업데이트 ---
  useEffect(() => {
    if (fullData.length === 0) return;
    let dataForHumidityCalc = fullData;
    if (!isTempAll) {
      dataForHumidityCalc = fullData.filter(row => row.temp === selectedTemp);
    }
    const uniqueHumidities = [...new Set(dataForHumidityCalc.map(row => row.humidity))];
    uniqueHumidities.sort((a, b) => a - b);
    setAvailableHumidities(uniqueHumidities);
    
    if (!isHumidityAll && !uniqueHumidities.includes(selectedHumidity)) {
      setSelectedHumidity(uniqueHumidities[0] || null);
    }
  }, [fullData, selectedTemp, isTempAll, isHumidityAll, selectedHumidity]);

  // --- Effect 3: 차트 데이터 재계산 & 인사이트 ---
  useEffect(() => {
    if (fullData.length === 0 || (!isHumidityAll && selectedHumidity === null)) {
      setChartDisplayData(null);
      setInsightData(null);
      return;
    }
    
    const ageFilter = selectedAge === 'ALL' ? 'ALL' : Number(selectedAge);
    const dayFilter = selectedDay === 'ALL' ? 'ALL' : Number(selectedDay);
    const hourFilter = selectedHour === 'ALL' ? 'ALL' : Number(selectedHour);

    const filteredData = fullData.filter(row => {
      const tempMatch = isTempAll ? true : (row.temp === selectedTemp);
      const humidityMatch = isHumidityAll ? true : (row.humidity === selectedHumidity);
      const sexMatch = (selectedSex === 'ALL') ? true : (row.sex === selectedSex);
      const ageMatch = (ageFilter === 'ALL') ? true : (row.age === ageFilter);
      const dayMatch = (dayFilter === 'ALL') ? true : (row.day === dayFilter);
      const hourMatch = (hourFilter === 'ALL') ? true : (row.hour === hourFilter);
      
      return tempMatch && humidityMatch && sexMatch && ageMatch && dayMatch && hourMatch;
    });

    const salesMap = filteredData.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = 0;
      acc[row.category] += row.amount;
      return acc;
    }, {});
    
    const sortedData = Object.entries(salesMap)
      .sort(([, aAmount], [, bAmount]) => bAmount - aAmount);
      
    // 인사이트 데이터
    if (sortedData.length > 0) {
      const topItem = sortedData[0];
      const bottomItem = sortedData[sortedData.length - 1];
      setInsightData({
        top: { name: topItem[0], value: topItem[1] },
        bottom: { name: bottomItem[0], value: bottomItem[1] }
      });
    } else {
      setInsightData(null);
    }

    const plotlyData = {
      x: sortedData.map(d => d[0]),
      y: sortedData.map(d => d[1]),
    };

    setChartDisplayData(plotlyData);

  }, [fullData, selectedTemp, selectedHumidity, selectedSex, selectedAge, selectedDay, selectedHour, isTempAll, isHumidityAll]);

  // --- 렌더링 로직 ---
  const humidityLabel = isHumidityAll ? "전체" : (selectedHumidity !== null ? `${selectedHumidity}%` : "-");
  const tempLabel = isTempAll ? "전체" : `${selectedTemp}°C`;
  const humiditySliderIndex = availableHumidities.indexOf(selectedHumidity);

  const chartAnnotations = [];
  let chartData = { x: [], y: [] };
  
  if (isLoading) {
    chartAnnotations.push({ text: '데이터 분석 중...', xref: 'paper', yref: 'paper', x: 0.5, y: 0.5, showarrow: false, font: { size: 16, color: '#888' }});
  } else if (chartDisplayData && chartDisplayData.x.length > 0) {
    chartData = chartDisplayData;
  } else {
    chartAnnotations.push({ text: '조건에 맞는 데이터가 없습니다.', xref: 'paper', yref: 'paper', x: 0.5, y: 0.5, showarrow: false, font: { size: 16, color: '#888' }});
  }

  const formatMoney = (value) => Math.round(value).toLocaleString();

  return (
    <div className="baemin-dashboard">
      
      {/* 1. 상단: 현재 날씨 위젯 */}
      <section className="weather-widget-card">
        <div className="widget-header">
          <h4>🌤️ 현재 우리 동네 날씨</h4>
          <span className="update-time">2024.05.20 14:00 기준</span>
        </div>
        <div className="widget-body">
          <div className="weather-item">
            <span className="w-label">기온</span>
            <span className="w-value temp">{currentWeather.temp}°C</span>
          </div>
          <div className="weather-item">
            <span className="w-label">강수량</span>
            <span className="w-value rain">{currentWeather.rain}mm</span>
          </div>
          <div className="weather-item">
            <span className="w-label">습도</span>
            <span className="w-value humidity">{currentWeather.humidity}%</span>
          </div>
          <div className="weather-message">
            "오늘은 <strong>{currentWeather.status}</strong>! 시원한 냉면 주문이 늘어날 것 같아요."
          </div>
        </div>
      </section>

      {/* 2. 중단: 필터 컨트롤 패널 */}
      <section className="control-panel-card">
        <div className="panel-header-row">
          <div className="header-text">
            <h4>📊 맞춤형 매출 분석 조건</h4>
            <p>과거 데이터를 기반으로 최적의 광고 전략을 세워보세요.</p>
          </div>
          {/* [신규] 다운로드 버튼 추가 */}
          <button className="bm-download-btn" onClick={handleDownloadJSON} disabled={isLoading}>
            📥 시뮬레이션 데이터 다운로드
          </button>
        </div>
        
        <div className="panel-body">
          {/* 슬라이더 그룹 */}
          <div className="control-group sliders">
            <div className="control-item">
              <div className="label-row">
                <label>기온 설정</label>
                <div className="value-display">
                  <span className="current-val">{tempLabel}</span>
                  <button 
                    className={`bm-toggle-btn ${isTempAll ? 'active' : ''}`}
                    onClick={() => setIsTempAll(!isTempAll)}
                    disabled={isLoading}
                  >
                    전체
                  </button>
                </div>
              </div>
              <input 
                type="range" min="-13" max="4" 
                value={selectedTemp} 
                onChange={(e) => setSelectedTemp(Number(e.target.value))}
                disabled={isLoading || isTempAll}
                className="bm-slider"
              />
            </div>

            <div className="control-item">
              <div className="label-row">
                <label>습도 설정</label>
                <div className="value-display">
                  <span className="current-val">{humidityLabel}</span>
                  <button 
                    className={`bm-toggle-btn ${isHumidityAll ? 'active' : ''}`}
                    onClick={() => setIsHumidityAll(!isHumidityAll)}
                    disabled={isLoading}
                  >
                    전체
                  </button>
                </div>
              </div>
              <input 
                type="range" min="0" 
                max={availableHumidities.length > 0 ? availableHumidities.length - 1 : 0}
                value={humiditySliderIndex >= 0 ? humiditySliderIndex : 0}
                onChange={(e) => setSelectedHumidity(availableHumidities[+e.target.value])}
                disabled={isLoading || isHumidityAll || availableHumidities.length === 0}
                className="bm-slider"
              />
            </div>
          </div>

          {/* 드롭다운 그룹 */}
          <div className="control-group dropdowns">
            <div className="dropdown-item">
              <label>시간대</label>
              <select value={selectedHour} onChange={(e) => setSelectedHour(e.target.value)} disabled={isLoading} className="bm-select">
                <option value="ALL">전체 시간대</option>
                {Object.entries(HOUR_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="dropdown-item">
              <label>요일</label>
              <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} disabled={isLoading} className="bm-select">
                <option value="ALL">전체 요일</option>
                {Object.entries(DAY_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="dropdown-item">
              <label>성별</label>
              <select value={selectedSex} onChange={(e) => setSelectedSex(e.target.value)} disabled={isLoading} className="bm-select">
                <option value="ALL">전체 성별</option>
                {Object.entries(SEX_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="dropdown-item">
              <label>연령대</label>
              <select value={selectedAge} onChange={(e) => setSelectedAge(e.target.value)} disabled={isLoading} className="bm-select">
                <option value="ALL">전체 연령대</option>
                {Object.entries(AGE_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 하단: 차트 영역 */}
      <section className="chart-section-card">
        <div className="chart-header">
          <h4>업종별 예상 매출액</h4>
        </div>
        <div className="chart-wrapper">
          <Plot
            data={[{
              x: chartData.x,
              y: chartData.y,
              type: 'bar',
              marker: { color: '#2ac1bc' },
              hoverinfo: 'x+y',
            }]}
            layout={{
              xaxis: { title: { text: '업종', font: {size: 12, color: '#666'} }, automargin: true, tickfont: {size: 11} },
              yaxis: { title: { text: '매출액 (만원)', font: {size: 12, color: '#666'} }, autorange: true, tickformat: ',.0f' },
              margin: { l: 60, r: 20, b: 80, t: 20 },
              height: 500,
              autosize: true,
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              annotations: chartAnnotations,
              font: { family: 'Pretendard, sans-serif' }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false }}
          />
        </div>
      </section>

      {/* 4. 하단: 분석 인사이트 영역 */}
      {insightData && (
        <section className="insight-section-card">
          <div className="insight-header">
            <h4>💡 AI 매출 분석 인사이트</h4>
          </div>
          <div className="insight-body">
            <div className="insight-row">
              <span className="insight-label best">🔥 최고 인기 업종</span>
              <p className="insight-text">
                선택하신 조건에서는 <strong>{insightData.top.name}</strong> 업종의 매출이 
                약 <strong>{formatMoney(insightData.top.value)}만원</strong>으로 가장 높습니다.
              </p>
            </div>
            <div className="insight-divider"></div>
            <div className="insight-row">
              <span className="insight-label worst">💧 관심 필요 업종</span>
              <p className="insight-text">
                반면 <strong>{insightData.bottom.name}</strong> 업종은 상대적으로 매출이 낮습니다. 
                해당 시간대에 <strong>{insightData.top.name}</strong> 관련 샵인샵이나 프로모션을 고려해보세요!
              </p>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default SalesBarChart;