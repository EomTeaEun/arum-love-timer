import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";

const TOTAL_TIME = 240;
const LOVE_THRESHOLD = 50;
const MAX_INPUT_LEN = 50;

const INTRO_LINES = [
  "새학기, 나는 소꿉친구인 공아름과 같은 반이 되었다.",
  "어렸을 때부터 그녀를 좋아했던 나는.. 이번 기회를 통해 그녀의 마음을 사로잡으려 한다.",
  "과연 난, 한정된 시간 안에 그녀의 마음을 얻을 수 있을까?",
];

const GREETING_TEXT = "안녕?";

const ENDING_HAPPY_STEPS = [
  { bg: "/images/end_background.png", text: "휴... 내가 잘 한걸까..." },
  { bg: "/images/end_background.png", text: "응? 갑자기 웬 문자가?" },
  { bg: "/images/end_background.png", center: "/images/happy_phone.png", text: "오 세상에," },
  { black: true, text: "그렇게 나는... 아름이와 롯데월드에 가게 되었다" },
  { black: true, text: "거기서 나는 공아름에게 고백했고" },
  { black: true, text: "우린 연인사이가 되었다" },
  { finalImage: "/images/happyend.png" },
];

const ENDING_BAD_STEPS = [
  { bg: "/images/end_background.png", text: "휴... 내가 잘 한걸까..." },
  { black: true, text: "하지만 다음 달, 내가 들은 소식은" },
  {
    bg: "/images/badend.png",
    text: "그녀에게 새 남자친구가 생겼다는 소식이었고, 나는 그녀와 영원히 이루어질 수 없었다.",
    final: true,
  },
];

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function clampLove(v) {
  return Math.max(0, Math.min(100, v));
}

