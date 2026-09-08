# 🎬 영화 예매 오픈 알리미 (Cinema Alert)
> **CGV • 메가박스 • 롯데시네마 실시간 예매 오픈 감지 및 디스코드 웹훅 알림 시스템**

---

## 📌 주요 특징 및 기능

1. **국내 3대 멀티플렉스 실시간 연동**
   - **CGV**: 차세대 BFF API (`searchMovScnInfo`, `searchSiteScnscYmdListBySite`)를 통해 상영회차 및 IMAX/4DX/SCREENX 특별관 잔여좌석 실시간 감시
   - **메가박스**: 빠른예매 JSON API (`selectBokdList.do`)를 통해 Dolby Cinema, MX, 리클라이너 등 특별관 및 잔여석 실시간 감시
   - **롯데시네마**: 예매 데이터 API (`GetPlaySequence`)를 통해 SUPER PLEX, 샤롯데 등 특별관 및 상영시간표 실시간 감시

2. **상영 예정 / 미오픈 날짜 집중 모니터링**
   - 아직 상영 시간표가 열리지 않은 날짜(예: 주말, 공휴일, 다음 주 등) 또는 개봉 예정인 영화를 등록해 두면 백그라운드 스케줄러가 주기적으로 확인합니다.
   - 예매가 오픈되어 상영관 또는 좌석이 등록되는 순간 즉시 감지합니다.

3. **디스코드 웹훅 (Discord Webhook) 리치 임베드 알림**
   - 디스코드 채널로 영화 포스터, 극장 지점, 상영관, 상영시간, 잔여석, **공식 예매 바로가기 버튼 링크**를 포함한 임베드 메시지 자동 발송.

4. **웹 브라우저 실시간 알림 (SSE & Audio)**
   - 브라우저 푸시 알림 (HTML5 Notification API) 지원
   - 예매 오픈 감지 시 차임벨 효과음 재생 (Web Audio API 내장)
   - 실시간 SSE(Server-Sent Events) 스트림으로 여러 기기나 브라우저 탭 간 실시간 상태 동기화

5. **자주 찾는 특수관 원클릭 프리셋**
   - 용산아이파크몰 (용아맥), 코엑스 (코돌비), 월드타워 (수퍼플렉스), 판교, 수원스타필드 등 인기 극장 원클릭 선택

---

## 🔐 사용자 계정 및 보안 아키텍처 (Security Architecture)

본 서비스는 다중 사용자 환경에서 개인의 알림 설정과 개인정보를 안전하게 보호하기 위해 체계적인 보안 설계를 적용하고 있습니다.

### 1. 비밀번호 단방향 암호화 (PBKDF2-SHA512 + Salt)
* **평문 저장 불가**: 사용자가 입력한 비밀번호는 서버 메모리나 디스크에 절대 평문(Plaintext)으로 저장되지 않습니다.
* **고유 Salt 적용**: 계정 생성 시 Node.js `crypto.randomBytes(16)`를 통해 128비트 암호학적 난수 Salt를 생성하여 계정마다 개별 부여합니다.
* **반복 해싱**: `PBKDF2(Password-Based Key Derivation Function 2)` 알고리즘을 사용하여 SHA-512 해시 함수로 1,000회 반복 연산(`Key stretching`)한 64바이트 다이제스트 값만 데이터베이스에 보관합니다.
* **공격 방어**: 사전에 해시값을 대량 계산해 둔 레인보우 테이블(Rainbow Table) 공격과 무차별 대입 공격(Brute Force)을 효과적으로 방어합니다.

### 2. 세션 및 토큰 기반 안전한 인증 (Bearer Token)
* **암호학적 난수 토큰**: 로그인 성공 시 `crypto.randomBytes(32)` (256비트 엔트로피)로 생성된 추측 불가능한 불투명(Opaque) 세션 토큰이 발급됩니다.
* **인가(Authorization) 미들웨어**: 모든 API 호출은 `Authorization: Bearer <token>` 헤더를 통해 서버에서 실시간 유효성을 검증받습니다.
* **즉시 세션 파기**: 로그아웃 시 서버 측 활성 세션 맵에서 해당 토큰을 즉각 삭제(Revoke)하여 재사용을 원천 차단합니다.

