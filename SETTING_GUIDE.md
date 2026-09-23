# 새 컴퓨터 플레이 환경 세팅 가이드

부스용 노트북 등 새 컴퓨터에서 "내 소꿉친구가 이렇게 귀여울리 없어"를 처음부터 실행하는 방법.
순서대로 따라 하면 약 5~10분이면 끝난다.

---

## 0. 준비물

| 항목 | 확인 방법 | 없으면 |
|---|---|---|
| **Git** | 터미널에서 `git --version` | [git-scm.com](https://git-scm.com/downloads)에서 설치 |
| **Node.js 20 이상 (LTS 권장)** | 터미널에서 `node -v` | [nodejs.org](https://nodejs.org)에서 LTS 버전 설치 (npm 같이 설치됨) |
| **Gemini API 키** | — | 아래 2번 참고 |
| **인터넷 연결** | — | 게임 중 대화마다 Gemini API를 호출하므로 필수 |

> 터미널: Mac은 `터미널` 앱, Windows는 `PowerShell` 또는 `Git Bash`를 사용한다.

---

## 1. 저장소 clone

```bash
git clone https://github.com/EomTeaEun/arum-love-timer.git
cd arum-love-timer
```

이미지(`public/images/`)도 저장소에 전부 포함되어 있으므로 따로 받을 필요 없다.

---

## 2. Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/apikey) 접속 → Google 계정 로그인
2. **Create API key** 클릭 → 생성된 키 복사
3. 팀에서 공용 키를 쓰는 경우엔 팀원에게 키를 받는다
   (⚠️ 키는 카톡 공개방, 깃허브, 이슈 등에 절대 올리지 말 것)

---

## 3. 환경변수 파일(`.env.local`) 만들기

예시 파일을 복사해서 `.env.local`을 만든다.

**Mac / Linux / Git Bash**
```bash
cp .env.local.example .env.local
```

**Windows PowerShell**
```powershell
Copy-Item .env.local.example .env.local
```

만들어진 `.env.local`을 메모장/VS Code로 열고, `your_gemini_api_key_here` 부분을 실제 키로 바꾼다.

```
GEMINI_API_KEY=AIza...실제키...
```

- `=` 앞뒤에 공백이나 따옴표를 넣지 않는다.
- `.env.local`은 `.gitignore`에 등록되어 있어서 커밋/푸시되지 않는다 (정상).

---

## 4. 패키지 설치 & 실행

```bash
npm install
npm run dev
```

터미널에 `Ready` / `http://localhost:3000`이 뜨면 브라우저에서 **http://localhost:3000** 접속.

---

## 5. 동작 확인 체크리스트

- [ ] 시작 화면 → 게임 규칙 → 일기장 → 인트로가 클릭으로 넘어간다
- [ ] 메인 화면에서 아름이 인사말 클릭 시 우측 상단 타이머(2:30)가 줄어들기 시작한다
- [ ] 대사를 입력하면 "(아름이가 생각 중...)" 후 아름이가 대답하고 호감도 숫자가 바뀐다
- [ ] 타이머가 0이 되면 호감도 50 이상은 해피엔딩, 미만은 배드엔딩으로 넘어간다

빠르게 엔딩까지 확인하고 싶으면 `http://localhost:3000/?debug=1`로 접속한 뒤
브라우저 콘솔(F12)에서 `debugArum.setTimeLeft(5)` 등을 사용한다 (자세한 건 README 참고).

---

## 6. 부스 당일 운영 팁

- 개발 서버(`npm run dev`)보다 **프로덕션 모드**가 더 빠르고 안정적이다.
  ```bash
  npm run build
  npm run start
  ```
- 브라우저는 전체화면(F11 / Mac은 `Ctrl+Cmd+F`)으로 띄운다.
- 무료 티어 API 키는 하루 요청 한도가 낮을 수 있으니, 당일 전에
  [Google AI Studio](https://aistudio.google.com) 대시보드에서 쿼터를 확인해 둔다.
- 최신 코드 받기: `git pull` → `npm install` → 다시 실행

---

## 7. 문제 해결

| 증상 | 원인 / 해결 |
|---|---|
| `git`/`node`/`npm` 명령어를 찾을 수 없음 | 0번 준비물 설치 후 터미널을 **새로 열기** |
| `npm install` 에러 | `node -v`가 20 이상인지 확인 |
| 대사 입력 후 아름이가 대답을 안 하거나 에러 | `.env.local` 파일명/위치(프로젝트 최상위)와 키 값을 확인하고 **서버 재시작** (`Ctrl+C` → `npm run dev`). `.env.local`을 수정하면 항상 재시작해야 반영된다 |
| 잘 되다가 갑자기 대답이 안 옴 | API 쿼터 초과 가능성 → 터미널의 `Gemini API error` 로그 확인, 다른 키로 교체 |
| `Port 3000 is in use` | 이미 실행 중인 서버 종료, 또는 터미널에 안내된 다른 포트(예: 3001)로 접속 |
| 이미지가 안 보임 | `public/images/` 폴더가 있는지 확인, 없으면 `git pull` |
