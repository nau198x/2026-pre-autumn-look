import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { splitCharsByWord } from "./utils/split-text.js";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// 背面に sticky で留まる Hero を、コンテンツのせり上がりに合わせてゆっくり上へ逃がす。
// Hero 速度 0.15 対 コンテンツ速度 1 の差がパララックスになる。
export const initHeroParallax = () => {
  const hero = document.querySelector(".hero");
  const contents = document.querySelector(".contents");
  if (!hero || !contents || prefersReducedMotion) return;

  // トリガーは sticky な .hero ではなく通常フローの .contents を使う。
  // sticky 要素は「貼り付いた位置」で測られるため、スクロール途中の
  // ScrollTrigger.refresh()（リサイズ等）で start / end が狂う。
  gsap.to(hero, {
    yPercent: -15,
    ease: "none",
    scrollTrigger: {
      trigger: contents,
      start: "top bottom", // スクロール 0（.contents の上端が画面下端）
      end: "top top", // 1 画面ぶんスクロールし切り、Hero が覆い隠された地点
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
};

// Look 見出し（08 │ AUGUST COLLECTION）のリビール。
// 上下罫線で枠を作ってから、番号 → 縦罫 → 英字 を少しずつ重ねながら連鎖させる。
// 調整レバー
// 以下の秒数はすべて「等倍のときの値」。最後に TEMPO でまとめて再生速度を上げる。
// 個々の定数を触ると相対的なリズムが崩れるので、全体の速さはここだけで調整すること
const TEMPO = 1.6;
// 上下罫線の尺は固定値ではなく「英字の最終文字が着地する時刻」から逆算する
// （文字数や CHAR_STAGGER を変えても引き終わりが自動で追従する）。
// LINE_RATIO はその何割で引き終えるか。1 で英字と同時、小さいほど先に完成する
const LINE_RATIO = 0.8;
// 2 秒級の尺では inOut の出だしが 0.4 秒ほぼ静止に見えるため out を使う
const LINE_EASE = "power1.out";
const TEXT_START = 0.5; // 罫線を引き始めてから文字リビールが入るまで（秒）
const CHAR_DURATION = 0.8; // 1 文字あたりのせり上がり時間
const CHAR_STAGGER = 0.02; // 文字と文字の間隔
// 以下 2 つは縦罫（.look__heading-rule）用。上下罫線の LINE_* とは別物
const RULE_AT = 0.25; // 番号のせり上がり途中で縦罫を差し込む位置（秒）
const RULE_DURATION = 0.3;
const TEXT_AT = 0.4; // 縦罫の直後に英字が追いかけ始める位置（秒）
// リード文は罫線を引き終えてから。Y 移動は付けずフェードのみ
const LEAD_DURATION = 1.2;
const LEAD_EASE = "power1.out";
// .look__lead と同じ開始位置。見出しはリード文より上にあるぶん必ず先に発火する
const HEADING_START = "top 85%";

export const initLookHeadingReveal = () => {
  // reduced-motion では分割自体を行わない（分割済み DOM に依存する処理が他に無く、
  // 素のテキストのままのほうが読み上げ・表示とも安全なため）
  if (prefersReducedMotion) return;

  for (const heading of document.querySelectorAll(".look__heading")) {
    const num = heading.querySelector(".look__heading-num");
    const rule = heading.querySelector(".look__heading-rule");
    const text = heading.querySelector(".look__heading-text");
    if (!num || !text) continue;

    // 読み上げ名は分割前のテキストを <h3> 自身の aria-label に退避する。
    // aria-label は role を持たない素の <span> では無視される仕様なので、
    // 分割対象の span ではなく role=heading を持つ <h3> に付ける
    if (!heading.hasAttribute("aria-label")) {
      heading.setAttribute(
        "aria-label",
        heading.textContent.trim().replace(/\s+/g, " "),
      );
    }

    const numChars = splitCharsByWord(num);
    const textChars = splitCharsByWord(text);
    const lead = heading.closest(".look__header")?.querySelector(".look__lead");

    // 英字の最終文字が着地する時刻。リード文の開始をここに揃え、罫線は
    // これに LINE_RATIO を掛けた尺で少し先に引き終える。
    // 09 SEPTEMBER COLLECTION（19 文字）で 0.5 + 0.4 + 0.8 + 0.02 × 18 = 2.06 秒
    const textEnd =
      TEXT_START +
      TEXT_AT +
      CHAR_DURATION +
      CHAR_STAGGER * (textChars.length - 1);

    gsap.set([...numChars, ...textChars], { yPercent: 100 });
    gsap.set(rule, { opacity: 0 });
    gsap.set(heading, { "--heading-line-scale": 0 });
    if (lead) gsap.set(lead, { opacity: 0 });

    const tl = gsap
      .timeline({
        scrollTrigger: { trigger: heading, start: HEADING_START, once: true },
      })
      .timeScale(TEMPO);

    tl.to(
      heading,
      {
        "--heading-line-scale": 1,
        duration: textEnd * LINE_RATIO,
        ease: LINE_EASE,
      },
      0,
    );
    tl.to(
      numChars,
      {
        yPercent: 0,
        duration: CHAR_DURATION,
        ease: "power2.out",
        stagger: CHAR_STAGGER,
      },
      TEXT_START,
    );
    tl.to(
      rule,
      { opacity: 1, duration: RULE_DURATION, ease: "power1.out" },
      TEXT_START + RULE_AT,
    );
    tl.to(
      textChars,
      {
        yPercent: 0,
        duration: CHAR_DURATION,
        ease: "power2.out",
        stagger: CHAR_STAGGER,
      },
      TEXT_START + TEXT_AT,
    );

    // リード文は見出しのタイムラインに繋ぐ。独立した ScrollTrigger のままだと
    // 発火がスクロール位置で決まってしまい「罫線の後」を保証できない
    if (lead) {
      tl.fromTo(
        lead,
        { opacity: 0 },
        { opacity: 1, duration: LEAD_DURATION, ease: LEAD_EASE },
        textEnd,
      );
    }
  }
};

// [data-animate] を一括で拾うスクロールリビール。
// セクションごとの差は HTML 側のデータ属性で上書きする（JS を触らずに調整できる）:
//   data-animate-distance … 下からの移動量 px。0 でフェードのみ
//   data-animate-duration … 秒数
//   data-animate-ease     … イージング
//   data-animate-start    … ScrollTrigger の開始位置
//   data-animate-delay    … 開始遅延 秒
export const initScrollAnimations = () => {
  if (prefersReducedMotion) return;

  for (const el of gsap.utils.toArray("[data-animate]")) {
    const {
      animateDistance = 30,
      animateDuration = 0.6,
      animateEase = "power2.out",
      animateStart = "top 85%",
      animateDelay = 0,
    } = el.dataset;

    gsap.fromTo(
      el,
      { opacity: 0, y: Number(animateDistance) },
      {
        opacity: 1,
        y: 0,
        duration: Number(animateDuration),
        delay: Number(animateDelay),
        ease: animateEase,
        scrollTrigger: {
          trigger: el,
          start: animateStart,
          once: true,
        },
      },
    );
  }
};