### 3. 사용자별 데이터 완전 격리 (Multi-Tenant Isolation)
* **감시 작업 격리**: 모든 예매 감시 작업(`tasks`)과 알림 기록(`logs`)은 고유 `userId`와 엄격하게 1:1로 바인딩됩니다.
* **권한 검증**: 타인의 토큰으로는 다른 사용자의 감시 목록을 열람, 수정, 삭제할 수 없도록 서버 엔드포인트마다 엄격한 소유권 검증(401 Unauthorized / 404 Not Found)을 수행합니다.
* **전용 디스코드 웹훅 분리**: 개인별 웹훅 URL은 각자의 계정 내에만 안전하게 보관되며, 예매가 오픈되었을 때 해당 작업을 등록한 당사자의 디스코드 채널로만 타겟 발송됩니다.

### 4. Git 저장소 및 배포 보안 (`.gitignore`)
* 계정 데이터(`data/users.json`) 및 활성 세션(`data/sessions.json`)은 `.gitignore`에 등록되어 GitHub 등 공개 원격 저장소에 절대 커밋되거나 유출되지 않습니다.
* Render 클라우드 및 로컬 환경 모두에서 개인 데이터의 격리와 무결성을 보장합니다.

---

## 🌐 서비스 접속 주소 (Live URLs)

* **공식 연결 도메인**: [https://시네마알리미.메인.한국](https://시네마알리미.메인.한국)
* **Render 클라우드 24/7 서비스**: [https://cinema-alert.onrender.com](https://cinema-alert.onrender.com)
* **GitHub Pages 미러**: [https://jjinzxx.github.io/cinema-alert/](https://jjinzxx.github.io/cinema-alert/)

---

## 🚀 빠른 시작 (실행 방법)

프로젝트 폴더 위치: `C:\Users\Like\.gemini\antigravity\scratch\cinema-alert`

### 1. 서버 및 웹 애플리케이션 실행
터미널(PowerShell 또는 명령 프롬프트)에서 다음 명령어를 실행합니다:

```bash
cd "C:\Users\Like\.gemini\antigravity\scratch\cinema-alert"
npm start
```

실행 후 브라우저에서 아래 주소로 접속합니다:
👉 **`http://localhost:4000`**

---

## ⚙️ 디스코드 웹훅 연동 방법

1. 알림을 받고 싶은 **디스코드 서버**에서 채널 우클릭 ➔ **채널 편집** 선택
2. **연동** 탭 ➔ **웹훅 만들기** 클릭
3. 생성된 웹훅의 **웹훅 URL 복사** 클릭
4. 시네마 알리미 웹 대시보드 우측 상단의 **[설정 / 웹훅]** 버튼 클릭
5. 복사한 URL을 붙여넣고 **[테스트 전송]**을 눌러 정상 발송되는지 확인 후 **[설정 저장]** 클릭

---

## 🛠️ 프로젝트 구조

```
cinema-alert/
├── server/
│   ├── index.js          # Express 서버 엔트리포인트 (API & SSE)
│   ├── scheduler.js      # 백그라운드 주기적 감시 엔진
│   ├── storage.js        # 감시 작업 및 설정 영속성 저장 모듈
│   ├── adapters/
│   │   ├── cgv.js        # CGV API 어댑터
│   │   ├── megabox.js    # 메가박스 API 어댑터
│   │   └── lotte.js      # 롯데시네마 API 어댑터
│   └── notifiers/
│       ├── discord.js    # 디스코드 웹훅 카드 전송 모듈
│       └── sse.js        # 웹 실시간 스트림 브로드캐스터
├── client/
│   ├── src/
│   │   ├── App.jsx       # 메인 대시보드
│   │   └── components/   # UI 컴포넌트
└── data/                 # 작업 및 설정 JSON 데이터
```

---

## 👨‍💻 Created by
* **jjinzxx**: [https://blog.naver.com/epspqm823](https://blog.naver.com/epspqm823)

