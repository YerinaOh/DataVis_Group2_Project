import React, { useState } from 'react';
import './Admin.css'; // Admin.css에 스타일 추가 예정

// [수정] 보내주신 10개 업종 데이터에 맞춘 아이콘 매핑
// public/icons 폴더에 이 이름대로 이미지 파일을 넣어주세요.
const CATEGORY_ICON_MAP = {
  "한식": "./icons/korean.png",             // 비빔밥, 밥그릇 등
  "커피/음료": "./icons/coffee.png",        // 커피잔
  "고기요리": "./icons/meat.png",           // 고기, 스테이크
  "간이주점": "./icons/pub.png",            // 맥주잔, 칵테일
  "일식/수산물": "./icons/sushi.png",       // 초밥, 생선
  "제과/제빵/떡/케익": "./icons/bakery.png", // 케이크, 빵
  "닭/오리요리": "./icons/chicken.png",     // 치킨
  "분식": "./icons/tteokbokki.png",         // 떡볶이
  "패스트푸드": "./icons/burger.png",       // 햄버거
  "별식/퓨전요리": "./icons/fusion.png",    // 파스타, 피자 등
};

const DEFAULT_ICON = "/icons/default_food.png"; // 매핑 안 된 경우 기본 아이콘

const AdSimulation = () => {
  const [simulationData, setSimulationData] = useState(null);
  const [fileName, setFileName] = useState("");

  // 파일 업로드 핸들러
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // JSON 구조 확인 (top_10_rankings가 있는지)
        if (json.top_10_rankings) {
          setSimulationData(json);
        } else {
          alert("올바른 시뮬레이션 JSON 파일 형식이 아닙니다.");
        }
      } catch (error) {
        console.error("JSON 파싱 에러:", error);
        alert("파일을 읽을 수 없습니다.");
      }
    };
    reader.readAsText(file);
  };

  // 상위 8개 아이템 추출 (데이터가 10개라도 화면엔 8개만 배치)
  const top8Items = simulationData ? simulationData.top_10_rankings.slice(0, 8) : [];

  return (
    <div className="simulation-wrapper">
      {/* 1. 좌측: 설정 및 업로드 패널 */}
      <div className="sim-control-panel">
        <div className="panel-header">
          <h4>📱 타겟광고 시뮬레이션</h4>
          <p>분석된 JSON 데이터를 업로드하여<br/>앱 내 노출 화면을 미리 확인하세요.</p>
        </div>
        
        <div className="upload-box">
          <label htmlFor="json-upload" className="upload-btn">
            📂 분석 데이터(JSON) 업로드
          </label>
          <input 
            type="file" 
            id="json-upload" 
            accept=".json" 
            onChange={handleFileUpload} 
            style={{ display: 'none' }}
          />
          {fileName && <p className="file-name-display">선택된 파일: {fileName}</p>}
        </div>

        {simulationData && (
          <div className="sim-info-box">
            <h5>적용된 필터 조건</h5>
            <ul>
              {/* 조건 데이터가 있을 때만 표시 */}
              {simulationData.conditions && (
                <>
                  <li>🌡️ 기온: {simulationData.conditions.temperature === 'ALL' ? '전체' : `${simulationData.conditions.temperature}°C`}</li>
                  <li>💧 습도: {simulationData.conditions.humidity === 'ALL' ? '전체' : `${simulationData.conditions.humidity}%`}</li>
                  <li>⏰ 시간: {simulationData.conditions.hour}</li>
                  <li>👫 성별: {simulationData.conditions.sex}</li>
                  <li>🎂 연령: {simulationData.conditions.age}</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* 2. 우측: 아이폰 프리뷰 영역 */}
      <div className="sim-preview-area">
        <div className="phone-frame">
          {/* 배경 이미지 */}
          <img 
            src="/sample_iphone.png" 
            alt="iPhone Mockup" 
            className="phone-bg" 
          />

          {/* 화면 콘텐츠 (데이터가 있을 때만 표시) */}
          {simulationData && (
            <>
              {/* 아이콘 그리드 (회색 띠 위치에 배치) */}
              <div className="app-icon-grid">
                {top8Items.map((item) => (
                  <div key={item.category} className="app-icon-item">
                    <div className="icon-img-box">
                      <img 
                        src={CATEGORY_ICON_MAP[item.category] || DEFAULT_ICON} 
                        alt={item.category} 
                        onError={(e) => {e.target.src = DEFAULT_ICON}} // 이미지 없으면 기본값
                      />
                      {/* 순위 뱃지 */}
                      <span className="rank-badge">{item.rank}</span>
                    </div>
                    {/* 업종명 */}
                    <span className="icon-label">{item.category}</span>
                  </div>
                ))}
              </div>

              {/* 하단 배너 (1위 업종 광고) */}
              <div className="app-bottom-banner">
                <div className="banner-text">
                  <span className="banner-tag">추천</span>
                  <p>지금 <strong>{top8Items[0]?.category}</strong> 주문하면<br/>배달팁 0원!</p>
                </div>
                <button>보러가기</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdSimulation;