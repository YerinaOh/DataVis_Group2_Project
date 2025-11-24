import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import SalesBarChart from './components/SalesBarChart'; // 기온별 분석
import CategoryAnalysis from './components/CategoryAnalysis'; // 카테고리별 분석
import DayAnalysis from './components/DayAnalysis'; // 시간대별 분석
import AdSimulation from './components/AdSimulation'; // 타겟광고 시뮬레이션

const MENU_ITEMS = [
  { id: 'dashboard', label: '대시보드', icon: '🏠' },
  { id: 'analysis', label: '매출 분석', icon: '📊' },
  { id: 'ad-manage', label: '광고 관리', icon: '📢' },
  { id: 'simulation', label: '타겟광고 시뮬레이션', icon: '📱' }, 
];

const Main = ({ onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard'); 
  // [신규] 매출 분석 내부의 탭 상태 관리 ('temp' | 'category' | 'day')
  const [analysisTab, setAnalysisTab] = useState('temp'); 

  // 메뉴 및 탭에 따른 콘텐츠 렌더링 함수
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'analysis':
        // 매출 분석 메뉴일 때, 내부 탭 상태에 따라 분기
        switch (analysisTab) {
          case 'temp':
            return <SalesBarChart />;
          case 'category':
            return <CategoryAnalysis />;
          case 'day':
            return <DayAnalysis />;
          default:
            return <SalesBarChart />;
        }
      case 'simulation': 
        return <AdSimulation />;
      default:
        return (
          <div className="placeholder-content">
            <p>준비 중인 페이지입니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      {/* 사이드바 (기존 동일) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="baemin-logo-white">배달의민족</h2>
          <span className="admin-sub">Admin</span>
        </div>
        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu(item.id);
                // 메뉴 이동 시 분석 탭을 기본값(기온)으로 초기화하고 싶다면 아래 주석 해제
                // if (item.id === 'analysis') setAnalysisTab('temp');
              }}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button onClick={onLogout} className="logout-button">로그아웃</button>
        </div>
      </aside>

      {/* 메인 영역 */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title">
            <h3>{MENU_ITEMS.find(m => m.id === activeMenu).label}</h3>
          </div>
          <div className="user-profile">
            <span className="shop-name">김민지 사원</span>
            <span className="user-name">전략마케팅 기획팀</span>
          </div>
        </header>

        <div className="content-wrapper">
          {/* 상단 탭 버튼은 '매출 분석' 메뉴일 때만 노출 */}
          <div className="content-filter-bar">
            {activeMenu === 'analysis' && (
               <>
                <button 
                  className={`tab-button ${analysisTab === 'temp' ? 'active' : ''}`}
                  onClick={() => setAnalysisTab('temp')}
                >
                  기온별 분석
                </button>
                <button 
                  className={`tab-button ${analysisTab === 'category' ? 'active' : ''}`}
                  onClick={() => setAnalysisTab('category')}
                >
                  카테고리별 분석
                </button>
                <button 
                  className={`tab-button ${analysisTab === 'day' ? 'active' : ''}`}
                  onClick={() => setAnalysisTab('day')}
                >
                  요일별 분석
                </button>
               </>
            )}
          </div>

          {/* 실제 콘텐츠 영역 */}
          <div className="chart-card-wrapper">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Main;