# リビールプリセット集（GSAP）

references/split-chars.md で分割済みであることが前提。各プリセットは「初期状態の `gsap.set`」→「トリガー（`loading:complete` or ScrollTrigger）」→「タイムライン」の 3 点セットで完結する。

共通の reduced-motion 分岐（全プリセットの冒頭に置く）:

```js
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefersReducedMotion) {
  // 分割済みの文字を最終状態で即時表示
  gsap.set(document.querySelectorAll(".char"), { opacity: 1, yPercent: 0, clearProps: "filter,transform" });
  return;
}
```

## プリセット a: 順次 stagger フェード（2 段階 opacity）

適用条件: 上品・控えめにしたい。実装コスト最小。フラット分割で可。

`0 → 0.4 → 1` の 2 段階に分けて重ねると、単純フェードより「インクが染みる」ような質感になる。1 段で十分なら前半の tween を削る。

```js
import { splitCharsFlat } from "./split-text.js";

export const initHeadingFade = (selector = ".hero__title") => {
  const heading = document.querySelector(selector);
  if (!heading) return;
  const chars = splitCharsFlat(heading);

  gsap.set(chars, { opacity: 0 });

  const start = () => {
    const tl = gsap.timeline({ delay: 0.2 });
    tl.to(chars, { opacity: 0.4, duration: 0.4, stagger: 0.08, ease: "power1.out" });
    tl.to(chars, { opacity: 1, duration: 0.4, stagger: 0.08, ease: "power1.out" }, "-=1");
  };

  document.addEventListener("loading:complete", start, { once: true });
  setTimeout(start, 8000); // フォールバック（二重実行は timeline 生成前に played フラグで防ぐなら追加）
};
```

## プリセット b: シード付きランダム順 blur フェード

適用条件: ヒーロータイトルの主役演出。ランダムに文字のフォーカスが合っていく。順序はシード固定で毎回同じ。

```js
import { splitCharsFlat } from "./split-text.js";
import { seededShuffle } from "./seeded-random.js";

const SHUFFLE_SEED = 7; // 変えると順序が変わる。決めたら固定
const BLUR_START = 8; // px

export const initHeroTitle = () => {
  const title = document.querySelector(".hero__title");
  if (!title) return;

  const chars = splitCharsFlat(title);
  const shuffled = seededShuffle(Array.from(chars), SHUFFLE_SEED);

  gsap.set(chars, { opacity: 0, filter: `blur(${BLUR_START}px)` });

  let played = false;
  const start = () => {
    if (played) return;
    played = true;

    gsap.fromTo(
      shuffled, // シャッフル順の配列を渡す = stagger がランダム順に効く
      { opacity: 0, filter: `blur(${BLUR_START}px)` },
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 1.4,
        stagger: 0.2,
        ease: "power1.out",
        onComplete: () => {
          // filter を残すと合成レイヤーが増えたままになるので必ず除去
          gsap.set(chars, { clearProps: "opacity,filter" });
        },
      },
    );
  };

  document.addEventListener("loading:complete", start, { once: true });
  setTimeout(start, 8000); // フォールバック
};
```

調整: `stagger: 0.2` は文字数 10 前後向け。文字数が多い場合は `stagger: { each: 0.08 }` や `amount: 1.5`（総時間指定）に切り替えて総時間を一定に保つ。

## プリセット c: マスク yPercent せり上がり

適用条件: エディトリアル系の見出し。マスク 2 重分割（`.char-mask > .char`）必須。スクロール発火のセクション見出しに好相性。

```js
import { splitChars } from "./split-text.js";

export const initSectionHeadings = () => {
  // 事前分割（アニメ可否に関わらず DOM を確定させる）
  const headings = document.querySelectorAll("[data-split-text]");
  for (const heading of headings) splitChars(heading);

  // 初期位置: マスクの下に隠す（FOUC 防止のため分割直後に実施）
  gsap.set(document.querySelectorAll(".char"), { yPercent: 100 });

  for (const heading of headings) {
    const chars = heading.querySelectorAll(".char");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heading,
        start: "top 75%",
        once: true,
      },
    });

    tl.to(chars, { yPercent: 0, duration: 0.8, ease: "power2.out", stagger: 0.03 });

    // 後続要素（リード文など）を続けて出す場合:
    const body = heading.parentElement.querySelector("[data-split-follow]");
    if (body) {
      tl.fromTo(body, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.4");
    }
  }
};
```

調整: `stagger: 0.02〜0.03` が文字数多めの見出しの目安。`ease: "power1.inOut"` にするとより淡々とした印象になる。ヒーローで使う場合は ScrollTrigger を外し `loading:complete` 購読に差し替える。

## プリセット d: 段階的リビール（フレーズ分割 + 強調部の別演出）

適用条件: 「テキスト + 数字（or キーワード） + テキスト」構造のタイトルで、強調部だけ質感の違う登場をさせたい。演出予算高。

HTML 側で強調部をマークしておく:

