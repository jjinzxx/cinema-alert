// server/adapters/cgv.js
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://cgv.co.kr',
  'Referer': 'https://cgv.co.kr/'
};

// Fallback preset of major popular CGV branches in case network is down
const DEFAULT_CGV_THEATERS = [
  { code: '0013', name: '용산아이파크몰', region: '서울', special: ['IMAX', '4DX', '씨네드쉐프'] },
  { code: '0056', name: '강남', region: '서울', special: ['4DX'] },
  { code: '0001', name: '강변', region: '서울', special: ['4DX'] },
  { code: '0229', name: '건대입구', region: '서울', special: ['4DX'] },
  { code: '0010', name: '구로', region: '서울', special: [] },
  { code: '0009', name: '대학로', region: '서울', special: [] },
  { code: '0040', name: '명동', region: '서울', special: ['씨네라이브러리'] },
  { code: '0105', name: '목동', region: '서울', special: [] },
  { code: '0150', name: '미아', region: '서울', special: [] },
  { code: '0011', name: '상봉', region: '서울', special: ['4DX'] },
  { code: '0030', name: '압구정', region: '서울', special: ['씨네드쉐프', 'IMAX'] },
  { code: '0112', name: '여의도', region: '서울', special: ['4DX', 'SOUNDX'] },
  { code: '0059', name: '영등포', region: '서울', special: ['SCREENX', '스타리움'] },
  { code: '0063', name: '왕십리', region: '서울', special: ['IMAX', '4DX'] },
  { code: '0199', name: '신촌아트레온', region: '서울', special: ['SCREENX'] },
  { code: '0191', name: '홍대', region: '서울', special: [] },
  { code: '0074', name: '판교', region: '경기', special: ['IMAX', '4DX'] },
  { code: '0008', name: '인천', region: '인천', special: ['IMAX', '4DX'] },
  { code: '0005', name: '서면', region: '부산', special: ['IMAX', '4DX'] },
  { code: '0143', name: '센텀시티', region: '부산', special: ['씨네드쉐프', 'SCREENX'] },
  { code: '0038', name: '광주터미널', region: '광주/전라', special: ['IMAX', '4DX'] },
  { code: '0006', name: '대전', region: '대전/충청', special: ['IMAX', '4DX'] },
  { code: '0014', name: '대구', region: '대구/울산', special: ['IMAX', '4DX'] }
];

export async function getTheaters() {
  try {
    const res = await fetch('https://cgv.co.kr/api/v1/common/bznsCom/mov/searchRegnList?coCd=A420', {
      headers: HEADERS,
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    if (data && data.statusCode === 0 && Array.isArray(data.data)) {
      const list = [];
      for (const region of data.data) {
        if (Array.isArray(region.siteList)) {
          for (const site of region.siteList) {
            list.push({
              code: site.siteNo,
              name: site.siteNm.replace(/^CGV\s*/, ''),
              fullName: site.siteNm,
              region: region.regnGrpNm,
              special: []
            });
          }
        }
      }
      return list.length > 0 ? list : DEFAULT_CGV_THEATERS;
    }
  } catch (err) {
    console.warn('[CGV] getTheaters failed, using preset list:', err.message);
  }
  return DEFAULT_CGV_THEATERS;
}

export async function getAvailableDates(theaterCode) {
  try {
    const res = await fetch(`https://cgv.co.kr/api/v1/booking/searchSiteScnscYmdListBySite?coCd=A420&siteNo=${theaterCode}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(5000)
    });
    const json = await res.json();
    if (json && json.statusCode === 0 && Array.isArray(json.data)) {
      return json.data.map(d => {
        // YYYYMMDD -> YYYY-MM-DD
        const raw = d.scnYmd;
        return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      });
    }
  } catch (err) {
    console.warn(`[CGV] getAvailableDates failed for site ${theaterCode}:`, err.message);
  }
  return [];
}

export async function getShowtimes(theaterCode, playDate) {
  // playDate: YYYY-MM-DD or YYYYMMDD
  const formattedDate = playDate.replace(/-/g, '');
  try {
    const url = `https://cgv.co.kr/api/v1/booking/searchMovScnInfo?coCd=A420&siteNo=${theaterCode}&scnYmd=${formattedDate}&rtctlScopCd=01`;
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(6000)
    });
    const json = await res.json();
    if (json && json.statusCode === 0 && Array.isArray(json.data)) {
      return json.data.map(item => {
        const startTimeRaw = item.scnsrtTm || '';
        const endTimeRaw = item.scnendTm || '';
        const startTime = startTimeRaw.length >= 4 ? `${startTimeRaw.slice(0, 2)}:${startTimeRaw.slice(2, 4)}` : startTimeRaw;
        const endTime = endTimeRaw.length >= 4 ? `${endTimeRaw.slice(0, 2)}:${endTimeRaw.slice(2, 4)}` : endTimeRaw;

        const screenName = item.expoScnsNm || item.scnsNm || '일반관';
        const movKind = item.movkndDsplNm || '';
        
        let screenType = '2D';
        const upperScreen = `${screenName} ${movKind}`.toUpperCase();
        if (upperScreen.includes('IMAX')) screenType = 'IMAX';
        else if (upperScreen.includes('4DX')) screenType = '4DX';
        else if (upperScreen.includes('SCREENX')) screenType = 'SCREENX';
        else if (upperScreen.includes('CINE DE CHEF') || upperScreen.includes('씨네드쉐프')) screenType = 'CINE DE CHEF';
        else if (movKind) screenType = movKind;

        const totalSeats = parseInt(item.stcnt || item.cpSeatCnt || '0', 10);
        const availableSeats = parseInt(item.frSeatCnt || item.frtmpSeatCnt || '0', 10);

        return {
          cinema: 'CGV',
          theaterName: item.siteNm || 'CGV',
          theaterCode,
          movieTitle: item.movNm || item.expoProdNm || '',
          movieCode: item.movNo || item.prodNo || '',
          posterUrl: item.physcFilePathnm ? `https://cdn.cgv.co.kr/cgvpomsfilm/Movie/Thumbnail/Poster/${item.physcFilePathnm}` : '',
          screenName,
          screenType,
          startTime,
          endTime,
          totalSeats,
          availableSeats,
          date: `${formattedDate.slice(0, 4)}-${formattedDate.slice(4, 6)}-${formattedDate.slice(6, 8)}`,
          bookingUrl: `https://cgv.co.kr/ticket`
        };
      });
    }
  } catch (err) {
    console.warn(`[CGV] getShowtimes error for site ${theaterCode} date ${formattedDate}:`, err.message);
  }
  return [];
}
