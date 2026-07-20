# 変種 c: ロゴ clip-path 塗り → ヘッダー定位置へ飛翔

画面中央のブランドロゴが clip-path の疑似進捗で塗り上がり、完了後にヘッダーの定位置へ GSAP で飛翔して着地するプリローダー。ロゴはプリローダー専用の複製ではなく**ヘッダーの常設ロゴそのもの**を使う（`body` のクラスで中央固定 ↔ 通常フローを切り替える）ため、着地後の位置ズレが構造的に起きない。GSAP 必須。

適用条件: ヘッダーに常設ロゴがある。プリローダーからページ本体への「つながり」を演出したい。演出予算高。

## HTML

ヘッダーロゴを 2 層にする。下層がモノトーン版、上層がアクセントカラー版（clip-path で塗り上げる対象）。オーバーレイは背景のみの空 div。

```html
<body>
  <!-- GTM noscript の直後 -->
  <div class="loading" aria-hidden="true" data-loading></div>
  <header class="header">
    <div class="header__logo">
      <img class="header__logoMono" src="{{LOGO_MONO_SVG_PATH}}" alt="{{BRAND_NAME}}" />
      <img class="header__logoAccent" src="{{LOGO_ACCENT_SVG_PATH}}" alt="" aria-hidden="true" loading="eager" />
    </div>
  </header>
  ...
</body>
```

## CSS

`body.is-loading-logo` の間だけヘッダーロゴを `position: fixed` で画面中央に置く。ヘッダーが `position: absolute` + `z-index` でスタッキングコンテキストを作っている場合、**子の z-index だけ上げてもオーバーレイを超えられない**ので、ヘッダーごと引き上げる。

```css
/* loading.css */
body.is-loading {
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}

/* loading 中: header ごと overlay より上に引き上げる */
body.is-loading-logo .header {
  z-index: 10000;
  background: transparent;
}

/* loading 中: header ロゴを画面中央に固定配置 */
body.is-loading-logo .header__logo {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 背景オーバーレイ（ロゴは持たない） */
.loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #fff;
  pointer-events: none;
}

/* JS 無効環境ではオーバーレイを出さない（ロゴは最初からヘッダー定位置に見える） */
@media (scripting: none) {
  .loading {
    display: none;
  }
}

/* header.css（抜粋） */
.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  background: #fff;
}

.header__logo {
  position: relative;
}

.header__logoMono {
  display: block;
  width: auto;
  height: 40px;
  opacity: 0.7;
}

.header__logoAccent {
  position: absolute;
  inset: 0;
  display: block;
  width: auto;
  height: 40px;
  /* 初期状態: 全クリップ（未塗り） */
  clip-path: inset(100% 0 0 0);
}

@media (width >= 768px) {
  .header {
    height: 140px;
  }

  .header__logoMono,
  .header__logoAccent {
    height: 64px;
  }
}
```

## JS

進捗は疑似進捗（`window.load` + 最低表示時間）。clip-path を「100% → 20% までゆっくり」→「完了時に 0% へ一気に」の 2 段で動かすことで、実進捗を測らなくても読み込み中らしい緩急が出る。

飛翔は FLIP のクラストグル方式ではなく、**`position: fixed` を維持したまま `top` / `left` を GSAP でアニメし、到着後にクラスを外す**。クラスを外した瞬間も同じ視覚位置になるため 1 フレームのちらつきが出ない（元実装で FLIP 方式を試してちらついたための設計）。

元実装からの修正点: `wheel` の preventDefault を追加（元は `touchmove` のみで、CSS の `overflow: hidden` 頼みだった）。ヘッダー欠落時のガードを追加。

