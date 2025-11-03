import React, { useState } from 'react';
import './App.css'; 
import VisualizationContainer from './components/VisualizationContainer';

// 지도 예제는 아직 구현하지 않았으므로, 빈 컴포넌트로 만듭니다.
const MapExample = () => {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>🗺️ 지도 예제 (준비 중)</h2>
            <p>Plotly를 사용하여 지역 특성 분석을 위한 지도 시각화를 구현할 예정입니다.</p>
        </div>
    );
}

function App() {
  // 'menu', 'line', 'map' 중 현재 모드를 저장하는 상태 (State)
  const [mode, setMode] = useState('menu'); 

  // 현재 모드에 따라 보여줄 컴포넌트 결정
  const renderContent = () => {
    if (mode === 'line') {
      return <VisualizationContainer />;
    }
    if (mode === 'map') {
      return <MapExample />;
    }
    
    // mode === 'menu' 일 때 보여줄 메뉴 화면
    return (
      <div className="main-menu">
        <h1>데이터 시각화 프로젝트</h1>
        <p>프로젝트 발표를 위한 시각화 예제를 선택하세요.</p>
        
        {/* 버튼 1: Line Chart 예제 */}
        <button 
          className="menu-button" 
          onClick={() => setMode('line')}
        >
          📈 Line Chart 예제 (월별 기온 추이)
        </button>
        
        {/* 버튼 2: Map Chart 예제 */}
        <button 
          className="menu-button" 
          onClick={() => setMode('map')}
        >
          🗺️ 지도 예제 (지역 데이터 연동)
        </button>
      </div>
    );
  };

  // 홈 버튼 컴포넌트 (언제든지 메뉴로 돌아올 수 있도록)
  const renderHomeButton = () => {
    if (mode !== 'menu') {
      return (
        <button 
          className="home-button" 
          onClick={() => setMode('menu')}
          style={{ position: 'fixed', top: '10px', left: '10px' }}
        >
          🏡 메뉴로 돌아가기
        </button>
      );
    }
    return null;
  };

  return (
    <div className="App">
      {renderHomeButton()}
      {renderContent()}
    </div>
  );
}

export default App;
