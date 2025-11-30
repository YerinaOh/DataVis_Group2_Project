import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
 
    onLogin(id);
  };

  return (
    <div className="login-container">
      <div className="login-box">
    {/* 로고 영역 수정 */}
        <div className="logo-area">
          {/* [수정] 배달의민족 -> 캐치테이블 */}
          <h1 className="baemin-logo" style={{ fontFamily: 'sans-serif' }}>CATCH TABLE</h1>
          {/* [수정] 사장님광장 AD -> 파트너센터 */}
          <span className="admin-badge">파트너센터</span>
        </div>

        {/* 서비스 설명 */}
        <div className="intro-text">
          <h2>날씨 기반 매출 분석 솔루션</h2>
          <p>기온과 습도에 따른 업종별 매출 변화를<br/>한눈에 파악하고 광고 전략을 세우세요.</p>
          <span className="version-text">Ver 1.0.0</span>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="login-form">
          <input 
            type="text" 
            placeholder="아이디" 
            value={id} 
            onChange={(e) => setId(e.target.value)}
            className="baemin-input"
          />
          <input 
            type="password" 
            placeholder="비밀번호" 
            value={pw} 
            onChange={(e) => setPw(e.target.value)}
            className="baemin-input"
          />
          <button type="submit" className="baemin-button full-width">
            로그인
          </button>
        </form>
        
        <div className="login-footer">
          <p>아이디/비밀번호 찾기 | 회원가입</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;