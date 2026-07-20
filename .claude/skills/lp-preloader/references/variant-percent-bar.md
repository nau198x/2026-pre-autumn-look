# 変種 b: % 数値 + プログレスバー（実読み込み進捗）

ページ内の画像・動画の「実際の読み込み数」を数えて % 数値と細バーで表示するプリローダー。演出用の疑似進捗ではなく、`img` の `load` / `video` の `canplaythrough` を 1 つずつカウントするため、重いページほど進捗表示に意味が出る。GSAP 不要。

適用条件: 画像・動画が多く重いページ。進捗を数値で見せて「待たされている感」を軽減したい。動画（`video[src]`）の読み込みも待ちたい。

## HTML

`<body>` 直下に置く。ロゴは任意（`<img>` でも SVG インラインでも可）。

```html
<div class="preloader" role="status" aria-label="Loading" data-preloader>
  <img class="preloader__logo" src="{{LOGO_SVG_PATH}}" alt="" aria-hidden="true" />
  <div class="preloader__progress" aria-hidden="true">
    <span class="preloader__text">0%</span>
    <span class="preloader__track"><span class="preloader__bar"></span></span>
  </div>
</div>
```

## CSS

```css
/* preloader.css */
.preloader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  background-color: #fff;
}

.preloader__logo {
  width: 6rem;
}

.preloader__progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: min(60vw, 15rem);
}

.preloader__text {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  font-variant-numeric: tabular-nums; /* 数字の桁揺れ防止 */
}

.preloader__track {
  display: block;
  width: 100%;
  height: 1px;
  background-color: #e5e5e5;
}

.preloader__bar {
  display: block;
  width: 0%;
  height: 100%;
  background-color: {{ACCENT_COLOR}};
  transition: width 0.3s ease-out;
}

.preloader.is-hidden {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.8s ease-out;
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

監視対象はプリローダー内を除く全 `img` と `video[src]`。元実装からの修正点:

- **`loading="lazy"` の画像を監視対象から除外**した。lazy 画像はスクロールするまで読み込まれないため、数えると進捗が途中で止まりタイムアウト頼みになる（元実装の弱点）
- **対象 0 件の場合に即完了**するガードを追加した（元実装は `0 / 0` で NaN になり、タイムアウトまで開かないバグがあった）
- 最低表示時間（`minDisplayMs`）を追加した（キャッシュ済みアクセスで一瞬チラつくのを防ぐ）

```js
// preloader.js
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

export const runPreloader = ({ minDisplayMs = 1500, timeoutMs = 5000, holdAt100Ms = 200, onComplete = () => {} } = {}) => {
  const preloader = document.querySelector("[data-preloader]");

  if (!preloader) {
    onComplete();
    return;
  }

  lockScroll();

  const bar = preloader.querySelector(".preloader__bar");
  const text = preloader.querySelector(".preloader__text");
  const startTime = performance.now();

  // 監視対象: プリローダー内と lazy 画像を除く img + video[src]
  const images = [...document.querySelectorAll("img")].filter((img) => !img.closest("[data-preloader]") && img.loading !== "lazy");
  const videos = [...document.querySelectorAll("video[src]")];
  const total = images.length + videos.length;
  let loaded = 0;
  let finished = false;
  let fallbackTimeoutId = null;

  const render = (pct) => {
    if (bar) bar.style.width = `${pct}%`;
    if (text) text.textContent = `${Math.round(pct)}%`;
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(fallbackTimeoutId);
    render(100);

    // 100% 表示を一拍見せてからフェードアウト
    setTimeout(() => {
      preloader.classList.add("is-hidden");
      preloader.addEventListener(
        "transitionend",
        () => {
          // ロック解除 → ScrollTrigger 初期化（onComplete 内）→ 完了イベント の順
          // 詳細は references/completion-contract.md
          unlockScroll();
          onComplete();
          preloader.remove();
        },
        { once: true },
      );
    }, holdAt100Ms);
  };

  const tryFinish = () => {
    // 実読み込み完了 + 最低表示時間の両方を満たしてから完了
    const elapsed = performance.now() - startTime;
    if (elapsed >= minDisplayMs) {
      finish();
    } else {
      setTimeout(finish, minDisplayMs - elapsed);
    }
  };

  const updateProgress = () => {
    loaded++;
    render((loaded / total) * 100);
    if (loaded >= total) tryFinish();
  };

  if (total === 0) {
    // 監視対象なし: 最低表示時間だけ見せて完了（0 除算ガード）
    render(100);
    tryFinish();
  } else {
    for (const img of images) {
      if (img.complete) {
        updateProgress();
      } else {
        img.addEventListener("load", updateProgress, { once: true });
        img.addEventListener("error", updateProgress, { once: true }); // 失敗も完了扱い
      }
    }
    for (const video of videos) {
      if (video.readyState >= 3) {
        updateProgress();
      } else {
        video.addEventListener("canplaythrough", updateProgress, { once: true });
        video.addEventListener("error", updateProgress, { once: true });
      }
    }
  }

  // フォールバック: 回線不良・読み込み失敗でも必ず開く
  fallbackTimeoutId = setTimeout(finish, timeoutMs);
};
```

## 呼び出し例

```js
// main.js
import { runPreloader } from "./preloader.js";
import { initScrollAnimations } from "./animations.js";

document.addEventListener("DOMContentLoaded", () => {
  runPreloader({
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
| `minDisplayMs` | 1500 | 最低表示時間。キャッシュ時のチラつき防止 |
| `timeoutMs` | 5000 | 強制完了。動画が重いページでは 6000〜8000 も可 |
| `holdAt100Ms` | 200 | 100% 表示を見せる時間。0 にすると即フェード |
| 監視対象セレクタ | 全 img + video[src] | ヒーローのみに絞る場合は `#hero img` 等に変更。`video[src]` は `<source>` 子要素方式の video を拾わない点に注意 |
| バー `transition` | 0.3s | 進捗の追従感。長くするとヌルッと、短いとカクカク進む |
