import React from 'react';
import Plot from 'react-plotly.js';
import { useDataParsing } from './useDataParsing'; // 데이터 로직 가져오기
import './VisualizationContainer.css';

const VisualizationContainer = () => {
  const { data, loading, error } = useDataParsing(); // 데이터 로드 시작

  if (loading) {
    return <div>데이터 로딩 중입니다...</div>;
  }

  if (error) {
    return <div>데이터 로드 오류: {error}</div>;
  }

  // 데이터가 없을 때의 처리
  if (!data || data.length === 0) {
    return <div>표시할 데이터가 없습니다.</div>;
  }

    // Plotly가 사용할 수 있도록 데이터 가공
  // 일시(X축)와 평균기온(Y축)을 추출하여 라인 차트 생성
  const dates = data.map(d => d['일시']);
  const avgTemps = data.map(d => d['평균기온(°C)']);

  // 💡 핵심: 지점별로 데이터를 그룹화하여 Plotly trace 배열 생성
  const getTracesByStation = (data) => {
        // 1. 지점별로 데이터 그룹화
        const groupedData = data.reduce((acc, curr) => {
            if (!acc[curr.station]) {
                acc[curr.station] = [];
            }
            acc[curr.station].push(curr);
            return acc;
        }, {});

        // 2. 각 지점 그룹을 Plotly trace(선) 객체로 변환
        return Object.keys(groupedData).map(stationName => {
            const stationData = groupedData[stationName];
            
            // 월별로 정렬 (시간 순서 보장)
            stationData.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)); 

            return {
                x: stationData.map(d => d.yearMonth), // X축: 년월
                y: stationData.map(d => d.avgTemp),  // Y축: 월별 평균 기온
                type: 'scatter',
                mode: 'lines',
                name: stationName, // 범례: 지점명
                hovertemplate: `%{x}<br>평균 기온: %{y:.1f}°C<extra>${stationName}</extra>` // 툴팁 커스터마이징
            };
        });
  };

  const traces = getTracesByStation(data);

  return (
<div className="visualization-container">
            <h2>지역 특성과 소비 패턴 분석 시각화: 월별 기온 추이</h2>
            <p>데이터가 월별 평균으로 요약되어, **각 지점별 추이 (총 {traces.length}개 선)**를 명확히 보여줍니다.</p>
            
            <Plot
                data={traces} // 💡 수정된 부분: 지점별 trace 배열 사용
                layout={{ 
                    title: '지점별 월평균 기온 변화 (10년)',
                    width: 1000, 
                    height: 600, 
                    // 💡 개선된 축 설정
                    xaxis: { 
                        title: '일시 (년-월)', 
                        type: 'category',
                        tickmode: 'array',
                        tickvals: traces[0]?.x.filter((_, i) => i % 12 === 0), // 매년 1월 데이터에만 레이블 표시
                        ticktext: traces[0]?.x.filter((_, i) => i % 12 === 0).map(d => d.substring(0, 4)) // 년도만 표시
                    },
                    yaxis: { 
                        title: '월평균 기온 (°C)' 
                    },
                    hovermode: 'x unified', // 같은 X축 값에 대한 모든 선의 정보를 한 번에 표시
                    legend: { orientation: 'h', y: -0.2 } // 범례를 하단에 수평으로 배치
                }}
            />
        </div>
  );
};

export default VisualizationContainer;