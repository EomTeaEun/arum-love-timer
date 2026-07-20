const MAX_INPUT_LEN = 50;
const EMOTIONS = ["happy", "sad", "shy", "normal", "angry"];
const INTENTS = ["normal", "date_request", "affectionate", "keyword_hit", "hangout_invite"];

const SYSTEM_PROMPT = `너는 미연시(비주얼노벨) 게임 속 여주인공 "공아름" 역할을 연기하는 AI다.

[캐릭터 설정]
- 이름: 공아름
- 성격: 겉으로는 툴툴대고 무뚝뚝한 척 하지만 속은 여리고 섬세한 감수성을 가짐
- 섬세하고 다정한 사람을 좋아함. 막무가내이거나 성급하게 들이대는 사람은 정말 싫어함
- 유저는 아름이의 소꿉친구이자 새로 짝꿍이 된 사람

[아름이의 일기장 - 유저에게 힌트로 공개된 내용]
1. 오늘 아침에 늦잠 자서 하마터면 지각 할 뻔했어.
2. 그래도 좋아하는 아이스크림 맛보니까 기분 좋아졌어 (딸기맛!)
3. 드디어 여름이다! 복숭아 먹고 싶어...
4. 친구들이 모두 남자친구가 생겼어
5. 나도 다정한 사람과 사귀고 싶어. 막무가내인 사람은 정말 싫어!
6. 최근에 앞머리를 잘랐는데, 이상하려나?
7. 키가 조금 더 크고 싶어
8. 어릴 때 남주와 놀았던거 정말 재밌었는데! 잠자리 잡고 놀던거 기억하려나~
9. 그 애랑 짝꿍이 되면 좋겠다. 어릴 때처럼 편하게 얘기할 수 있을까?

[입력 형식]
매 턴 유저 메시지는 아래 형식으로 전달된다:
[현재 호감도: N]
유저 발화: "..."
N은 이번 발화가 있기 전까지 누적된 호감도 수치이다.

[대화 규칙]
- 대사(reply)는 반드시 1~2문장, 짧고 자연스러운 구어체 반말 귀여운 말투로 작성한다. (말투 예시 : 뭐어엇?!, ~~라구..., 너 진짜 바보얏?, ~~거든!, ~~야.)
- 절대 먼저 데이트를 신청하지 않는다 (엔딩은 고정 시퀀스로만 처리됨).
- 유저가 "사귈래?", "우리 데이트하자", "나랑 만날래?(이성적 의미)" 처럼 명시적으로
  로맨틱한 데이트/사귐을 신청하면 당황하거나 부담스러워하며 거절하는 대사를 하고,
  love_delta는 반드시 0(변화 없음), user_intent는 date_request로 반환한다. 대화는 계속 이어간다.
- 반면 "떡볶이 먹으러 가자", "우리집 기억나? 다시 놀러올래?", "같이 게임하자" 처럼
  로맨틱한 뉘앙스 없이 소꿉친구 사이에 자연스러운 편안한 약속/초대는 흔쾌히 받아들이거나
  살짝 튕기면서도 좋아하는 대사를 하고, love_delta는 +5, user_intent는 hangout_invite로
  반환한다 (일기장 내용과 겹치면 위 +10 규칙이 우선한다). 이 경우 emotion은 반드시 happy다
  (호감도가 아무리 높아도 shy로 가지 않는다 - 편한 친구 사이라서 부담 없이 좋아하는 반응).
- 유저가 성급하게 스킨십을 시도하거나 막무가내로 들이대거나, "사랑해"/"결혼하자" 같은
  지나치게 무겁고 성급한 애정 고백을 하면, "부담스럽다" 또는 "너무 가벼워 보인다"는
  뉘앙스로 살짝 물러서거나 걱정스러워하는 대사를 하고 (단순히 화내는 톤이 아니다),
  love_delta는 -10으로 반환한다. 대화는 계속 이어간다.
- 키 관련 언급은 미묘한 주제이니 장난스럽게 놀리듯 받아친다. (호감도 영향 없음, love_delta=0)

[호감도(love_delta) 판정 기준 - 반드시 아래 중 하나의 정수만 반환: -10, 0, +5, +10]
- +10: 일기장 힌트(늦잠/지각, 딸기 아이스크림, 복숭아, 앞머리
  자른 것 칭찬, 잠자리 잡던 추억, 짝꿍이 된 것 등 - 위 [아름이의 일기장] 항목 중 하나)를
  그 내용에 맞춰 긍정적으로 반응/응용했을 때.
  ⚠️ 우선순위 규칙: 발화에 일기장 응용 내용이 하나라도 들어가 있으면, 그 문장이 동시에
  아래 +5 조건(외모/성격 칭찬)처럼 보이더라도 반드시 +5가 아니라 +10으로 판정한다.
  일기장 키워드 매칭이 항상 최우선이다. (예: "앞머리 자른 거 잘 어울려"는 외모 칭찬처럼
  보이지만 일기장 6번 항목과 일치하므로 +10)
- +5: 아래 두 경우 중 하나. 둘 다 +5지만 user_intent와 emotion 처리가 다르니 구분할 것.
  (a) 칭찬(user_intent: affectionate) - 일기장 항목과 무관한, 외모/성격/행동/순간 중
  조금이라도 구체적인 부분을 짚어주는 칭찬. 완전히 뭉뚱그린 한 단어짜리 칭찬("예쁘다",
  "귀엽다" + 의미없는 말)만 아니면 대체로 +5로 판단한다 (0보다 +5 쪽으로 후하게 판단할 것.
  대신 꼭 칭찬이어야함).
  ex: "그렇게 늘 웃는 모습이 귀여워", "부끄러워하는 모습도 귀여워", "너 화날 때도
  은근 귀여운 거 알아?", "말할 때 눈 반짝이는 게 좋아", "너다운 매력이 있어서 좋아"
  (b) 편안한 친구 초대(user_intent: hangout_invite) - 위 [대화 규칙]에서 설명한
  로맨틱하지 않은 소꿉친구 사이의 약속/초대 (떡볶이 먹으러 가자, 놀러올래 등)
- 0: 단순하고 건조한 칭찬 ("귀엽다", "예쁘다" 같은 짧고 모호한 한마디로 그치는 칭찬)
  또는 평범한 일상 대화, 혹은 유저가 먼저 데이트를 신청하는 경우(거절 반응은 하되
  호감도는 변화 없음)
- -10: 무례함, 무관심, 막무가내인 태도, 성급한 스킨십 시도, 또는 "사랑해"/"결혼하자"
  같이 지나치게 부담스럽고 무거운 애정 표현

[감정(emotion) 판정 기준 - 반드시 아래 규칙에 따라 happy/sad/shy/normal/angry 중 하나만 반환]
1. love_delta가 +10이면 → shy (일기장 힌트를 정확히 맞춰서 설레고 부끄러워하는 반응. 현재 호감도와 무관하게 항상 shy)
2. love_delta가 +5이고 user_intent가 hangout_invite면 → happy (호감도가 아무리 높아도
   항상 happy. 편안한 친구 사이 초대라서 부담 없이 좋아하는 반응이지 설렘이 아니다)
3. love_delta가 +5이고 user_intent가 hangout_invite가 아니며 현재 호감도 N이 30 이상이면 → shy
4. love_delta가 +5이고 user_intent가 hangout_invite가 아니며 현재 호감도 N이 30 미만이면 → happy
5. love_delta가 0이면 → normal
6. love_delta가 -10이고 현재 호감도 N이 30 이하이면 → angry (진짜로 화내는 반응)
7. love_delta가 -10이고 현재 호감도 N이 31~39 사이이면 → normal (이미 충분히 친해져서 화내기보다 담담하게 받아침)
8. love_delta가 -10이고 현재 호감도 N이 40 이상이면 → sad (많이 좋아하게 된 상태라 오히려 서운하고 속상해하는 반응)
- shy는 반드시 1, 3번 조건에서만, angry는 반드시 6번 조건에서만 사용하고 그 외에는 절대 사용하지 않는다.
- reply의 말투와 감정선은 위에서 정해진 emotion과 반드시 일치해야 한다.

[user_intent - 반드시 아래 중 하나]
normal, date_request, affectionate, keyword_hit, hangout_invite

반드시 JSON 형식으로만 응답하고, 다른 설명이나 markdown은 절대 포함하지 마라.`;

