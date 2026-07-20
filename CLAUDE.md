# CLAUDE.md

## 프로젝트 개요
"내 소꿉친구가 이렇게 귀여울리 없어" — 공모전/부스 전시용 미니 비주얼노벨 웹앱.
유저가 자연어로 대사를 입력하면 Gemini API가 히로인의 대사/감정/호감도 변화를
실시간으로 판정해서 반환한다. 4분 제한시간 안에 호감도 임계값(50) 도달 여부로
해피엔딩/배드엔딩이 갈린다.

이 문서(CLAUDE.md)는 프로젝트 전반의 규칙을, **GAME_FLOW.md는 실제 대사/분기/
이미지 매핑의 단일 진실 소스(source of truth)**로 취급한다. 두 문서가 충돌하면
GAME_FLOW.md의 내용을 우선한다.

## 기술 스택
- Next.js (Pages Router 유지, App Router로 마이그레이션하지 말 것)
- 배포: Vercel
- LLM: Gemini API (`gemini-2.5-flash`), 반드시 `pages/api/chat.js` 같은
  서버리스 API route 안에서만 호출한다. API 키를 클라이언트 번들에 절대 노출하지 않는다.
- 스타일: 순수 CSS (Tailwind 등 추가 프레임워크 도입하지 말 것 — 기존 구조 유지)
- 상태관리: React useState/useEffect로 충분함. 별도 상태관리 라이브러리 불필요.

## 이미지 에셋
- 원본 파일 경로: `user/CONTEST/EngineeringFair/images`
- 이 파일들을 프로젝트의 `public/images/` 디렉토리로 복사한 뒤,
  코드에서는 항상 `/images/파일명.png` 형태의 절대경로로 참조한다. (이미 있으면 그냥 그걸로 만들면 된다)
- 전체 파일 목록과 각 파일이 어느 화면/상태에서 쓰이는지는
  GAME_FLOW.md의 "에셋 매핑" 표를 참고한다.
- ⚠️ 파일명 주의: 최초 시작 화면 이미지가 대화 중 `start.png`로 언급되었으나
  실제 제공된 폴더에는 `strat.png`(오타로 추정)로 존재한다.
  **실제 파일명인 `strat.png` 기준으로 구현**하고, 빌드 전 사용자에게
  파일명이 맞는지 한 번 확인받을 것.

## 핵심 불변 규칙 (반드시 지킬 것)
1. **API 키 보안** — `.env.local` / Vercel 환경변수에서만 읽는다. 클라이언트 코드,
   콘솔 로그, 커밋에 키 값이 노출되면 안 된다.
2. **타이머 강제 컷오프** — 4분(240초) 타이머가 0이 되는 순간, 유저가 입력 중이든
   API 응답을 기다리는 중이든 상관없이 즉시 엔딩 상태로 전환한다. 진행 중이던
   턴의 결과는 반영하지 않는다.
3. **호감도 상시 노출** — 화면 우측 상단 타이머 바로 아래에 현재 호감도 숫자를
   항상 표시한다 (디버깅 목적 + 유저가 진행 상황을 파악할 수 있게).
4. **대화창 텍스트는 항상 검은색**으로 통일한다 (conversation_me.png,
   conversation_girl.png 배경 이미지가 밝은 톤이므로).
5. **유저 입력 50자 제한**을 클라이언트(입력창 maxLength)와 서버(API route 검증)
   양쪽에서 강제한다.
6. **대사/분기/이미지 시퀀스는 절대 임의로 바꾸지 말고 GAME_FLOW.md를 그대로 구현**한다.
   순서, 문구, 트리거 조건을 하나라도 누락/변형하지 않는다.

## 화면 배경 이미지 교체 원칙
- 이번 작업에서는 전달된 실제 일러스트/스크린 이미지로 전부 교체한다.
- 감정별 캐릭터 스프라이트(happy/sad/shy/normal/angry)는 배경 위에 겹쳐서
  표시되는 레이어다 (배경은 main_background.png 고정, 캐릭터만 감정에 따라 교체).
- conversation_me.png / conversation_girl.png는 입력창과 응답창 각각의
  이미지로 사용한다 (background 위에 표시) (CSS background-image, 텍스트는 그 위에 검은색으로 오버레이).

## 작업 순서 권장
1. GAME_FLOW.md를 먼저 정독하고 전체 상태 흐름을 State Machine 다이어그램처럼 이해한다.
2. 기존 `pages/index.js`의 상태 전환 로직(phase 관리) 골격은 재사용하되,
   화면 수를 GAME_FLOW.md의 상태 목록에 맞게 확장한다 (START/GAMERULE/DIARY/
   INTRO/MAIN/ENDING_HAPPY/ENDING_BAD 등 세분화).
3. `pages/api/chat.js`의 시스템 프롬프트는 GAME_FLOW.md의 "시스템 프롬프트" 섹션
   내용으로 교체한다.
4. 이미지 교체 후 `npm run build`로 빌드 에러 없는지 반드시 확인한다.
5. 완료 후 로컬(`npm run dev`)에서 전체 플로우(시작→규칙→일기장→인트로→
   메인→엔딩)를 한 번 끝까지 실행해서 확인한다.
