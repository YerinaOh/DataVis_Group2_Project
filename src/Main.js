import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import SalesBarChart from './components/SalesBarChart';
import AdSimulation from './components/AdSimulation'; // [신규] 임포트

const MENU_ITEMS = [
  { id: 'dashboard', label: '대시보드', icon: '🏠' },
  { id: 'analysis', label: '매출 분석', icon: '📊' },
  { id: 'ad-manage', label: '광고 관리', icon: '📢' },
  { id: 'simulation', label: '타겟광고 시뮬레이션', icon: '📱' }, 
];

const Main = ({ onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard'); 

  // 메뉴에 따른 콘텐츠 렌더링 함수
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'analysis':
        return <SalesBarChart />;
      case 'simulation': // [신규]
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
              onClick={() => setActiveMenu(item.id)}
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
          {/* 상단 탭 버튼은 '매출 분석'에서만 보여주거나 공통으로 둘 수 있음 (여기선 유지) */}
          <div className="content-filter-bar">
            {activeMenu === 'analysis' && (
               <>
                <button className="tab-button active">기온별 분석</button>
                <button className="tab-button">카테고리별 분석</button>
                <button className="tab-button">요일별 분석</button>
               </>
            )}
          </div>

          <div className="chart-card-wrapper">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Main;