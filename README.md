# 내 소꿉친구가 이렇게 귀여울리 없어

2026 충남대학교 엔지니어링 페어 컴퓨터인공지능학부 부스 전시용 미니 비주얼노벨 웹앱. 유저가 자연어로 대사를 입력하면 OpenAI API가
히로인 "공아름"의 대사/감정/호감도 변화를 실시간으로 판정해서 반환한다. 2분 30초 제한시간 안에
호감도 임계값(50) 도달 여부로 해피엔딩/배드엔딩이 갈린다.

## 스크린샷 & 플레이 영상

### 스크린샷

<img width="1440" height="790" alt="image" src="https://github.com/user-attachments/assets/d3af0739-4056-419e-ace7-411d35870cbe" />
<img width="1440" height="790" alt="image" src="https://github.com/user-attachments/assets/3be7e5e2-eb6e-4df6-a729-a740c0cf18ab" />
<img width="973" height="784" alt="image" src="https://github.com/user-attachments/assets/fb36f29b-c67c-4408-88ff-9f6b9dcde655" />
<img width="969" height="700" alt="image" src="https://github.com/user-attachments/assets/c438d126-8db2-49db-a1d6-626ebb7158c5" />

### 플레이 영상



## 게임 흐름

```
START → GAMERULE → DIARY → INTRO → MAIN → (2분 30초 타이머 종료) → ENDING(HAPPY | BAD)
```

- **START / GAMERULE / DIARY**: 풀스크린 이미지, 클릭 시 다음 화면으로 전환
- **INTRO**: 고정 대사 3줄 순차 진행 (클릭할 때마다 다음 줄)
- **MAIN**: 아름이가 "흥..딱히 짝꿍이 됐다고 기쁜건 아니라구?... 잘 지냈어?" 인사 → 첫 클릭 시 2분 30초(150초) 타이머 시작 → 입력/로딩/응답 턴 반복
  - 우측 상단에 타이머(mm:ss), 바로 아래 호감도 숫자 항상 표시
  - 타이머가 0에 도달하는 즉시, 진행 중이던 입력/응답과 무관하게 강제로 엔딩으로 전환
  - 종료 시점 호감도 `>= 50` → 해피엔딩, 미만 → 배드엔딩
- **ENDING_HAPPY / ENDING_BAD**: 고정 시퀀스로 진행되는 엔딩 컷신, "다시 하기" 버튼으로 재시작

실제 대사/분기/이미지 매핑, 호감도 판정 기준, 시스템 프롬프트 전문의 **단일 진실 소스는
[GAME_FLOW.md](./GAME_FLOW.md)** 다. 동작을 변경할 때는 코드와 이 문서를 함께 갱신한다.

## 기술 스택

- **Next.js 14** (Pages Router — App Router로 마이그레이션하지 않음)
- **LLM**: OpenAI API (`gpt-4.1-mini`), 서버리스 API route(`pages/api/chat.js`)에서만 호출 (API 키는
  클라이언트에 절대 노출되지 않음)
- **스타일**: 순수 CSS (`styles/globals.css`), 별도 CSS 프레임워크 없음
- **상태관리**: React `useState`/`useEffect`만 사용, 별도 상태관리 라이브러리 없음
- **배포**: Vercel

## 로컬 실행

> 새 컴퓨터에서 처음 세팅하는 경우 [SETTING_GUIDE.md](./SETTING_GUIDE.md)를 참고.

```bash
npm install
cp .env.local.example .env.local   # OPENAI_API_KEY 값 채워넣기
npm run dev                        # http://localhost:3000
```

빌드 확인:

```bash
npm run build
```

### 개발자 디버그 모드

2분 30초 타이머를 매번 기다리지 않고 테스트하려면 URL에 `?debug=1`을 붙여서 접속한다
(예: `http://localhost:3000/?debug=1`). 브라우저 콘솔(F12)에서 아래 함수들을 바로 호출할 수 있다.

```js
debugArum.setTimeLeft(5)       // 타이머를 5초로 강제 변경 (곧 엔딩으로 전환됨)
debugArum.setLove(60)          // 호감도를 60으로 강제 변경
debugArum.skipToEnding()       // 현재 호감도 기준으로 즉시 엔딩 전환
debugArum.setPhase("main")     // start/gamerule/diary/intro/main/endingHappy/endingBad로 즉시 이동
debugArum.setEndingStep(2)     // 엔딩 컷신 단계 이동
```

`debug=1` 없이 접속하면 `window.debugArum`은 생성되지 않는다 (부스 방문객이 우연히
발견해서 타이머를 스킵할 수 없도록).

### 환경 변수

| 변수 | 설명 |
|---|---|
| `OPENAI_API_KEY` | [OpenAI 대시보드](https://platform.openai.com/api-keys)에서 발급받는 API 키. `.env.local`에만 저장하고 절대 커밋하지 않는다. |
| `OPENAI_MODEL` | (선택) 사용할 모델. 비워두면 `gpt-4.1-mini`. |

현재 `pages/api/chat.js`가 호출하는 모델은 기본값 `gpt-4.1-mini`다 (`OPENAI_MODEL`로 변경 가능).
부스 당일 전에 [OpenAI 대시보드](https://platform.openai.com/settings/organization/billing/overview)에서
크레딧 잔액을 확인해 둔다. 크레딧이 $0이 되면 API 호출이 멈춘다 (Auto-reload OFF 기준).

## 프로젝트 구조

```
pages/
  _app.js          # 글로벌 스타일 로드
  index.js         # 전체 상태머신(START~ENDING) + 화면 렌더링
  api/chat.js       # OpenAI 호출 서버리스 함수 (시스템 프롬프트, 호감도/감정 판정)
styles/
  globals.css       # 비주얼노벨 레이아웃(배경/캐릭터/대화창/HUD) 전역 스타일
public/images/      # 배경, 캐릭터 스프라이트, 대화창, 엔딩 이미지 (GAME_FLOW.md 에셋 매핑 표 참고)
GAME_FLOW.md        # 대사/분기/에셋 매핑/시스템 프롬프트의 단일 진실 소스
CLAUDE.md           # 프로젝트 규칙 (Claude Code 작업 시 참고)
```

## 핵심 규칙

- API 키는 서버 환경변수에서만 읽는다 (클라이언트 번들/로그/커밋에 노출 금지)
- 유저 입력은 클라이언트(`maxLength`)와 서버(`pages/api/chat.js`) 양쪽에서 50자로 제한
- 대화창 텍스트는 항상 검은색 (배경 이미지가 밝은 톤이라 가독성 확보)
- 호감도(`love_delta`)는 `-10 / 0 / +5 / +10` 중 하나만 반환되며, 판정 기준과 감정
  매핑 규칙은 [GAME_FLOW.md](./GAME_FLOW.md#5-호감도-판정-기준-love_delta)에 정리되어 있다
