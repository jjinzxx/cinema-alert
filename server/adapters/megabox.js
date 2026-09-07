// server/adapters/megabox.js
const HEADERS = {
  'Content-Type': 'application/json;charset=UTF-8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Origin': 'https://www.megabox.co.kr',
  'Referer': 'https://www.megabox.co.kr/booking'
};

const DEFAULT_MEGABOX_THEATERS = [
  { code: '1351', name: '코엑스', region: '서울', special: ['Dolby Cinema', 'THE BOUTIQUE'] },
  { code: '1372', name: '강남', region: '서울', special: [] },
  { code: '1431', name: '동대문', region: '서울', special: [] },
  { code: '1572', name: '목동', region: '서울', special: ['MX'] },
  { code: '1331', name: '상암월드컵경기장', region: '서울', special: ['Dolby Cinema'] },
  { code: '1311', name: '신촌', region: '서울', special: [] },
  { code: '1421', name: '성수', region: '서울', special: ['THE BOUTIQUE', 'MX'] },
  { code: '1561', name: '홍대', region: '서울', special: [] },
  { code: '1381', name: '송도', region: '인천', special: ['Dolby Cinema', 'MX'] },
  { code: '4122', name: '하남스타필드', region: '경기', special: ['Dolby Cinema'] },
  { code: '1651', name: '수원스타필드', region: '경기', special: ['Dolby Cinema'] },
  { code: '1631', name: '안성스타필드', region: '경기', special: ['Dolby Cinema'] },
  { code: '4631', name: '대전신세계 아트앤사이언스', region: '대전/충청', special: ['Dolby Cinema'] },
  { code: '4121', name: '남양주현대아울렛 스페이스원', region: '경기', special: ['Dolby Cinema'] },
  { code: '6121', name: '대구신세계(동대구)', region: '대구/울산', special: ['Dolby Cinema'] },
  { code: '4802', name: '부산대', region: '부산/경남', special: [] }
];

let cachedTheaters = null;

export async function getTheaters() {
  if (cachedTheaters) return cachedTheaters;
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const res = await fetch('https://www.megabox.co.kr/on/oh/ohb/SimpleBooking/selectBokdList.do', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        playDe: today,
        brchNo1: '1351', // COEX
        crtDe: today
      }),
      signal: AbortSignal.timeout(6000)
    });
    const data = await res.json();
    if (data && Array.isArray(data.areaBrchList)) {
      const unique = new Map();
      for (const item of data.areaBrchList) {
        if (!unique.has(item.brchNo)) {
          unique.set(item.brchNo, {
            code: item.brchNo,
            name: item.brchNm,
            fullName: `메가박스 ${item.brchNm}`,
            region: item.areaCdNm || '기타',
            special: []
          });
        }
      }
      cachedTheaters = Array.from(unique.values());
      return cachedTheaters;
    }
  } catch (err) {
    console.warn('[Megabox] getTheaters failed, using fallback:', err.message);
  }
  return DEFAULT_MEGABOX_THEATERS;
}

export async function getShowtimes(theaterCode, playDate) {
  const formattedDate = playDate.replace(/-/g, '');
  try {
    const res = await fetch('https://www.megabox.co.kr/on/oh/ohb/SimpleBooking/selectBokdList.do', {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        playDe: formattedDate,
        brchNo1: theaterCode,
        crtDe: formattedDate
      }),
      signal: AbortSignal.timeout(6000)
    });
    const data = await res.json();
    if (data && Array.isArray(data.movieFormList)) {
      return data.movieFormList.map(item => {
        const screenName = item.theabExpoNm || item.theabNm || '일반관';
        const playKind = (item.playKindNm || '').replace(/&#40;/g, '(').replace(/&#41;/g, ')');
        
        let screenType = '2D';
        const upper = `${screenName} ${playKind}`.toUpperCase();
        if (upper.includes('DOLBY') || upper.includes('돌비')) screenType = 'Dolby Cinema';
        else if (upper.includes('MX')) screenType = 'MX';
        else if (upper.includes('BOUTIQUE') || upper.includes('부티크')) screenType = 'THE BOUTIQUE';
        else if (upper.includes('RECLINER') || upper.includes('리클라이너')) screenType = 'Recliner';
        else if (playKind) screenType = playKind;

        const totalSeats = item.totSeatCnt || 0;
        const availableSeats = item.restSeatCnt || 0;
        const posterUrl = item.moviePosterImg ? (item.moviePosterImg.startsWith('http') ? item.moviePosterImg : `https://img.megabox.co.kr${item.moviePosterImg}`) : '';

        return {
          cinema: 'MEGABOX',
          theaterName: item.brchNm ? `메가박스 ${item.brchNm}` : '메가박스',
          theaterCode,
          movieTitle: item.movieNm || item.rpstMovieNm || '',
          movieCode: item.movieNo || item.rpstMovieNo || '',
          posterUrl,
          screenName,
          screenType,
          startTime: item.playStartTime || '',
          endTime: item.playEndTime || '',
          totalSeats,
          availableSeats,
          date: `${formattedDate.slice(0, 4)}-${formattedDate.slice(4, 6)}-${formattedDate.slice(6, 8)}`,
          bookingUrl: 'https://m.megabox.co.kr/booking'
        };
      });
    }
  } catch (err) {
    console.warn(`[Megabox] getShowtimes error for brch ${theaterCode} date ${formattedDate}:`, err.message);
  }
  return [];
}
