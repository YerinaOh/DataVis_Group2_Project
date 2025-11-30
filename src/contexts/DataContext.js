import React, { createContext, useState, useEffect, useContext } from 'react';
import { csvParse } from 'd3-dsv';

// Context 생성
const DataContext = createContext();

// [수정] 불러올 파일 목록 정의
const CSV_FILES = [
  '/suwon_food_weather_2024_01.csv',
  '/suwon_food_weather_2024_02.csv',
  '/suwon_food_weather_2024_03.csv',
  '/suwon_food_weather_2024_04.csv',
  '/suwon_food_weather_2024_05.csv',
  '/suwon_food_weather_2024_06.csv',
  '/suwon_food_weather_2024_07.csv',
  '/suwon_food_weather_2024_08.csv',
  '/suwon_food_weather_2024_09.csv'
];

export const DataProvider = ({ children }) => {
  const [fullData, setFullData] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log(`📥 [System] ${CSV_FILES.length}개 CSV 파일 병렬 로딩 시작...`);
        
        // 1. Promise.all을 사용하여 모든 파일을 동시에 Fetch (속도 향상)
        const responses = await Promise.all(CSV_FILES.map(path => fetch(path)));

        // 2. 모든 응답이 성공했는지 확인
        for (const response of responses) {
          if (!response.ok) throw new Error(`CSV Load Failed: ${response.url} (${response.statusText})`);
        }

        // 3. 응답들을 텍스트로 변환 (역시 병렬 처리)
        const csvTexts = await Promise.all(responses.map(res => res.text()));

        console.log("✅ [System] 파일 다운로드 완료. 데이터 파싱 및 병합 시작...");

        // 4. 각 CSV 텍스트를 파싱하고 하나의 배열로 병합
        // flatMap: 각 파일을 파싱한 배열들을 1차원 배열로 평탄화(flatten)해서 합침
        const mergedData = csvTexts.flatMap(csvText => 
          csvParse(csvText, (row) => ({
            temp: Math.round(+row.temp),
            humidity: Math.round(+row.humidity),
            category: row.card_tpbuz_nm_2,
            amount: +row.amt / 10000, // 만원 단위
            sex: row.sex,
            age: +row.age,
            day: +row.day,
            hour: +row.hour
          }))
        );

        console.log(`✅ [System] 모든 데이터 로딩 및 병합 완료! 총 ${mergedData.length.toLocaleString()}건`);
        
        setFullData(mergedData);
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