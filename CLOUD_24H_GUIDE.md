# 🌐 컴퓨터 꺼도 24시간 알림 받는 방법 (클라우드 무료 배포 가이드)

현재 프로그램은 **내 컴퓨터 안(로컬)**에서 구동되고 있으므로, 컴퓨터를 끄거나 절전 모드로 전환하면 알림 감시도 멈추게 됩니다.

내 컴퓨터를 24시간 켜둘 필요 없이, **컴퓨터 전원을 끄고도 디스코드로 실시간 예매 오픈 알림을 받는 가장 좋은 방법**은 **무료 클라우드 서비스**에 올리는 것입니다.

---

## 🥇 방법 1: Render.com에 무료 배포하기 (가장 추천, 3분 소요)

Render.com은 완전 무료로 웹 서비스 및 백그라운드 프로세스를 구동할 수 있는 인기 클라우드 플랫폼입니다.
이 프로젝트에는 이미 Render용 설정 파일(`render.yaml` 및 `Dockerfile`)이 포함되어 있습니다.

### 단계:
1. **GitHub 저장소에 올리기**:
   - 본인의 GitHub에 새 리포지토리(예: `cinema-alert`)를 생성하고 이 프로젝트 코드를 푸시합니다.
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/내아이디/cinema-alert.git
   git push -u origin main
   ```
2. **Render.com 회원가입**:
   - [Render.com](https://render.com)에 접속하여 GitHub 계정으로 로그인합니다.
3. **새 웹 서비스 만들기**:
   - 대시보드에서 **New +** ➔ **Web Service** 클릭
   - 방금 올린 `cinema-alert` 리포지토리 선택
   - 설정 확인:
     - **Build Command**: `npm install && cd client && npm install && npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free` (무료)
4. **배포 완료!**:
   - 몇 분 후 전 세계 어디서나 접속 가능한 주소(예: `https://cinema-alert.onrender.com`)가 발급됩니다.
   - 핸드폰이나 외부에서도 접속하여 예매 알림을 등록해 둘 수 있으며, **컴퓨터를 꺼도 클라우드가 24시간 내내 디스코드 웹훅으로 알림을 보내줍니다.**

---

## 🥈 방법 2: Railway.app 무료 크레딧 이용하기
- [Railway.app](https://railway.app)에 GitHub 연결 후 저장소를 선택하기만 하면 Dockerfile을 자동으로 감지하여 1분 만에 배포됩니다.

---

## 🥉 방법 3: 집에서 항상 켜져 있는 미니PC / 구형 노트북 / 라즈베리파이
- 집에서 24시간 켜두는 서브 컴퓨터나 NAS, 미니PC가 있다면:
  ```powershell
  cd cinema-alert
  npm start
  ```
  명령어 한 줄로 켜두시면 메인 컴퓨터를 끄셔도 계속 작동합니다.
