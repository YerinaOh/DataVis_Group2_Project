import React, { useState } from 'react';
import LoginPage from './LoginPage';
import Main from './Main';
import './components/Admin.css'; // 전체 스타일
import { DataProvider } from './contexts/DataContext';

// src/App.js

// ... (imports 생략)

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // [수정] role 속성 추가 (기본값 null)
  const [userProfile, setUserProfile] = useState({ name: '', team: '', role: null });

  const handleLoginProcess = (inputId) => {
    if (inputId === 'admin') {
      // [수정] role: 'admin' 추가
      setUserProfile({ name: '김민지 사원', team: '전략마케팅 기획팀', role: 'admin' });
    } else {
      // [수정] role: 'sajang' 추가
      setUserProfile({ name: '사장님', team: '수원 왕갈비 통닭 본점', role: 'sajang' });
    }
    setIsLoggedIn(true);
  };

  return (
    <DataProvider>
      <div className="app-root">
        {isLoggedIn ? (
          <Main 
            onLogout={() => setIsLoggedIn(false)} 
            userProfile={userProfile} 
          />
        ) : (
          <LoginPage 
            onLogin={handleLoginProcess} 
          />
        )}
      </div>
    </DataProvider>
  );
}

export default App;