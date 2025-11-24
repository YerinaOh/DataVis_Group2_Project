
// src/contexts/DataContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { csvParse } from 'd3-dsv';

// Context 생성
const DataContext = createContext();

// CSV 파일 경로
const CSV_FILE_PATH = '/suwon_food_weather_2024_01.csv';

export const DataProvider = ({ children }) => {
  const [fullData, setFullData] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("📥 [System] CSV 데이터 최초 로딩 시작...");
        const response = await fetch(CSV_FILE_PATH);
        if (!response.ok) throw new Error(`CSV Load Failed: ${response.statusText}`);
        const csvText = await response.text();

        // 여기서 한 번만 파싱하면 모든 컴포넌트가 파싱된 데이터를 씁니다.
        const parsedData = csvParse(csvText, (row) => ({
          temp: Math.round(+row.temp),
          humidity: Math.round(+row.humidity),
          category: row.card_tpbuz_nm_2,
          amount: +row.amt / 10000, // 만원 단위
          sex: row.sex,
          age: +row.age,
          day: +row.day,
          hour: +row.hour
        }));

        console.log(`✅ [System] 데이터 로딩 완료! 총 ${parsedData.length}건`);
        setFullData(parsedData);
        setIsDataLoading(false);
      } catch (err) {
        console.error("🚨 [System] 데이터 로딩 실패:", err);
        setError(err);
        setIsDataLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ fullData, isDataLoading, error }}>
      {children}
    </DataContext.Provider>
  );
};

// 데이터를 쉽게 쓰기 위한 커스텀 Hook
export const useData = () => useContext(DataContext);