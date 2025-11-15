import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// CSV 파일 경로 설정. 'public' 폴더에 넣은 파일을 가리킵니다.
// '날씨데이터_10년_20251023230925.csv' 파일을 public 폴더에 넣어주세요.
// 💡 Step 1에서 변경한 새로운 파일명을 사용합니다.
const CSV_FILE_NAME = 'weather_data_10y.csv'; 

// 배포 환경에서는 PUBLIC_URL을 생략하고 루트 경로(슬래시)만 쓰는 것이 더 안전합니다.
const CSV_FILE_PATH = process.env.PUBLIC_URL + '/' + CSV_FILE_NAME;

// 💡 [추가] 임의의 소비 데이터 생성 함수 (SCATTER PLOT용)
const generateMockConsumption = (station, yearMonth, avgTemp) => {
    // 기온에 따라 소비가 증가하는 경향을 가정하고 난수를 추가
    const base = 50000;
    const tempFactor = (avgTemp - 15) * 500; // 기온 1도당 500 단위 증가
    const stationFactor = (station.charCodeAt(0) % 5) * 1000; // 지역별 변이
    return Math.max(10000, base + tempFactor + stationFactor + (Math.random() * 20000 - 10000));
};


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
            
// 💡 [수정] 월별 기온, 강수량, 습도 계산 및 소비 데이터 결합 (SCATTER PLOT용)
            const calculateMonthlyAverages = (data) => {
                const monthlyData = {};

                data.forEach(row => {
                    const dateStr = row['일시'];
                    const station = row['지점명'];
                    const avgTemp = row['평균기온(°C)']; 
                    // 💡 [수정] 강수량, 습도 필드 추가
                    const monthlyRain = row['월합강수량(00~24h만)(mm)']; 
                    const avgHumidity = row['평균상대습도(%)']; 

                    // 유효한 데이터만 처리
                    if (typeof dateStr === 'string' && station) {
                        const yearMonth = dateStr.substring(0, 7); 
                        const key = `${station}-${yearMonth}`; 

                        if (!monthlyData[key]) {
                            monthlyData[key] = {
                                station: station,
                                yearMonth: yearMonth,
                                temps: [],
                                // 💡 [추가] 강수량, 습도 배열 초기화
                                rains: [],
                                humidities: []
                            };
                        }
                        
                        // 💡 [수정] 결측치(null/NaN) 안전하게 처리 및 배열에 추가
                        if (typeof avgTemp === 'number' && !isNaN(avgTemp)) {
                            monthlyData[key].temps.push(avgTemp);
                        }
                        // 강수량은 합계로 사용되므로, 유효한 값만 배열에 추가
                        if (typeof monthlyRain === 'number' && !isNaN(monthlyRain)) {
                            monthlyData[key].rains.push(monthlyRain); 
                        }
                        // 습도는 평균으로 사용되므로, 유효한 값만 배열에 추가
                        if (typeof avgHumidity === 'number' && !isNaN(avgHumidity)) {
                            monthlyData[key].humidities.push(avgHumidity); 
                        }
                    }
                });

                // 월별 평균 계산 및 소비 데이터 결합
                return Object.values(monthlyData).map(item => {
                    const count = item.temps.length || 1; 
                    const humidityCount = item.humidities.length || 1; // 습도 결측치 방지

                    const avgTemp = item.temps.reduce((sum, t) => sum + t, 0) / count;
                    const totalRain = item.rains.reduce((sum, r) => sum + r, 0); // 월합은 합계
                    const avgHumidity = item.humidities.reduce((sum, h) => sum + h, 0) / humidityCount;

                    const consumption = generateMockConsumption(item.station, item.yearMonth, avgTemp); // 💡 임의 소비 데이터 생성

                    return {
                        station: item.station,
                        yearMonth: item.yearMonth,
                        // 💡 [수정] 유효한 숫자로 변환
                        avgTemp: parseFloat(avgTemp.toFixed(1)),
                        totalRain: parseFloat(totalRain.toFixed(1)),
                        // 💡 [수정] 유효한 값만 반환 (0이면 null 대신 0 반환)
                        avgHumidity: avgHumidity > 0 ? parseFloat(avgHumidity.toFixed(1)) : 0, 
                        totalConsumption: Math.round(consumption) // Y축 소비 데이터
                    };
                }).filter(d => d.avgTemp && d.totalRain !== null); // 💡 [추가] 최종적으로 avgTemp와 totalRain이 유효한 행만 필터링

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