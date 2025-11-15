import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { csvParse } from 'd3-dsv';
import './SalesBarChart.css';

const CSV_FILE_PATH = '/suwon_food_weather_2024_01.csv';

// 상수 정의 (변경 없음)
const SEX_OPTIONS = { 'F': '여성', 'M': '남성' };
const AGE_OPTIONS = {
  1: '0-9세', 2: '10-19세', 3: '20-29세', 4: '30-39세',
  5: '40-49세', 6: '50-59세', 7: '60-69세', 8: '70-79세', 9: '80세 이상'
};
const DAY_OPTIONS = {
  1: '월요일', 2: '화요일', 3: '수요일', 4: '목요일',
  5: '금요일', 6: '토요일', 7: '일요일'
};

const SalesBarChart = () => {
  // --- State 정의 ---
  const [selectedTemp, setSelectedTemp] = useState(0);
  const [selectedHumidity, setSelectedHumidity] = useState(null);
  const [availableHumidities, setAvailableHumidities] = useState([]);
  const [selectedSex, setSelectedSex] = useState('ALL');
  const [selectedAge, setSelectedAge] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('ALL');
  
  // [신규] '전체' 토글 상태
  const [isTempAll, setIsTempAll] = useState(false);
  const [isHumidityAll, setIsHumidityAll] = useState(false);

  const [fullData, setFullData] = useState([]);
  const [chartDisplayData, setChartDisplayData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const chartRevision = useRef(0);

  // --- Effect 1: CSV 파일 로드 (변경 없음) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_FILE_PATH);
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        const csvText = await response.text();
        const parsedData = csvParse(csvText, (row) => ({
          temp: Math.round(+row.temp),
          humidity: Math.round(+row.humidity),
          category: row.card_tpbuz_nm_2,
          amount: +(row.amt / 10000),
          sex: row.sex,
          age: +row.age,
          day: +row.day
        }));
        setFullData(parsedData);
        setIsLoading(false);
      } catch (error) {
        console.error("CSV 로딩 중 오류 발생:", error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Effect 2: 유효한 습도 목록 업데이트 ([수정] isTempAll 로직 추가) ---
  useEffect(() => {
    if (fullData.length === 0) return;

    let dataForHumidityCalc = fullData;

    // [수정] '기온 전체'가 아닐 때만 기온으로 필터링
    if (!isTempAll) {
      dataForHumidityCalc = fullData.filter(row => row.temp === selectedTemp);
    }
    
    const uniqueHumidities = [...new Set(dataForHumidityCalc.map(row => row.humidity))];
    uniqueHumidities.sort((a, b) => a - b);
    setAvailableHumidities(uniqueHumidities);

    // [수정] '습도 전체'가 아니고, 현재 습도가 목록에 없으면 리셋
    if (!isHumidityAll && !uniqueHumidities.includes(selectedHumidity)) {
      setSelectedHumidity(uniqueHumidities[0] || null);
    }
  }, [fullData, selectedTemp, isTempAll, isHumidityAll, selectedHumidity]); // 의존성 추가

  // --- Effect 3: 차트 데이터 재계산 ([수정] isTempAll, isHumidityAll 로직 추가) ---
  useEffect(() => {
    if (fullData.length === 0 || (!isHumidityAll && selectedHumidity === null)) {
      setChartDisplayData(null);
      return;
    }
    
    const ageFilter = selectedAge === 'ALL' ? 'ALL' : Number(selectedAge);
    const dayFilter = selectedDay === 'ALL' ? 'ALL' : Number(selectedDay);

    const filteredData = fullData.filter(row => {
      // [수정] '전체' 토글이 켜져 있으면 항상 true, 아니면 기존 조건 검사
      const tempMatch = isTempAll ? true : (row.temp === selectedTemp);
      const humidityMatch = isHumidityAll ? true : (row.humidity === selectedHumidity);
      
      const sexMatch = (selectedSex === 'ALL') ? true : (row.sex === selectedSex);
      const ageMatch = (ageFilter === 'ALL') ? true : (row.age === ageFilter);
      const dayMatch = (dayFilter === 'ALL') ? true : (row.day === dayFilter);
      
      return tempMatch && humidityMatch && sexMatch && ageMatch && dayMatch;
    });

    // 업종별 집계 (변경 없음)
    const salesMap = filteredData.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = 0;
      acc[row.category] += row.amount;
      return acc;
    }, {});
    const sortedData = Object.entries(salesMap).sort(([, aAmount], [, bAmount]) => bAmount - aAmount);
    const plotlyData = {
      x: sortedData.map(d => d[0]),
      y: sortedData.map(d => d[1]),
    };

    setChartDisplayData(plotlyData);
    chartRevision.current++; 

  }, [fullData, selectedTemp, selectedHumidity, selectedSex, selectedAge, selectedDay, isTempAll, isHumidityAll]); // [수정] 의존성 2개 추가

  // --- 렌더링 ---
  const humidityLabel = isHumidityAll ? "전체 습도" : (selectedHumidity !== null ? `${selectedHumidity}%` : "N/A");
  const tempLabel = isTempAll ? "전체 기온" : `${selectedTemp}°C`;
  const humiditySliderIndex = availableHumidities.indexOf(selectedHumidity);
  
  const getChartTitle = () => {
    const sexText = selectedSex === 'ALL' ? '' : `, ${SEX_OPTIONS[selectedSex]}`;
    const ageText = selectedAge === 'ALL' ? '' : `, ${AGE_OPTIONS[selectedAge]}`;
    const dayText = selectedDay === 'ALL' ? '' : `, ${DAY_OPTIONS[selectedDay]}`;
    return `기온 ${tempLabel}, 습도 ${humidityLabel}${sexText}${ageText}${dayText} 기준 매출액`;
  };

  // [수정] 렌더링 시점에 Plotly에 보낼 '주석(Annotation)'을 계산
  const chartAnnotations = [];
  let chartData = { x: [], y: [] }; // 기본값은 빈 차트

  if (isLoading) {
    // 최초 로딩 시
    chartAnnotations.push({
      text: '데이터 로딩 중... (40MB CSV 파일 최초 파싱 중)',
      xref: 'paper', yref: 'paper',
      x: 0.5, y: 0.5, showarrow: false,
      font: { size: 16, color: '#555' }
    });
  } else if (chartDisplayData && chartDisplayData.x.length > 0) {
    // 데이터가 정상적으로 있을 때
    chartData = chartDisplayData;
    // annotations는 빈 배열([]) 그대로 둠
  } else {
    // 데이터 로드는 끝났으나, 필터 결과 데이터가 없을 때
    chartAnnotations.push({
      text: '선택한 조건에 해당하는 데이터가 없습니다.',
      xref: 'paper', yref: 'paper',
      x: 0.5, y: 0.5, showarrow: false,
      font: { size: 16, color: '#555' }
    });
  }

  // [수정] 렌더링 순서 및 Plotly 컴포넌트 로직 변경
  return (
    <div className="main-container">
        <h2>🐬수원 지역의 날씨에 따른 업종별 소비량 비교🐬</h2>
        <p>데이터시각화 2조 - Final Project</p>
      {/* 1. 차트 컨테이너 */}
      <div className="chart-container">
        {/* [중요 수정]
          이제 <Plot> 컴포넌트를 조건부로 숨기지 않고 항상 렌더링합니다.
          데이터가 없으면 'chartData'는 {x: [], y: []}가 되고,
          'chartAnnotations'가 "데이터 없음" 메시지를 차트 내부에 표시합니다.
        */}
        <Plot
          data={[
            {
              x: chartData.x,
              y: chartData.y,
              type: 'bar',
              marker: { color: 'rgb(55, 128, 191)' },
            },
          ]}
          layout={{
              title: getChartTitle(),
              xaxis: { 
                title: { text: '업종' }, 
                automargin: true, // x축 자동 여백
                autorange: true 
              },
              yaxis: { 
                title: { text: '매출액 (만원)' }, 
                automargin: true, // y축 자동 여백
                autorange: true, 
                tickformat: ',.0f' 
              },
              height: 600,
              // transition: {
              //   duration: 500,
              //   easing: 'cubic-in-out'
              // },
              uirevision: 'true',
              annotations: chartAnnotations
            }}
          revision={chartRevision.current} 
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{ 
            responsive: true
          }}
        />
      </div>

      {/* 2. 기온 슬라이더 (변경 없음) */}
      <div className="slider-container">
        <label htmlFor="temp-slider">
          <span className="slider-label-text">기온 선택: {tempLabel}</span>
          <button 
            className={`toggle-all-button ${isTempAll ? 'active' : ''}`}
            onClick={() => setIsTempAll(prev => !prev)}
            disabled={isLoading} // [수정] 로딩 중에는 비활성화
          >
            {isTempAll ? '기온 선택' : '전체'}
          </button>
        </label>
        <input
          type="range" id="temp-slider" min="-13" max="4"
          value={selectedTemp}
          onChange={(e) => setSelectedTemp(Number(e.target.value))}
          className="slider"
          disabled={isLoading || isTempAll} // [수정] 로딩 중이거나 '전체'일 때
        />
      </div>

      {/* 3. 습도 슬라이더 (변경 없음) */}
      <div className="slider-container">
        <label htmlFor="humidity-slider">
          <span className="slider-label-text">습도 선택: {humidityLabel}</span>
          <button 
            className={`toggle-all-button ${isHumidityAll ? 'active' : ''}`}
            onClick={() => setIsHumidityAll(prev => !prev)}
            disabled={isLoading} // [수정] 로딩 중에는 비활성화
          >
            {isHumidityAll ? '습도 선택' : '전체'}
          </button>
        </label>
        <input
          type="range" id="humidity-slider"
          min="0"
          max={availableHumidities.length > 0 ? availableHumidities.length - 1 : 0}
          value={humiditySliderIndex >= 0 ? humiditySliderIndex : 0}
          onChange={(e) => setSelectedHumidity(availableHumidities[+e.target.value])}
          className="slider"
          disabled={isLoading || isHumidityAll || availableHumidities.length === 0} // [수정]
        />
      </div>

      {/* 4. 필터 선택 상자 컨테이너 (변경 없음) */}
      <div className="filter-container">
        {/* 성별 필터 */}
        <div className="filter-item">
          <label htmlFor="sex-filter">성별</label>
          <select id="sex-filter" className="filter-select" value={selectedSex} onChange={(e) => setSelectedSex(e.target.value)} disabled={isLoading}>
            <option value="ALL">전체 성별</option>
            {Object.entries(SEX_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {/* 연령대 필터 */}
        <div className="filter-item">
          <label htmlFor="age-filter">연령대</label>
          <select id="age-filter" className="filter-select" value={selectedAge} onChange={(e) => setSelectedAge(e.target.value)} disabled={isLoading}>
            <option value="ALL">전체 연령대</option>
            {Object.entries(AGE_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {/* 요일 필터 */}
        <div className="filter-item">
          <label htmlFor="day-filter">요일</label>
          <select id="day-filter" className="filter-select" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} disabled={isLoading}>
            <option value="ALL">전체 요일</option>
            {Object.entries(DAY_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

    </div>
  );
};

export default SalesBarChart;