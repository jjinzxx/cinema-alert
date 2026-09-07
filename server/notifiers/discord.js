// server/notifiers/discord.js

const CINEMA_COLORS = {
  CGV: 0xFB4357,      // CGV Red
  MEGABOX: 0x01648E,  // Megabox Blue/Purple
  LOTTE: 0xED1C24     // Lotte Red
};

export async function sendDiscordAlert(webhookUrl, payload) {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    throw new Error('올바른 디스코드 웹훅 URL이 아닙니다.');
  }

  const {
    cinema,
    theaterName,
    movieTitle,
    screenName,
    screenType,
    startTime,
    endTime,
    totalSeats,
    availableSeats,
    date,
    posterUrl,
    bookingUrl
  } = payload;

  const color = CINEMA_COLORS[cinema] || 0x5865F2;

  const embed = {
    title: `🎬 [${cinema}] ${movieTitle} 예매 오픈!`,
    description: `**${theaterName}**에서 **${movieTitle}** 상영 회차가 등록되었습니다!\n빠르게 예매를 진행해 보세요.`,
    url: bookingUrl || 'https://www.google.com',
    color,
    fields: [
      {
        name: '🏛️ 극장 / 상영관',
        value: `${theaterName} \`${screenName}\` (${screenType || '2D'})`,
        inline: false
      },
      {
        name: '📅 상영 일시',
        value: `🗓️ **${date}** ⏰ **${startTime} ~ ${endTime}**`,
        inline: true
      },
      {
        name: '💺 잔여 좌석',
        value: `**${availableSeats}석** / 총 ${totalSeats}석`,
        inline: true
      }
    ],
    footer: {
      text: `영화 예매 오픈 알리미 (Cinema Alert) • ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
    },
    timestamp: new Date().toISOString()
  };

  if (posterUrl && posterUrl.startsWith('http')) {
    embed.thumbnail = { url: posterUrl };
  }

  const body = {
    username: `${cinema} 예매 알리미`,
    avatar_url: cinema === 'CGV'
      ? 'https://img.cgv.co.kr/R2014/images/common/logo/logoRed.png'
      : cinema === 'MEGABOX'
        ? 'https://img.megabox.co.kr/static/pc/images/common/ci/logo.png'
        : 'https://images.lottecinema.co.kr/NLCHS/images/common/logo.png',
    content: `🔔 **[예매 오픈]** <@everyone> **${movieTitle}** (${theaterName}) 예매가 열렸습니다!`,
    embeds: [embed],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: '🎟️ 바로 예매하기',
            url: bookingUrl || 'https://www.google.com'
          }
        ]
      }
    ]
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    // If components are rejected by simple webhook endpoint, fallback to embeds only
    const fallbackBody = {
      username: `${cinema} 예매 알리미`,
      content: `🔔 **[예매 오픈]** **${movieTitle}** (${theaterName}) 예매가 열렸습니다!\n👉 예매 링크: ${bookingUrl || '공식 홈페이지'}`,
      embeds: [embed]
    };
    const retryRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackBody)
    });
    if (!retryRes.ok) {
      const errText = await retryRes.text();
      throw new Error(`디스코드 웹훅 전송 실패 (${retryRes.status}): ${errText}`);
    }
  }

  return true;
}

export async function testDiscordWebhook(webhookUrl) {
  return sendDiscordAlert(webhookUrl, {
    cinema: 'CGV',
    theaterName: 'CGV 용산아이파크몰',
    movieTitle: '테스트 영화 (연동 성공)',
    screenName: 'IMAX관 (Laser)',
    screenType: 'IMAX',
    startTime: '19:30',
    endTime: '22:15',
    totalSeats: 624,
    availableSeats: 624,
    date: new Date().toISOString().slice(0, 10),
    posterUrl: 'https://img.cgv.co.kr/Movie/Thumbnail/Poster/000088/88077/88077_1000.jpg',
    bookingUrl: 'https://cgv.co.kr/ticket'
  });
}
