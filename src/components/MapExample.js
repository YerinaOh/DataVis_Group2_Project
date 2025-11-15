// src/components/MapExample.js

import React from 'react';
import Plot from 'react-plotly.js';
// Note: useDataParsing Hook을 사용하지 않는 하드코딩된 예제 컴포넌트입니다.

// 💡 [수정] 수원 포커싱을 위한 상수 정의
const SUWON_COORDS = { lat: 37.2636, lon: 127.0286 };
const INITIAL_ZOOM = 10; // 도시 단위 포커싱에 적합한 줌 레벨

// 💡 [수정] 수원 주변의 임의 지점 데이터로 변경
const suwonMapData = [
  {
    name: "수원",
    lat: 37.2636,
    lon: 127.0286,
    value: 350000, // 임의 소비 데이터
    text: "수원: 총 소비 350,000"
  },
  {
    name: "화성",
    lat: 37.1996,
    lon: 126.8310,
    value: 200000, 
    text: "화성: 총 소비 200,000"
  },
  {
    name: "용인",
    lat: 37.2412,
    lon: 127.1775,
    value: 300000, 
    text: "용인: 총 소비 300,000"
  },
];


const MapExample = () => {
    // 1. Plotly가 요구하는 X, Y (경도, 위도) 배열 추출
    const lons = suwonMapData.map(d => d.lon);
    const lats = suwonMapData.map(d => d.lat);
    const values = suwonMapData.map(d => d.value);
    const texts = suwonMapData.map(d => d.text);

    return (
        <div className="visualization-container">
            <h2>🗺️ 지도 예제: 수원 지역 포커싱 분석</h2>
            <p>Plotly의 Scattermapbox를 이용하여 수원 지역을 중심으로 시각화합니다. (줌 레벨 {INITIAL_ZOOM})</p>

            <Plot
                data={[
                    {
                        // 맵박스 지도 위에 점(Scatter)을 표시합니다.
                        type: 'scattermapbox',
                        lon: lons,
                        lat: lats,
                        text: texts, // 마우스를 올렸을 때 표시될 텍스트
                        mode: 'markers', // 마커만 표시
                        marker: {
                            size: values.map(v => Math.sqrt(v) / 10), // 💡 값에 따라 마커 크기 조정
                            color: values, // 💡 값에 따라 마커 색상 변경
                            colorscale: 'Viridis', 
                            showscale: true,
                            colorbar: { title: '지역 소비액' }
                        },
                    }
                ]}
                layout={{
                    title: '수원 및 인근 지역 소비 분포',
                    width: 900, 
                    height: 550,
                    hovermode: 'closest', 
                    mapbox: {
                        style: 'open-street-map', // 심플한 지도 스타일 선택
                        // 💡 [핵심 수정] 지도의 중심을 수원으로 설정
                        center: { 
                            lat: SUWON_COORDS.lat, 
                            lon: SUWON_COORDS.lon 
                        }, 
                        // 💡 [핵심 수정] 줌 레벨을 10으로 설정하여 수원 지역 확대
                        zoom: INITIAL_ZOOM 
                    },
                    margin: { r: 0, t: 30, b: 0, l: 0 } // 여백 제거
                }}
                config={{
                    displayModeBar: true,
                    responsive: true
                }}
            />
        </div>
    );
};

export default MapExample;