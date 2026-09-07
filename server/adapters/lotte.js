// server/adapters/lotte.js
const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Origin': 'https://www.lottecinema.co.kr',
  'Referer': 'https://www.lottecinema.co.kr/NLCHS/Ticketing'
};

const DEFAULT_LOTTE_THEATERS = [
  { code: '1|1|1016', name: '월드타워', region: '서울', special: ['SUPER PLEX', '샤롯데'] },
  { code: '1|1|1004', name: '건대입구', region: '서울', special: ['샤롯데'] },
  { code: '1|1|1009', name: '에비뉴엘(명동)', region: '서울', special: ['샤롯데'] },
  { code: '1|1|1001', name: '영등포', region: '서울', special: [] },
  { code: '1|1|1017', name: '청량리', region: '서울', special: [] },
  { code: '1|1|1018', name: '김포공항', region: '서울', special: [] },
  { code: '1|1|1013', name: '가산디지털', region: '서울', special: [] },
  { code: '1|1|1014', name: '신림', region: '서울', special: [] },
  { code: '1|1|1015', name: '홍대입구', region: '서울', special: [] },
  { code: '1|2|2001', name: '수원(수원역)', region: '경기/인천', special: ['SUPER PLEX', '샤롯데'] },
  { code: '1|2|2011', name: '안양', region: '경기/인천', special: [] },
  { code: '1|5|5001', name: '동성로', region: '대구/경북', special: ['샤롯데'] },
  { code: '1|6|6001', name: '부산본점', region: '부산/울산/경남', special: ['샤롯데'] },
  { code: '1|6|6009', name: '광복', region: '부산/울산/경남', special: ['SUPER PLEX'] }
];

let cachedTheaters = null;

export async function getTheaters() {
  if (cachedTheaters) return cachedTheaters;
  try {
    const payload = {
      MethodName: 'GetTicketingPageTOBE',
      channelType: 'HO',
      osType: 'W',
      osVersion: 'Mozilla/5.0',
      memberOnNo: '0'
    };
    const params = new URLSearchParams();
    params.append('paramList', JSON.stringify(payload));

    const res = await fetch('https://www.lottecinema.co.kr/LCWS/Ticketing/TicketingData.aspx', {
      method: 'POST',
      headers: HEADERS,
      body: params.toString(),
      signal: AbortSignal.timeout(6000)
    });
    const data = await res.json();
    if (data && data.Cinemas && Array.isArray(data.Cinemas.Cinemas?.Items)) {
      const divisionMap = new Map();
      if (Array.isArray(data.CinemaDivison?.Items)) {
        for (const div of data.CinemaDivison.Items) {
          divisionMap.set(div.DivisionCode, div.DivisionNameKR);
        }
      }

      cachedTheaters = data.Cinemas.Cinemas.Items.map(item => {
        const detailCode = parseInt(item.DetailDivisionCode, 10) || 1;
        const fullCode = `${item.DivisionCode}|${detailCode}|${item.CinemaID}`;
        const region = divisionMap.get(item.DivisionCode) || '기타';
        return {
          code: fullCode,
          cinemaIdOnly: String(item.CinemaID),
          name: item.CinemaNameKR,
          fullName: `롯데시네마 ${item.CinemaNameKR}`,
          region,
          special: []
        };
      });
      return cachedTheaters;
    }
  } catch (err) {
    console.warn('[Lotte Cinema] getTheaters failed, using fallback:', err.message);
  }
  return DEFAULT_LOTTE_THEATERS;
}

export async function getShowtimes(theaterCode, playDate) {
  // Ensure theaterCode has 3 parts (Division|Detail|CinemaID), if only CinemaID, find full code
  let fullCode = theaterCode;
  if (!String(theaterCode).includes('|')) {
    const theaters = await getTheaters();
    const found = theaters.find(t => t.code === theaterCode || t.cinemaIdOnly === String(theaterCode));
    if (found) fullCode = found.code;
    else fullCode = `1|1|${theaterCode}`;
  }

  // Ensure playDate is YYYY-MM-DD
  const formattedDate = playDate.includes('-') ? playDate : `${playDate.slice(0, 4)}-${playDate.slice(4, 6)}-${playDate.slice(6, 8)}`;

  try {
    const payload = {
      MethodName: 'GetPlaySequence',
      channelType: 'HO',
      osType: 'W',
      osVersion: 'Mozilla/5.0',
      playDate: formattedDate,
      cinemaID: fullCode,
      representationMovieCode: ''
    };
    const params = new URLSearchParams();
    params.append('paramList', JSON.stringify(payload));

    const res = await fetch('https://www.lottecinema.co.kr/LCWS/Ticketing/TicketingData.aspx', {
      method: 'POST',
      headers: HEADERS,
      body: params.toString(),
      signal: AbortSignal.timeout(6000)
    });
    const data = await res.json();
    if (data && data.PlaySeqs && Array.isArray(data.PlaySeqs.Items)) {
      return data.PlaySeqs.Items.map(item => {
        const screenName = item.ScreenNameKR || item.BrandNm_KR || '일반관';
        const filmName = item.FilmNameKR || '2D';
        const division = item.ScreenDivisionNameKR || '';

        let screenType = '2D';
        const upper = `${screenName} ${filmName} ${division}`.toUpperCase();
        if (upper.includes('SUPER PLEX') || upper.includes('수퍼플렉스')) screenType = 'SUPER PLEX';
        else if (upper.includes('CHARLOTTE') || upper.includes('샤롯데')) screenType = 'CHARLOTTE';
        else if (upper.includes('SUPER 4D') || upper.includes('4D')) screenType = 'SUPER 4D';
        else if (upper.includes('COLORIUM') || upper.includes('컬러리움')) screenType = 'COLORIUM';
        else if (filmName) screenType = filmName;

        return {
          cinema: 'LOTTE',
          theaterName: item.CinemaNameKR ? `롯데시네마 ${item.CinemaNameKR}` : '롯데시네마',
          theaterCode: fullCode,
          movieTitle: item.MovieNameKR || '',
          movieCode: String(item.RepresentationMovieCode || item.MovieCode || ''),
          posterUrl: item.PosterURL || '',
          screenName: item.BrandNm_KR || screenName,
          screenType,
          startTime: item.StartTime || '',
          endTime: item.EndTime || '',
          totalSeats: item.TotalSeatCount || 0,
          availableSeats: item.BookingSeatCount || 0,
          date: formattedDate,
          bookingUrl: 'https://www.lottecinema.co.kr/NLCHS/Ticketing'
        };
      });
    }
  } catch (err) {
    console.warn(`[Lotte Cinema] getShowtimes error for theater ${theaterCode} date ${formattedDate}:`, err.message);
  }
  return [];
}
