import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// CSV 파일 경로 설정. 'public' 폴더에 넣은 파일을 가리킵니다.
// '날씨데이터_10년_20251023230925.csv' 파일을 public 폴더에 넣어주세요.
// 💡 Step 1에서 변경한 새로운 파일명을 사용합니다.
const CSV_FILE_NAME = 'weather_data_10y.csv'; 

// 배포 환경에서는 PUBLIC_URL을 생략하고 루트 경로(슬래시)만 쓰는 것이 더 안전합니다.
const CSV_FILE_PATH = process.env.PUBLIC_URL + '/' + CSV_FILE_NAME;

// 사용자 정의 Hook 정의 (앱 개발의 ViewModel 역할)
export const useDataParsing = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(CSV_FILE_PATH)
      .then(response => {
        if (!response.ok) {
          // 💡 파일 로드 실패 시 에러를 던져서 catch에서 잡히도록 합니다.
          console.error(`Error fetching file: ${response.status} ${response.statusText} at ${CSV_FILE_PATH}`);
          throw new Error(`파일을 찾을 수 없습니다. 경로: ${CSV_FILE_PATH}`); 
        }
        return response.text();
      })
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          dynamicTyping: true, 
          skipEmptyLines: true,
          complete: (results) => {
            const rawData = results.data;
            
            // 💡 핵심: 월별 평균 기온을 계산하는 함수
            const calculateMonthlyAverages = (data) => {
                const monthlyData = {};

                data.forEach(row => {
                    const dateStr = row['일시'];
                    const temp = row['평균기온(°C)'];
                    const station = row['지점명'];

                    // '일시'가 유효하고, '평균기온'이 숫자일 때만 처리
                    if (typeof dateStr === 'string' && typeof temp === 'number') {
                        // '2013-08'에서 '2013-08'만 추출 (월별 그룹화 기준)
                        const yearMonth = dateStr.substring(0, 7); 
                        const key = `${station}-${yearMonth}`; // 지점명-년월 키 사용

                        if (!monthlyData[key]) {
                            monthlyData[key] = {
                                station: station,
                                yearMonth: yearMonth,
                                temps: [],
                            };
                        }
                        monthlyData[key].temps.push(temp);
                    }
                });

                // 월별 평균 계산 및 결과 배열 생성
                return Object.values(monthlyData).map(item => ({
                    station: item.station,
                    yearMonth: item.yearMonth,
                    avgTemp: item.temps.reduce((sum, t) => sum + t, 0) / item.temps.length,
                }));
            };

            const processedData = calculateMonthlyAverages(rawData);
            
            // console.log("가공된 월별 평균 데이터:", processedData); // 확인용
            setData(processedData); 
            setLoading(false);
          },
          error: (err) => {
            setError(err.message);
            setLoading(false);
          }
        });
      })
      .catch(err => {
        setError(`데이터 로드 실패: ${err.message}`);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
};