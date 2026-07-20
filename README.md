<img width="1440" height="790" alt="image" src="https://github.com/user-attachments/assets/d3af0739-4056-419e-ace7-411d35870cbe" /># 내 소꿉친구가 이렇게 귀여울리 없어

공모전/부스 전시용 미니 비주얼노벨 웹앱. 유저가 자연어로 대사를 입력하면 Gemini API가
히로인 "공아름"의 대사/감정/호감도 변화를 실시간으로 판정해서 반환한다. 4분 제한시간 안에
호감도 임계값(50) 도달 여부로 해피엔딩/배드엔딩이 갈린다.

## 스크린샷 & 플레이 영상

<!--
아래에 플레이 스크린샷/영상을 채워 넣으세요. 두 가지 방법 중 편한 쪽으로 하면 됩니다.

방법 1) GitHub에 바로 업로드 (추천 — 리포지토리 용량 관리 필요 없음)
  github.com에서 이 README.md를 "Edit" 모드로 연 다음, 이미지/영상 파일을
  본문에 드래그 앤 드롭하면 GitHub이 자동으로 CDN URL(user-attachments/assets/...)을
  만들어 붙여줍니다. 영상도 mp4로 드래그하면 재생 가능한 플레이어로 바로 삽입됩니다.
  그렇게 생성된 마크다운을 아래 표/영상 자리에 그대로 옮기면 됩니다.

방법 2) 리포지토리에 파일로 추가
  docs/screenshots/ 폴더를 만들어 이미지 파일을 넣고, 아래 경로를 실제
  파일명으로 바꾸면 됩니다.
-->

### 스크린샷

| 시작 화면 | 메인 대화 | 해피엔딩 |
|---|---|---|
| <img width="1440" height="790" alt="image" src="https://github.com/user-attachments/assets/3be7e5e2-eb6e-4df6-a729-a740c0cf18ab" />
 | <img width="973" height="784" alt="image" src="https://github.com/user-attachments/assets/fb36f29b-c67c-4408-88ff-9f6b9dcde655" />
 | ![해피엔딩](docs/screenshots/happy-ending.png) |

<img width="969" height="700" alt="image" src="https://github.com/user-attachments/assets/c438d126-8db2-49db-a1d6-626ebb7158c5" />

### 플레이 영상

<!-- GitHub 웹 에디터에 mp4를 드래그 앤 드롭해서 생성된 링크/영상 태그를 여기에 붙여넣으세요 -->

## 게임 흐름

```
START → GAMERULE → DIARY → INTRO → MAIN → (4분 타이머 종료) → ENDING(HAPPY | BAD)
```

- **START / GAMERULE / DIARY**: 풀스크린 이미지, 클릭 시 다음 화면으로 전환
- **INTRO**: 고정 대사 3줄 순차 진행 (클릭할 때마다 다음 줄)
- **MAIN**: 아름이가 "안녕?" 인사 → 첫 클릭 시 4분(240초) 타이머 시작 → 입력/로딩/응답 턴 반복
  - 우측 상단에 타이머(mm:ss), 바로 아래 호감도 숫자 항상 표시
  - 타이머가 0에 도달하는 즉시, 진행 중이던 입력/응답과 무관하게 강제로 엔딩으로 전환
  - 종료 시점 호감도 `>= 50` → 해피엔딩, 미만 → 배드엔딩
- **ENDING_HAPPY / ENDING_BAD**: 고정 시퀀스로 진행되는 엔딩 컷신, "다시 하기" 버튼으로 재시작

실제 대사/분기/이미지 매핑, 호감도 판정 기준, 시스템 프롬프트 전문의 **단일 진실 소스는
[GAME_FLOW.md](./GAME_FLOW.md)** 다. 동작을 변경할 때는 코드와 이 문서를 함께 갱신한다.

## 기술 스택

- **Next.js 14** (Pages Router — App Router로 마이그레이션하지 않음)
- **LLM**: Gemini API, 서버리스 API route(`pages/api/chat.js`)에서만 호출 (API 키는
  클라이언트에 절대 노출되지 않음)
- **스타일**: 순수 CSS (`styles/globals.css`), 별도 CSS 프레임워크 없음
- **상태관리**: React `useState`/`useEffect`만 사용, 별도 상태관리 라이브러리 없음
- **배포**: Vercel

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # GEMINI_API_KEY 값 채워넣기
npm run dev                        # http://localhost:3000
```

빌드 확인:

```bash
npm run build
```

### 환경 변수

| 변수 | 설명 |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey)에서 발급받는 Gemini API 키. `.env.local`에만 저장하고 절대 커밋하지 않는다. |

현재 `pages/api/chat.js`가 호출하는 모델은 `gemini-flash-lite-latest`다. 무료 티어 기준
모델별 일일 요청 한도가 낮은 편이라(모델에 따라 하루 20회 수준까지도 있었음), 부스
당일 트래픽이 많을 것으로 예상되면 사전에 [Google AI Studio](https://aistudio.google.com)
대시보드에서 쿼터를 확인하거나 결제 계정을 등록해두는 것을 권장한다.

## 프로젝트 구조

```
pages/
  _app.js          # 글로벌 스타일 로드
  index.js         # 전체 상태머신(START~ENDING) + 화면 렌더링
  api/chat.js       # Gemini 호출 서버리스 함수 (시스템 프롬프트, 호감도/감정 판정)
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