```html
<h1 class="hero__title" aria-label="{{FULL_TITLE_TEXT}}">
  <span class="hero__phrase" data-phrase="pre">{{PRE_TEXT}}</span>
  <span class="hero__emphasis" data-phrase="emphasis">
    <!-- 強調文字はマスク 2 重（1 文字ずつ .char-mask > .char）で分割しておく -->
  </span>
  <span class="hero__phrase" data-phrase="post">{{POST_TEXT}}</span>
</h1>
```

pre / post はフラット分割の blur フェード、emphasis はマスクせり上がり + scale の微バウンス。**フェーズの開始位置は「前フェーズの stagger リズムを引き継ぐ」**のがコツ — 前フェーズの最終文字の完了を待つと間延びして見える。

```js
import { splitCharsFlat, splitChars } from "./split-text.js";

export const initPhasedTitle = () => {
  const title = document.querySelector(".hero__title");
  if (!title) return;

  const pre = title.querySelector('[data-phrase="pre"]');
  const emphasis = title.querySelector('[data-phrase="emphasis"]');
  const post = title.querySelector('[data-phrase="post"]');

  const preChars = pre ? [...splitCharsFlat(pre)] : [];
  const postChars = post ? [...splitCharsFlat(post)] : [];
  if (emphasis) splitChars(emphasis);
  const emphasisChars = emphasis ? [...emphasis.querySelectorAll(".char")] : [];

  const CHAR_DURATION = 0.8;
  const CHAR_STAGGER = 0.2;
  const EMPHASIS_DURATION = 0.9;
  const EMPHASIS_STAGGER = 0.18;

  // 初期状態
  gsap.set([...preChars, ...postChars], { opacity: 0, filter: "blur(6px)" });
  gsap.set(emphasisChars, { yPercent: 100, opacity: 0, filter: "blur(8px)", scale: 1.12 });

  let played = false;
  const start = () => {
    if (played) return;
    played = true;

    const tl = gsap.timeline();
    tl.addLabel("titleStart", "+=0.2");

    // Phase 1: 前半テキスト
    if (preChars.length) {
      tl.to(preChars, { opacity: 1, filter: "blur(0px)", duration: CHAR_DURATION, ease: "power1.out", stagger: CHAR_STAGGER }, "titleStart");
    }

    // Phase 2: 強調部 — 「次の文字が来るはずのタイミング」で開始（リズムを引き継ぐ）
    const phase2Offset = preChars.length * CHAR_STAGGER;
    tl.addLabel("phase2Start", `titleStart+=${phase2Offset}`);

    if (emphasisChars.length) {
      // slide / opacity / blur は power2.out（yPercent に bounce を掛けるとマスク上端を突き抜けるので分離）
      tl.to(emphasisChars, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: EMPHASIS_DURATION, ease: "power2.out", stagger: EMPHASIS_STAGGER }, "phase2Start");
      // scale だけ back.out で微バウンス → 「着地」のニュアンス
      tl.to(emphasisChars, { scale: 1, duration: EMPHASIS_DURATION, ease: "back.out(1.8)", stagger: EMPHASIS_STAGGER }, "phase2Start");
    }

    // Phase 3: 後半テキスト — 強調部の終盤にオーバーラップして入れる
    const phase2Duration = emphasisChars.length ? EMPHASIS_DURATION + EMPHASIS_STAGGER * (emphasisChars.length - 1) : 0;
    tl.addLabel("phase2End", `phase2Start+=${phase2Duration}`);
    const overlap = Math.max(0, EMPHASIS_DURATION - CHAR_STAGGER * 1.5);
    tl.addLabel("phase3Start", `phase2End-=${overlap}`);

    if (postChars.length) {
      tl.to(postChars, { opacity: 1, filter: "blur(0px)", duration: CHAR_DURATION, ease: "power1.out", stagger: CHAR_STAGGER }, "phase3Start");
    }

    // 全完了で filter を掃除し、後続へ通知
    tl.call(() => {
      gsap.set([...preChars, ...postChars, ...emphasisChars], { clearProps: "filter" });
      document.dispatchEvent(new Event("hero:animation-complete"));
    });
  };

  document.addEventListener("loading:complete", start, { once: true });
  setTimeout(start, 8000); // フォールバック
};
```

オプション: 各フェーズ完了時に文字色を `{{ACCENT_COLOR}}` → 本文色へ `tl.to(chars, { color: ... })` で変えると「熱が冷める」ような余韻が付く。

## 調整ポイント（全プリセット共通）

| パラメータ | 目安 | 説明 |
|---|---|---|
| `stagger` | 日本語 0.05〜0.2 / 英字 0.02〜0.08 | 文字単価。文字数 × stagger = 体感の総時間なので、長い見出しでは `stagger: { amount: 総秒数 }` へ |
| `duration` | 0.6〜1.4 | 1 文字あたりのアニメ時間。stagger より長くして重なりを作ると滑らかに繋がる |
| blur 開始値 | 6〜8px | 大きいほどドラマチックだが負荷も増える。完了時 `clearProps: "filter"` 必須 |
| フォールバック | 8000ms | `loading:complete` 不発時の保険。プリローダーのタイムアウト + バッファ |
