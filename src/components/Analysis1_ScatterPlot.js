// src/components/Analysis1_ScatterPlot.js

import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { useDataParsing } from './useDataParsing'; 
import './VisualizationContainer.css'; // 공통 스타일 사용

const Analysis1_ScatterPlot = () => {
    // useDataParsing Hook에서 가공된 월별/지역별 날씨 및 소비 데이터 로드
    const { data, loading, error } = useDataParsing();
    
    // X축으로 사용할 데이터 키를 상태로 관리 (기본값: 평균 기온)
    const [xAxisKey, setXAxisKey] = useState('avgTemp'); 
    
    // X축 레이블 텍스트 매핑
    const xAxisMap = {
        'avgTemp': '월별 평균 기온 (°C)',
        'totalRain': '월별 합계 강수량 (mm)',
        'avgHumidity': '월별 평균 상대습도 (%)',
    };


// 💡 [FIX: Hook Error] useMemo 내부에서 data의 유효성 검사 (null 참조 오류 및 Hook 순서 오류 해결)
    const validData = useMemo(() => {
        // data가 로드되기 전(null)에는 빈 배열을 반환하여 crash 방지
        if (!data) return []; 
        
        // 데이터 유효성 검사 및 필터링: X축과 Y축이 모두 유효한 숫자일 때만 사용
        return data.filter(d => 
            typeof d[xAxisKey] === 'number' && 
            d[xAxisKey] !== null && 
            !isNaN(d[xAxisKey]) &&
            typeof d.totalConsumption === 'number'
        );
    }, [data, xAxisKey]); // data나 X축 키가 바뀔 때마다 다시 계산

        // 1. 로딩, 에러, 데이터 없음 상태 처리
    if (loading) return <div className="chart-container loading">데이터 로딩 중...</div>;
    if (error) return <div className="chart-container error">오류 발생: {error}</div>;
    if (!data || data.length === 0) return <div className="chart-container error">표시할 데이터가 없습니다.</div>;


    // 유효한 데이터가 없을 경우 처리
    if (validData.length === 0) {
        return (
            <div className="chart-container error">
                <h2>1. 날씨 요인과 소비 상관관계 분석</h2>
                <p>선택하신 요인({xAxisMap[xAxisKey]})에 대한 유효한 데이터가 없습니다. 다른 요인을 선택해 보세요.</p>
                {/* Reconfigure 컨트롤은 유효 데이터가 없더라도 표시 */}
                <div className="controls-panel">
                    <label>X축 요인 선택 (Reconfigure): </label>
                    <select 
                        value={xAxisKey} 
                        onChange={(e) => setXAxisKey(e.target.value)}
                        className="select-control"
                    >
                        <option value="avgTemp">월별 평균 기온 (°C)</option>
                        <option value="totalRain">월별 합계 강수량 (mm)</option>
                        <option value="avgHumidity">월별 평균 상대습도 (%)</option>
                    </select>
                </div>
            </div>
        );
    }

    // Plotly 데이터 준비 (X축 키는 xAxisKey 상태에 따라 동적으로 결정됨)
    const plotData = [{
        x: validData.map(d => d[xAxisKey]),
        y: validData.map(d => d.totalConsumption),
        type: 'scatter',
        mode: 'markers',
        name: '소비 데이터',
        
        // 4. Encode 인터랙션: 점의 색상을 계절(월)별로 분류
        marker: {
            size: 8,
            opacity: 0.7,
            color: validData.map(d => { // 💡 [변경] validData 사용
                // 월(month) 추출
                const month = d.yearMonth.substring(5, 7);
                if (month >= '03' && month <= '05') return '#27ae60'; // 봄 (녹색)
                if (month >= '06' && month <= '08') return '#e74c3c'; // 여름 (빨강)
                if (month >= '09' && month <= '11') return '#f39c12'; // 가을 (주황)
                return '#3498db'; // 겨울 (파랑)
            }),
            cbar: { title: '월별 (색상)', thickness: 15 }
        },
        
        // 7. Connect 인터랙션: 툴팁에 다양한 변수를 연결하여 표시
        hovertemplate: 
            `<b>지역:</b> %{customdata[0]}<br>` +
            `<b>기간:</b> %{customdata[1]}<br>` +
            `<b>${xAxisMap[xAxisKey]}:</b> %{x}<br>` +
            `<b>합계 소비:</b> %{y:$,.0f}<extra></extra>`,
        customdata: validData.map(d => [d.station, d.yearMonth])
 
    }];

    return (
        <div className="chart-container analysis-scatter-plot">
            <h2>1. 날씨 요인과 소비 상관관계 분석 (Scatter Plot)</h2>
            <p>X축 요인을 변경하여 소비(Y축)와의 선형 관계를 탐색합니다. (점의 색상은 계절별로 분류됨)</p>

            {/* 3. Reconfigure 인터랙션 구현: X축 요인 변경 */}
            <div className="controls-panel">
                <label>X축 요인 선택 (Reconfigure): </label>
                <select 
                    value={xAxisKey} 
                    onChange={(e) => setXAxisKey(e.target.value)}
                    className="select-control"
                >
                    <option value="avgTemp">월별 평균 기온 (°C)</option>
                    <option value="totalRain">월별 합계 강수량 (mm)</option>
                    <option value="avgHumidity">월별 평균 상대습도 (%)</option>
                </select>
            </div>

            <Plot
                data={plotData}
                layout={{
                    title: `월별 소비 vs ${xAxisMap[xAxisKey]}`,
                    xaxis: { title: xAxisMap[xAxisKey] },
                    yaxis: { title: '월별 지역별 합계 소비 (임의값)', tickformat: '$,.0f' },
                    width: 900, 
                    height: 550,
                    margin: { t: 50, b: 100, l: 100, r: 50 },
                    // 1. Select & 2. Explore 인터랙션을 위한 모드 설정
                    dragmode: 'select', // 드래그로 영역 선택 가능 (1. Select)
                    hovermode: 'closest' // 가장 가까운 점에 툴팁 표시 (2. Explore)
                }}
                config={{ 
                    displayModeBar: true, // Plotly 기본 툴바 표시
                    responsive: true 
                }}
            />
        </div>
    );
};

export default Analysis1_ScatterPlot;
