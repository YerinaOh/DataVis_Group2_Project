import React, { useState } from 'react';
import SalesBarChart from './components/SalesBarChart'; // 기존 차트 컴포넌트 임포트

const MENU_ITEMS = [
  { id: 'dashboard', label: '대시보드', icon: '🏠' },
  { id: 'analysis', label: '매출 분석', icon: '📊' }, // 현재 활성화될 메뉴
  { id: 'ad-manage', label: '광고 관리', icon: '📢' },
];

const Dashboard = ({ onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('analysis'); // 기본값: 매출 분석

  return (
    <div className="dashboard-container">
      {/* 1. 사이드바 (Left Navigation) */}
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

      {/* 2. 메인 영역 */}
      <main className="main-content">
        {/* 헤더 */}
        <header className="top-header">
          <div className="header-title">
            <h3>{MENU_ITEMS.find(m => m.id === activeMenu).label}</h3>
          </div>
          <div className="user-profile">
            <span className="shop-name">김민지 대리님(접속중)</span>
            <span className="user-name">전략 마케팅 기획</span>
          </div>
        </header>

        {/* 콘텐츠 영역 */}
        <div className="content-wrapper">
          {/* 탭이나 필터가 들어갈 수 있는 상단 영역 */}
          <div className="content-filter-bar">
            <button className="tab-button active">기온별 분석</button>
            <button className="tab-button">시간대별 분석</button>
            <button className="tab-button">요일별 분석</button>
          </div>

          {/* 실제 차트 컴포넌트 렌더링 */}
          <div className="chart-card-wrapper">
            {activeMenu === 'analysis' ? (
              <SalesBarChart /> 
            ) : (
              <div className="placeholder-content">
                <p>준비 중인 페이지입니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;