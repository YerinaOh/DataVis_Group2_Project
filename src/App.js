import React, { useState } from 'react';
import LoginPage from './LoginPage';
import Main from './Main';
import './components/Admin.css'; // 전체 스타일
import { DataProvider } from './contexts/DataContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    // [중요] 앱 전체를 DataProvider로 감싸야 자식 컴포넌트들이 데이터를 쓸 수 있습니다.
    <DataProvider>
      <div className="app-root">
        {isLoggedIn ? (
          <Main onLogout={() => setIsLoggedIn(false)} />
        ) : (
          <LoginPage onLogin={() => setIsLoggedIn(true)} />
        )}
      </div>
    </DataProvider>
  );
}

export default App;