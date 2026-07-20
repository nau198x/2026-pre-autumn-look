# 変種 a: SVG ロゴ塗り上げ + LERP + フォント待機

ブランドロゴ（SVG）が読み込み進捗に応じて下から上に塗り上がるプリローダー。進捗は「ヒーロー画像の読み込み率」「最低表示時間に対する経過率」の低い方を採用し、LERP（線形補間）で滑らかに追従させる。Web フォントの読み込みも完了条件に含められる（FOUT 対策）。

適用条件: ブランドロゴの SVG がある。フォントのちらつきも隠したい。GSAP 不要（素の rAF のみ）。

## HTML

`<body>` 直下に置く。ロゴは CSS の mask で塗るため中身は空 div でよい。

```html
<div class="preloader" role="status" aria-label="Loading" data-preloader>
  <div class="preloader__logo" aria-hidden="true"></div>
</div>
```

## CSS

`mask-image` にロゴ SVG を指定し、背景の 2 色グラデーションを `--progress` で動かすことで「塗り上げ」を表現する。

```css
/* preloader.css */
.preloader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  transition: opacity 0.8s ease-out;
}

.preloader__logo {
  width: 6rem;
  /* ロゴ SVG の viewBox 比率に合わせる */
  aspect-ratio: 283 / 100;
  -webkit-mask-image: url("{{LOGO_SVG_PATH}}");
  mask-image: url("{{LOGO_SVG_PATH}}");
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  /* 下から --progress % まで塗り色、それより上は下地色 */
  background: linear-gradient(to top, #000 0%, #000 var(--progress, 0%), #e5e5e5 var(--progress, 0%), #e5e5e5 100%);
  transition: opacity 0.6s ease-out;
}

.preloader.is-logo-hidden .preloader__logo {
  opacity: 0;
}

.preloader.is-hidden {
  opacity: 0;
  pointer-events: none;
}

/* JS 無効環境では表示しない */
@media (scripting: none) {
  .preloader {
    display: none;
  }
}

body.is-loading {
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}

@media (width >= 768px) {
  .preloader__logo {
    width: 8rem;
  }
}
```

## JS

```js
// preloader.js
const LERP_ALPHA = 0.15; // 表示 % が目標に追いつく速さ（0-1、大きいほど速い）
const FINAL_FILL_MS = 200; // 完了時に残りを一気に埋める時間
const LOGO_FADE_MS = 600; // ロゴフェードアウト時間

const preventScroll = (e) => e.preventDefault();

const lockScroll = () => {
  document.body.classList.add("is-loading");
  window.addEventListener("wheel", preventScroll, { passive: false });
  window.addEventListener("touchmove", preventScroll, { passive: false });
};

const unlockScroll = () => {
  document.body.classList.remove("is-loading");
  window.removeEventListener("wheel", preventScroll);
  window.removeEventListener("touchmove", preventScroll);
};

const hidePreloader = (preloader) => {
  if (!preloader) return;
  preloader.classList.add("is-hidden");
  preloader.addEventListener(
    "transitionend",
    () => {
      preloader.remove();
    },
    { once: true },
  );
};

export const runPreloader = ({ heroImgSelector = "", fontSpec = "", minDisplayMs = 1500, timeoutMs = 5000, onComplete = () => {} } = {}) => {
  const preloader = document.querySelector("[data-preloader]");

  if (!preloader) {
    onComplete();
    return;
  }

  lockScroll();

  const heroImgs = heroImgSelector ? document.querySelectorAll(heroImgSelector) : [];
  const total = heroImgs.length;
  let imageRatio = total === 0 ? 1 : 0;
  let displayedPct = 0;
  let finishing = false;
  let fontsReady = false;
  const startTime = performance.now();

  // フォント待機: "1rem {{FONT_FAMILY}}" 形式の文字列 or その配列
  const specs = Array.isArray(fontSpec) ? fontSpec : fontSpec ? [fontSpec] : [];
  const fontPromise = specs.length && document.fonts?.load ? Promise.all(specs.map((spec) => document.fonts.load(spec))) : Promise.resolve();

  fontPromise
    .catch(() => {})
    .finally(() => {
      fontsReady = true;
    });

  const setProgress = (pct) => {
    preloader.style.setProperty("--progress", `${pct}%`);
  };

  const recomputeImageRatio = () => {
    if (total === 0) {
      imageRatio = 1;
      return;
    }
    const loaded = [...heroImgs].filter((img) => img.complete).length;
    imageRatio = loaded / total;
  };

  for (const img of heroImgs) {
    if (!img.complete) {
      img.addEventListener("load", recomputeImageRatio, { once: true });
      img.addEventListener("error", recomputeImageRatio, { once: true }); // 失敗も完了扱い
    }
  }
  recomputeImageRatio();

  const finish = () => {
    if (finishing) return;
    finishing = true;
    const fillStart = performance.now();
    const fromPct = displayedPct;

    const fillStep = () => {
      const t = Math.min((performance.now() - fillStart) / FINAL_FILL_MS, 1);
      setProgress(fromPct + (100 - fromPct) * t);
      if (t < 1) {
        requestAnimationFrame(fillStep);
      } else {
        setProgress(100);
        preloader.classList.add("is-logo-hidden");
        setTimeout(() => {
          // body.is-loading を先に外してから ScrollTrigger を初期化する
          // （overflow: hidden 状態で初期化すると下方トリガーの位置計算が破綻する）
          unlockScroll();
          onComplete();
          hidePreloader(preloader);
        }, LOGO_FADE_MS);
      }
    };
    requestAnimationFrame(fillStep);
  };

  const tick = () => {
    if (finishing) return;
    const elapsed = performance.now() - startTime;
    const timeRatio = Math.min(elapsed / minDisplayMs, 1);
    // 「画像進捗」と「時間進捗」の低い方 = 早すぎず、実態より進みすぎない
    const targetPct = Math.min(imageRatio, timeRatio) * 100;

    displayedPct += (targetPct - displayedPct) * LERP_ALPHA;
    setProgress(displayedPct);

    const timedOut = elapsed >= timeoutMs;
    const ready = timeRatio >= 1 && imageRatio >= 1 && fontsReady;

    if (timedOut || ready) {
      finish();
      return;
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};
```

## 呼び出し例

```js
// main.js
import { runPreloader } from "./preloader.js";
import { initScrollAnimations } from "./animations.js";

document.addEventListener("DOMContentLoaded", () => {
  runPreloader({
    heroImgSelector: ".hero img",
    fontSpec: ["1rem {{FONT_FAMILY}}"],
    minDisplayMs: 1500,
    timeoutMs: 5000,
    onComplete: () => {
      initScrollAnimations(); // ScrollTrigger 初期化はロック解除後（onComplete 内）
      document.dispatchEvent(new Event("loading:complete"));
    },
  });
});
```

## 調整ポイント

| パラメータ | 既定値 | 説明 |
|---|---|---|
| `LERP_ALPHA` | 0.15 | 小さくすると表示 % がゆっくり追従（ヌルッと感） |
| `minDisplayMs` | 1500 | 最低表示時間。キャッシュ時のチラつき防止と演出確保 |
| `timeoutMs` | 5000 | 強制完了。回線不良でも必ず開く |
| `--progress` グラデ 2 色 | #000 / #e5e5e5 | 塗り色 / 下地色。ブランドカラーに変更可 |
