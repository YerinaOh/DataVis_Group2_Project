import React, { useState } from 'react';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import './Admin.css'; // 전체 스타일

function App() {
  // 로그인 상태 관리 (true면 대시보드, false면 로그인화면)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="app-root">
      {isLoggedIn ? (
        <Dashboard onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <LoginPage onLogin={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;