```js
// loading.js
import { gsap } from "gsap";

const TIMEOUT = 5000;
const MIN_LOADING = 1500; // 塗りアニメが見えるよう最低表示時間を保証

export const initLoading = () => {
  const overlay = document.querySelector("[data-loading]");
  const logo = document.querySelector(".header__logo");
  const accent = logo?.querySelector(".header__logoAccent");

  // スクロール・タッチロック + ロゴ中央配置
  document.body.classList.add("is-loading");
  document.body.classList.add("is-loading-logo");
  const preventScroll = (e) => e.preventDefault();
  document.addEventListener("wheel", preventScroll, { passive: false });
  document.addEventListener("touchmove", preventScroll, { passive: false });

  const done = () => {
    document.body.classList.remove("is-loading");
    document.removeEventListener("wheel", preventScroll);
    document.removeEventListener("touchmove", preventScroll);
    document.dispatchEvent(new Event("loading:complete"));
  };

  if (!overlay || !logo) {
    document.body.classList.remove("is-loading-logo");
    requestAnimationFrame(done);
    return;
  }

  const loadStart = performance.now();

  // ① 疑似プログレス: accent の clip-path を 100% → 20% までゆっくり
  const slowFill = accent ? gsap.fromTo(accent, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(20% 0 0 0)", duration: 2.5, ease: "power1.out" }) : null;

  let completed = false;
  const complete = () => {
    if (completed) return;

    // 最低表示時間が経過していなければ遅延して再呼び出し
    const elapsed = performance.now() - loadStart;
    if (elapsed < MIN_LOADING) {
      setTimeout(complete, MIN_LOADING - elapsed);
      return;
    }

    completed = true;
    if (slowFill) slowFill.kill();

    // ② 塗りを一気に 100% へ
    const afterFill = () => {
      const header = document.querySelector(".header");
      if (!header) {
        // ヘッダーが無ければ飛翔せずフェードのみ
        document.body.classList.remove("is-loading-logo");
        gsap.to(overlay, { opacity: 0, duration: 0.5, onComplete: () => { overlay.style.display = "none"; done(); } });
        return;
      }

      // ③ ロゴを中央から header 定位置へ移動
      // header は flex で中央寄せ、logo は translate(-50%, -50%) 済みなので
      // ターゲットは header の中心座標
      const headerRect = header.getBoundingClientRect();
      const targetTop = headerRect.top + headerRect.height / 2;
      const targetLeft = headerRect.left + headerRect.width / 2;

      // overlay 背景フェード
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.5,
        ease: "power1.out",
        onComplete: () => {
          overlay.style.display = "none";
        },
      });

      // ロゴ移動（position: fixed を維持したまま top/left をアニメ）
      gsap.to(logo, {
        top: targetTop,
        left: targetLeft,
        duration: 0.8,
        ease: "power2.inOut",
        onComplete: () => {
          // 到着後: fixed → header フローに切り替え（同じ視覚位置なのでちらつかない）
          document.body.classList.remove("is-loading-logo");
          gsap.set(logo, { clearProps: "top,left" });
          done();
        },
      });
    };

    if (accent) {
      gsap.to(accent, {
        clipPath: "inset(0% 0 0 0)",
        duration: 0.4,
        ease: "power2.out",
        onComplete: afterFill,
      });
    } else {
      afterFill();
    }
  };

  // window.load でも MIN_LOADING 経過を待ってから complete
  const scheduleComplete = () => {
    const elapsed = performance.now() - loadStart;
    setTimeout(complete, Math.max(0, MIN_LOADING - elapsed));
  };

  if (document.readyState === "complete") {
    scheduleComplete();
  } else {
    window.addEventListener("load", scheduleComplete);
  }
  setTimeout(complete, TIMEOUT);
};
```

## 呼び出し例

```js
// main.js
import { initLoading } from "./loading.js";
import { initHeroAnimation } from "./hero-animation.js";

document.addEventListener("DOMContentLoaded", () => {
  initHeroAnimation(); // 内部で loading:complete を購読（references/completion-contract.md）
  initLoading();
});
```

## 調整ポイント

| パラメータ | 既定値 | 説明 |
|---|---|---|
| `MIN_LOADING` | 1500 | 最低表示時間。塗り演出を見せ切る |
| `TIMEOUT` | 5000 | 強制完了 |
| 疑似進捗の途中停止位置 | inset 20% | 小さくすると「ほぼ完了で待つ」印象に。80% 塗りで止まる = 20% |
| 疑似進捗 duration | 2.5s | ゆっくり塗る時間。MIN_LOADING より長めにして完了時の「一気に 100%」を必ず見せる |
| 飛翔 duration / ease | 0.8s / power2.inOut | 飛翔の速度感。inOut 系が着地の収まりが良い |
| リサイズ耐性 | — | 飛翔中にリサイズするとターゲット座標がズレる。気になる場合は `onComplete` 前に再計算するか、飛翔時間を短くする |