export default function Home() {
  const [phase, setPhase] = useState("start");
  const [introStep, setIntroStep] = useState(0);
  const [mainStep, setMainStep] = useState("greeting");
  const [emotion, setEmotion] = useState("normal");
  const [love, setLove] = useState(0);
  const [reply, setReply] = useState(GREETING_TEXT);
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [timerActive, setTimerActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [endingStep, setEndingStep] = useState(1);

  const loveRef = useRef(love);
  const timeLeftRef = useRef(timeLeft);
  const abortRef = useRef(null);
  const timerIdRef = useRef(null);

  useEffect(() => {
    loveRef.current = love;
  }, [love]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const forceEnding = useCallback(() => {
    setTimerActive(false);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setEndingStep(1);
    setPhase(loveRef.current >= LOVE_THRESHOLD ? "endingHappy" : "endingBad");
  }, []);

  useEffect(() => {
    if (!timerActive) return undefined;
    timerIdRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIdRef.current);
          forceEnding();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerIdRef.current);
  }, [timerActive, forceEnding]);

  function handleGreetingClick() {
    setTimerActive(true);
    setMainStep("input");
  }

  function handleResponseClick() {
    setMainStep("input");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed || trimmed.length > MAX_INPUT_LEN) return;

    setErrorMsg("");
    setMainStep("loading");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, love: loveRef.current }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      // 타이머가 이미 종료되었거나 새 요청이 시작된 경우 응답을 버린다.
      if (timeLeftRef.current <= 0 || abortRef.current !== controller) return;

      setEmotion(data.emotion || "normal");
      setLove((prev) => clampLove(prev + (data.love_delta || 0)));
      setReply(data.reply || "");
      setUserInput("");
      setMainStep("response");
    } catch (err) {
      if (controller.signal.aborted) return;
      setErrorMsg("아름이에게 연락이 닿지 않았어. 다시 시도해줘.");
      setMainStep("input");
    }
  }

  function handleIntroClick() {
    if (introStep < INTRO_LINES.length - 1) {
      setIntroStep((s) => s + 1);
    } else {
      setPhase("main");
    }
  }

  function handleRestart() {
    setPhase("start");
    setIntroStep(0);
    setMainStep("greeting");
    setEmotion("normal");
    setLove(0);
    setReply(GREETING_TEXT);
    setUserInput("");
    setTimeLeft(TOTAL_TIME);
    setTimerActive(false);
    setErrorMsg("");
    setEndingStep(1);
  }

  function renderEnding(steps) {
    const step = steps[endingStep - 1];
    const isLast = endingStep === steps.length;
    const advance = () => setEndingStep((s) => s + 1);

    if (step.finalImage) {
      return (
        <div className="app-container ratio-16-9">
          <img src={step.finalImage} alt="엔딩" className="fullscreen-image" />
          <button className="restart-btn" onClick={handleRestart}>
            다시 하기
          </button>
        </div>
      );
    }

    const sceneClass = step.black ? "black-scene" : "scene";
    const sceneStyle = step.black ? {} : { backgroundImage: `url(${step.bg})` };

    return (
      <div className="app-container ratio-16-9">
        <div className={sceneClass} style={sceneStyle}>
          {step.center && (
            <div className="center-image-wrap">
              <img src={step.center} alt="" className="center-image" />
            </div>
          )}
          <div
            className={`dialogue-box${isLast ? "" : " clickable"}`}
            style={{ backgroundImage: "url(/images/conversation_me.png)" }}
            onClick={isLast ? undefined : advance}
          >
            <p className="dialogue-text">{step.text}</p>
          </div>
          {step.final && (
            <button className="restart-btn" onClick={handleRestart}>
              다시 하기
            </button>
          )}
        </div>
      </div>
    );
  }

  let content = null;

  if (phase === "start") {
    content = (
      <div className="app-container ratio-16-9">
        <div className="fullscreen-click" onClick={() => setPhase("gamerule")}>
          <img src="/images/start.png" alt="시작" className="fullscreen-image" />
        </div>
      </div>
    );
  } else if (phase === "gamerule") {
    content = (
      <div className="app-container ratio-16-9">
        <div className="fullscreen-click" onClick={() => setPhase("diary")}>
          <img src="/images/gamerule.png" alt="게임 규칙" className="fullscreen-image" />
        </div>
      </div>
    );
  } else if (phase === "diary") {
    content = (
      <div className="app-container ratio-16-9">
        <div className="fullscreen-click" onClick={() => setPhase("intro")}>
          <img src="/images/diary.png" alt="아름이의 일기장" className="fullscreen-image" />
        </div>
      </div>
    );
  } else if (phase === "intro") {
    content = (
      <div className="app-container ratio-4-3">
        <div
          className="scene clickable"
          style={{ backgroundImage: "url(/images/start_background.png)" }}
          onClick={handleIntroClick}
        >
          <div
            className="dialogue-box"
            style={{ backgroundImage: "url(/images/conversation_me.png)" }}
          >
            <p className="dialogue-text">{INTRO_LINES[introStep]}</p>
          </div>
        </div>
      </div>
    );
  } else if (phase === "main") {
    content = (
      <div className="app-container ratio-4-3">
        <div
          className="scene"
          style={{ backgroundImage: "url(/images/main_background.png)" }}
        >
          <div className="hud">
            <div className="timer">{formatTime(timeLeft)}</div>
            <div className="love">호감도: {love}</div>
          </div>
          <img
            src={`/images/${emotion}.png`}
            alt={emotion}
            className="character-sprite"
          />

          {mainStep === "greeting" && (
            <div
              className="dialogue-box clickable"
              style={{ backgroundImage: "url(/images/conversation_girl.png)" }}
              onClick={handleGreetingClick}
            >
              <p className="dialogue-text">{GREETING_TEXT}</p>
            </div>
          )}

          {mainStep === "input" && (
            <div
              className="dialogue-box"
              style={{ backgroundImage: "url(/images/conversation_me.png)" }}
            >
              <form className="input-row" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={userInput}
                  maxLength={MAX_INPUT_LEN}
                  placeholder="아름이에게 할 말을 입력해봐..."
                  onChange={(e) => setUserInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={!userInput.trim()}>
                  전송
                </button>
              </form>
              <div className="input-hint">
                {userInput.length}/{MAX_INPUT_LEN}
              </div>
              {errorMsg && <p className="error-text">{errorMsg}</p>}
            </div>
          )}

          {mainStep === "loading" && (
            <div
              className="dialogue-box"
              style={{ backgroundImage: "url(/images/conversation_me.png)" }}
            >
              <p className="loading-text">(아름이가 생각 중...)</p>
            </div>
          )}

          {mainStep === "response" && (
            <div
              className="dialogue-box clickable"
              style={{ backgroundImage: "url(/images/conversation_girl.png)" }}
              onClick={handleResponseClick}
            >
              <p className="dialogue-text">{reply}</p>
            </div>
          )}
        </div>
      </div>
    );
  } else if (phase === "endingHappy") {
    content = renderEnding(ENDING_HAPPY_STEPS);
  } else if (phase === "endingBad") {
    content = renderEnding(ENDING_BAD_STEPS);
  }

  return (
    <>
      <Head>
        <title>내 소꿉친구가 이렇게 귀여울리 없어</title>
      </Head>
      {content}
    </>
  );
}
