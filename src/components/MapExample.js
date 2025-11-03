import React from 'react';
import Plot from 'react-plotly.js';

// 💡 임의의 지점 좌표 및 시각화 데이터 (가장 심플한 지도 예제)
const simpleMapData = [
  {
    name: "서울",
    lat: 37.5665,
    lon: 126.9780,
    value: 28.5, // 8월 평균 기온 (임의 값)
    text: "서울: 8월 평균 기온 28.5°C"
  },
  {
    name: "부산",
    lat: 35.1796,
    lon: 129.0756,
    value: 30.1, // 8월 평균 기온
    text: "부산: 8월 평균 기온 30.1°C"
  },
  {
    name: "속초",
    lat: 38.2045,
    lon: 128.5645,
    value: 26.8, // 8월 평균 기온
    text: "속초: 8월 평균 기온 26.8°C"
  },
  {
    name: "남해",
    lat: 34.7876,
    lon: 127.9946,
    value: 29.5, // 8월 평균 기온
    text: "남해: 8월 평균 기온 29.5°C"
  },
];


const MapExample = () => {
    // 1. Plotly가 요구하는 X, Y (경도, 위도) 배열 추출
    const lons = simpleMapData.map(d => d.lon);
    const lats = simpleMapData.map(d => d.lat);
    const values = simpleMapData.map(d => d.value);
    const texts = simpleMapData.map(d => d.text);

    return (
        <div className="visualization-container">
            <h2>🗺️ 지도 예제: 지점별 기온 비교 (8월 기준 임의 데이터)</h2>
            <p>Plotly의 Scattermapbox를 이용하여 지리적 위치와 데이터를 연동합니다. (지점명/기온을 카드 소비 데이터로 대체 가능)</p>

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
                            size: values.map(v => v * 2), // 💡 기온 값에 따라 마커 크기 변경 (심플한 시각화 인코딩)
                            color: values, // 💡 기온 값에 따라 마커 색상 변경
                            colorscale: 'YlOrRd', // 노란색-주황색-빨간색 스케일 적용 (고온일수록 빨간색)
                            cmin: 25, 
                            cmax: 32, // 색상 범위 설정
                            showscale: true, // 범례 표시
                            colorbar: { title: '8월 평균 기온 (°C)' }
                        },
                    }
                ]}
                layout={{
                    title: '주요 지점의 기온 분포',
                    width: 1000, 
                    height: 600,
                    hovermode: 'closest', // 마우스가 가장 가까운 마커에 반응하도록 설정
                    mapbox: {
                        style: 'open-street-map', // 심플한 지도 스타일 선택
                        center: { lat: 36.5, lon: 127.8 }, // 지도의 중심 (한반도 중앙)
                        zoom: 5.5 // 지도 확대 레벨
                    },
                    margin: { r: 0, t: 30, b: 0, l: 0 } // 여백 제거
                }}
            />
        </div>
    );
};

export default MapExample;