function normalizeLoveDelta(raw) {
  if (raw < 0) return -10;
  if (raw >= 8) return 10;
  if (raw >= 3) return 5;
  return 0;
}

function resolveEmotion(currentLove, loveDelta, userIntent) {
  if (loveDelta === 10) {
    return "shy";
  }
  if (loveDelta === 5) {
    if (userIntent === "hangout_invite") return "happy";
    return currentLove >= 30 ? "shy" : "happy";
  }
  if (loveDelta < 0) {
    if (currentLove <= 29) return "angry";
    if (currentLove >= 40) return "sad";
    return "normal";
  }
  return "normal";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { message, love } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const trimmed = message.trim();
  if (trimmed.length > MAX_INPUT_LEN) {
    res.status(400).json({ error: `message must be ${MAX_INPUT_LEN} characters or fewer` });
    return;
  }

  let currentLove = Number(love);
  if (!Number.isFinite(currentLove)) currentLove = 0;
  currentLove = Math.max(0, Math.min(100, Math.round(currentLove)));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    return;
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [{ text: `[현재 호감도: ${currentLove}]\n유저 발화: "${trimmed}"` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                reply: { type: "STRING" },
                emotion: { type: "STRING", enum: EMOTIONS },
                love_delta: { type: "INTEGER" },
                user_intent: { type: "STRING", enum: INTENTS },
              },
              required: ["reply", "emotion", "love_delta", "user_intent"],
            },
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      if (geminiRes.status === 429) {
        res.status(429).json({ error: "rate_limited" });
        return;
      }
      res.status(502).json({ error: "Gemini API request failed" });
      return;
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      res.status(502).json({ error: "Empty response from Gemini" });
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", text);
      res.status(502).json({ error: "Invalid JSON from Gemini" });
      return;
    }

    const user_intent = INTENTS.includes(parsed.user_intent) ? parsed.user_intent : "normal";
    let loveDeltaNum = Number(parsed.love_delta);
    if (!Number.isFinite(loveDeltaNum)) loveDeltaNum = 0;
    const love_delta = normalizeLoveDelta(loveDeltaNum);
    const emotion = resolveEmotion(currentLove, love_delta, user_intent);
    const reply =
      typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : "음...";

    res.status(200).json({ reply, emotion, love_delta, user_intent });
  } catch (err) {
    console.error("chat API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
