import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { splitCharsByWord, wrapLine } from "./utils/split-text.js";

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

// 商品クレジット（NAME / PRICE / CLICK の罫線リスト）のリビール。
// 罫線 1 本ごとに 1 ステップ進め、その直下の行の文字を同じステップに載せる:
//   上罫線 + 1 行目 → 中間罫線 + 2 行目 → … → 最後の下罫線
// N 行のリストには罫線が N+1 本ある（上辺 1 本 + 各行の下辺 N 本）。
// 罫線は擬似要素なので GSAP のターゲットにできず、.look__heading と同じく
// カスタムプロパティ（look.css の opacity）経由で駆動する。
// 調整レバー
const CREDIT_TEXT_DURATION = 0.6; // セルが下からせり上がる時間（移動量は行の高さ 18px）
const CREDIT_CELL_STAGGER = 0.15; // 商品名 → 価格 → CLICK の間隔
// 罫線 1 本ぶんのステップ間隔。罫線の尺（下の逆算値）に対して小さすぎると
// 1px の薄い線では差が読み取れず「全部同時」に見えるので、尺の 1/4 程度は空ける
const CREDIT_ROW_STAGGER = 0.2;
const CREDIT_EASE = "power2.out";
const CREDITS_START = "top 85%"; // 移行前の data-animate と同じ発火位置

export const initCreditsReveal = () => {
  if (prefersReducedMotion) return;

  for (const list of document.querySelectorAll(".credits")) {
    const rows = [...list.querySelectorAll(".credits__item")];
    // 商品名 / 価格 / CLICK をそれぞれマスクで包む。querySelectorAll は
    // セレクタの並び順ではなく DOM 順で返すので、行内は必ず左からの順になる
    const rowLines = rows.map((row) =>
      [
        ...row.querySelectorAll(
          ".credits__name, .credits__price, .credits__action",
        ),
      ].map(wrapLine),
    );

    gsap.set(list, { "--credits-line-opacity": 0 });
    gsap.set(rows, { "--credits-item-line-opacity": 0 });
    gsap.set(rowLines.flat(), { yPercent: 100 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: list, start: CREDITS_START, once: true },
    });

    // 罫線の尺は固定値ではなく「同じステップで動く行の最後のセルが着地する時刻」から
    // 逆算する。セルは CREDIT_CELL_STAGGER ずつ遅れて始まるので、その遅れぶん
    // 罫線も長くする（CREDIT_CELL_STAGGER を変えても出切りが揃ったままになる）
    const lineDurationFor = (lines) =>
      CREDIT_TEXT_DURATION +
      CREDIT_CELL_STAGGER * Math.max(0, (lines?.length ?? 1) - 1);

    // 上罫線は 0 番目のステップ。同じステップで 1 行目の文字が出る
    tl.to(
      list,
      {
        "--credits-line-opacity": 1,
        duration: lineDurationFor(rowLines[0]),
        ease: CREDIT_EASE,
      },
      0,
    );

    for (const [i, row] of rows.entries()) {
      const at = i * CREDIT_ROW_STAGGER;

      // 行の文字は「その行の上にある罫線」と同じステップに載せる
      tl.to(
        rowLines[i],
        {
          yPercent: 0,
          duration: CREDIT_TEXT_DURATION,
          ease: CREDIT_EASE,
          stagger: CREDIT_CELL_STAGGER,
        },
        at,
      );

      // 行の下罫線は 1 ステップ後。次の行にとっては「上の罫線」にあたるので、
      // 尺は次の行のセルから逆算する（最終行の下には文字が無いので自分の行を流用）
      tl.to(
        row,
        {
          "--credits-item-line-opacity": 1,
          duration: lineDurationFor(rowLines[i + 1] ?? rowLines[i]),
          ease: CREDIT_EASE,
        },
        at + CREDIT_ROW_STAGGER,
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
//   data-animate-fade-ease … 透明度だけ別のイージングにする（既定は移動と同じ）
//   data-animate-fade-duration … 透明度だけ別の秒数にする（既定は移動と同じ）
//   data-animate-skew     … 出発時の skewY 傾き deg。負値で逆向き
export const initScrollAnimations = () => {
  if (prefersReducedMotion) return;

  for (const el of gsap.utils.toArray("[data-animate]")) {
    const {
      animateDistance = 30,
      animateDuration = 0.6,
      animateEase = "power2.out",
      animateStart = "top 85%",
      animateDelay = 0,
      animateFadeEase,
      animateFadeDuration,
      animateSkew = 0,
    } = el.dataset;

    const duration = Number(animateDuration);
    // 指定が無ければ移動と同尺に落ちる（既存要素の挙動は変わらない）
    const fadeDuration = Number(animateFadeDuration ?? animateDuration);

    // 透明度と移動でイージング・秒数を分けられるよう tween を 2 本に割る。
    // GSAP は 1 tween 内のプロパティ個別イージング（{ value, ease }）に対応しておらず、
    // 渡すとオブジェクトがそのまま代入されて壊れる（3.15 で実測）。
    // hero.js がフェードと移動を別 tween にしているのと同じ理由・同じ形
    const tl = gsap.timeline({
      delay: Number(animateDelay),
      scrollTrigger: {
        trigger: el,
        start: animateStart,
        once: true,
      },
    });

    tl.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        duration: fadeDuration,
        ease: animateFadeEase ?? animateEase,
      },
      0,
    );
    // skewY は移動と同じ tween に載せ、同じカーブで水平へ戻す。
    // 剪断が縦方向だけなので、rotate と違って横方向にはみ出さない
    tl.fromTo(
      el,
      { y: Number(animateDistance), skewY: Number(animateSkew) },
      { y: 0, skewY: 0, duration, ease: animateEase },
      0,
    );
  }
};
