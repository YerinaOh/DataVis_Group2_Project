import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { csvParse } from 'd3-dsv';
import './SalesBarChart.css';

const CSV_FILE_PATH = '/suwon_food_weather_2024_01.csv';

// --- [신규] 필터 옵션 상수 정의 ---
// 'ALL'은 문자열이지만, age/day의 value는 숫자형 문자열임에 유의 ('1', '2'...)
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
  
  // [신규] 3개의 필터 state 추가 (기본값 'ALL')
  const [selectedSex, setSelectedSex] = useState('ALL');
  const [selectedAge, setSelectedAge] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState('ALL');

  const [fullData, setFullData] = useState([]); // CSV 전체 원본 데이터
  const [chartDisplayData, setChartDisplayData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Effect 1: 최초 마운트 시 CSV 파일 로드 ---
  // (수정됨: sex, age, day도 파싱 시 타입 변환)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_FILE_PATH);
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        const csvText = await response.text();

        const parsedData = csvParse(csvText, (row) => {
          return {
            temp: Math.round(+row.temp),
            humidity: Math.round(+row.humidity),
            category: row.card_tpbuz_nm_2,
            amount: +row.amt / 10000, // '만원' 단위
            sex: row.sex,    // [추가] 'F' or 'M'
            age: +row.age,     // [추가] 1 ~ 9 (숫자)
            day: +row.day      // [추가] 1 ~ 7 (숫자)
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
  }, []); // 1회만 실행

  // --- Effect 2: 기온 변경 시, 유효한 습도 목록 업데이트 ---
  // (이전과 동일. 습도는 기온에만 종속됨)
  useEffect(() => {
    if (fullData.length === 0) return;

    const dataForTemp = fullData.filter(row => row.temp === selectedTemp);
    const uniqueHumidities = [...new Set(dataForTemp.map(row => row.humidity))];
    uniqueHumidities.sort((a, b) => a - b);

    setAvailableHumidities(uniqueHumidities);

    if (!uniqueHumidities.includes(selectedHumidity)) {
      setSelectedHumidity(uniqueHumidities[0] || null);
    }
  }, [fullData, selectedTemp]);

  // --- Effect 3: 5개 필터 중 하나라도 변경되면 차트 데이터 재계산 ---
  useEffect(() => {
    if (fullData.length === 0 || selectedHumidity === null) {
      setChartDisplayData(null);
      return;
    }
    
    // selectedAge, selectedDay는 select box에서 문자열('1', '2'..)로 오므로 숫자로 변환
    const ageFilter = selectedAge === 'ALL' ? 'ALL' : Number(selectedAge);
    const dayFilter = selectedDay === 'ALL' ? 'ALL' : Number(selectedDay);

    // [수정됨] 5개 조건으로 동시 필터링
    const filteredData = fullData.filter(row => {
      // 'ALL'일 경우 true를 반환하여 필터를 통과시킴
      const tempMatch = row.temp === selectedTemp;
      const humidityMatch = row.humidity === selectedHumidity;
      const sexMatch = (selectedSex === 'ALL') ? true : (row.sex === selectedSex);
      const ageMatch = (ageFilter === 'ALL') ? true : (row.age === ageFilter);
      const dayMatch = (dayFilter === 'ALL') ? true : (row.day === dayFilter);
      
      return tempMatch && humidityMatch && sexMatch && ageMatch && dayMatch;
    });

    // 업종별 집계
    const salesMap = filteredData.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = 0;
      acc[row.category] += row.amount;
      return acc;
    }, {});

    const sortedData = Object.entries(salesMap)
      .sort(([, aAmount], [, bAmount]) => bAmount - aAmount);

    const plotlyData = {
      x: sortedData.map(d => d[0]),
      y: sortedData.map(d => d[1]),
    };

    setChartDisplayData(plotlyData);

  }, [fullData, selectedTemp, selectedHumidity, selectedSex, selectedAge, selectedDay]); // [수정] 5개 의존성

  // --- 렌더링 ---

  // 차트 제목 및 습도 라벨 생성
  const humidityLabel = selectedHumidity !== null ? `${selectedHumidity}%` : "N/A";
  const humiditySliderIndex = availableHumidities.indexOf(selectedHumidity);
  
  const getChartTitle = () => {
    const sexText = selectedSex === 'ALL' ? '' : `, ${SEX_OPTIONS[selectedSex]}`;
    const ageText = selectedAge === 'ALL' ? '' : `, ${AGE_OPTIONS[selectedAge]}`;
    const dayText = selectedDay === 'ALL' ? '' : `, ${DAY_OPTIONS[selectedDay]}`;
    return `기온 ${selectedTemp}°C, 습도 ${humidityLabel}${sexText}${ageText}${dayText} 기준 매출액`;
  };

  if (isLoading) {
    return <div className="loading-message">데이터 로딩 중... (40MB CSV 파일 최초 파싱 중)</div>;
  }

  return (
    <div className="main-container">
      <h2>🐬수원 지역의 날씨에 따른 업종별 소비량 비교🐬</h2>
      <p>데이터시각화 2조 - Final Project</p>

      {/* 차트 컨테이너 */}
      <div className="chart-container">
        {chartDisplayData && chartDisplayData.x.length > 0 ? (
          <Plot
            data={[
              {
                x: chartDisplayData.x,
                y: chartDisplayData.y,
                type: 'bar',
                marker: { color: 'rgb(55, 128, 191)' },
              },
            ]}
            layout={{
              title: getChartTitle(), // 동적 제목
              xaxis: { title: '업종', automargin: true },
              yaxis: { title: '매출액 (만원)', autorange: true, tickformat: ',.0f' },
              width: 1000,
              height: 600,
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ responsive: true }}
          />
        ) : (
          <div className="loading-message">
            {isLoading ? '데이터 처리 중...' : '선택한 조건에 해당하는 데이터가 없습니다.'}
          </div>
        )}
      </div>

      {/* 1. 기온 슬라이더 */}
      <div className="slider-container">
        <label htmlFor="temp-slider">기온 선택: {selectedTemp}°C</label>
        <input
          type="range" id="temp-slider" min="-13" max="4"
          value={selectedTemp}
          onChange={(e) => setSelectedTemp(Number(e.target.value))}
          className="slider"
        />
      </div>

      {/* 2. 습도 슬라이더 */}
      <div className="slider-container">
        <label htmlFor="humidity-slider">습도 선택: {humidityLabel}</label>
        <input
          type="range" id="humidity-slider"
          min="0"
          max={availableHumidities.length > 0 ? availableHumidities.length - 1 : 0}
          value={humiditySliderIndex >= 0 ? humiditySliderIndex : 0}
          onChange={(e) => setSelectedHumidity(availableHumidities[+e.target.value])}
          className="slider"
          disabled={availableHumidities.length === 0}
        />
      </div>

      {/* 3. [신규] 필터 선택 상자 컨테이너 */}
      <div className="filter-container">
        {/* 성별 필터 */}
        <div className="filter-item">
          <label htmlFor="sex-filter">성별</label>
          <select id="sex-filter" className="filter-select" value={selectedSex} onChange={(e) => setSelectedSex(e.target.value)}>
            <option value="ALL">전체 성별</option>
            {/* Object.entries(SEX_OPTIONS) -> [['F', '여성'], ['M', '남성']] */}
            {Object.entries(SEX_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* 연령대 필터 */}
        <div className="filter-item">
          <label htmlFor="age-filter">연령대</label>
          <select id="age-filter" className="filter-select" value={selectedAge} onChange={(e) => setSelectedAge(e.target.value)}>
            <option value="ALL">전체 연령대</option>
            {Object.entries(AGE_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* 요일 필터 */}
        <div className="filter-item">
          <label htmlFor="day-filter">요일</label>
          <select id="day-filter" className="filter-select" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
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