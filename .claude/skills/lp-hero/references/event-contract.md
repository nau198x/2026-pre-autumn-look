# event-contract — ローディング → ヒーロー → カルーセルのイベント連鎖契約

## 適用条件

- ローディング（プリローダー）演出・ヒーロー入場演出・カルーセル autoplay 等の後続演出を持つ LP で、開始順序を確実に直列化したいとき
- モジュール同士を直接 import で結合せず、`document` 上のカスタムイベントで疎結合にする（発火側は購読者の有無を知らなくてよい。ローディングの無い案件でもヒーロー側のコードは変えずに済む）

## 契約（標準イベント名・発火順）

| # | イベント名 | 発火者 | タイミング | 主な購読者 |
| --- | --- | --- | --- | --- |
| 1 | `loading:overlay-fade-start` | ローディング | オーバーレイの opacity フェード開始直前（ヒーロー画像が見え始める瞬間） | ヒーロー（Ken Burns 先行起動） |
| 2 | `loading:complete` | ローディング | オーバーレイ消去・スクロールロック解除の完了後 | ヒーロー（入場タイムライン開始） |
| 3 | `hero:animation-complete` | ヒーロー | 入場タイムライン完了時（**rescue 発動時も必ず**） | カルーセル（autoplay 開始）、後続演出全般 |

契約のルール:

- イベントは全て `document.dispatchEvent(new Event("..."))` で発火し、`document.addEventListener("...", fn, { once: true })` で購読する（各イベントは 1 回きり。`once: true` でリスナーの解除漏れを防ぐ）
- 発火側は必ず**タイムアウト安全網**を持つ（画像ロード失敗等でイベントが永久に来ないと、連鎖の下流が全停止するため）
- 途中の演出をスキップする分岐（reduced-motion・rescue・要素欠落時の早期 return）でも、下流へのイベントは必ず発火する

## 発火側（loading.js の骨子）

ローディング演出の中身（ロゴ演出等）は案件ごとに自由。イベントの発火位置だけ守る:

```js
import { gsap } from "gsap";

const TIMEOUT = 10000; // 安全網: 何があってもこの時間で必ず明ける
const MIN_LOADING = 1500; // 演出が見えるよう最低表示時間を保証

export const initLoading = () => {
  const overlay = document.querySelector("[data-loading]");

  // ローディング中のスクロール・タッチロック
  document.body.classList.add("is-loading");
  const preventTouch = (e) => e.preventDefault();
  document.addEventListener("touchmove", preventTouch, { passive: false });

  const done = () => {
    document.body.classList.remove("is-loading");
    document.removeEventListener("touchmove", preventTouch);
    document.dispatchEvent(new Event("loading:complete")); // ← 契約 #2
  };

  // オーバーレイが無い構成でも契約は守る（rAF 1 つ挟んで購読側の登録を待つ）
  if (!overlay) {
    requestAnimationFrame(() => {
      document.dispatchEvent(new Event("loading:overlay-fade-start"));
      done();
    });
    return;
  }

  const loadStart = performance.now();
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

    // フェード開始の直前に発火 → ヒーローの Ken Burns が
    // 「画像が見え始める瞬間」と同期して先行起動できる
    document.dispatchEvent(new Event("loading:overlay-fade-start")); // ← 契約 #1

    gsap.to(overlay, {
      opacity: 0,
      duration: 0.5,
      ease: "power1.out",
      onComplete: () => {
        overlay.style.display = "none";
        done();
      },
    });
  };

  // window.load 後、最低表示時間を満たしてから complete
  const scheduleComplete = () => {
    const elapsed = performance.now() - loadStart;
    setTimeout(complete, Math.max(0, MIN_LOADING - elapsed));
  };

  if (document.readyState === "complete") {
    scheduleComplete();
  } else {
    window.addEventListener("load", scheduleComplete);
  }
  setTimeout(complete, TIMEOUT); // 安全網
};
```

## 購読側 1（ヒーロー入場。hero.js）

入場タイムラインの全体は entrance-timeline.md 参照。イベント接続部分だけ抜粋:

```js
// Ken Burns はオーバーレイのフェード開始と同時に先行起動
document.addEventListener("loading:overlay-fade-start", startKenBurns, { once: true });

// 入場タイムラインはローディング完全終了後に開始
document.addEventListener("loading:complete", start, { once: true });

// タイムライン完了時（と rescue 時）に後続へバトンを渡す
// tl の onComplete / rescue 処理の両方で:
document.dispatchEvent(new Event("hero:animation-complete")); // ← 契約 #3
```

## 購読側 2（カルーセル autoplay ゲート。slider.js）

ヒーロー入場が終わるまでスライドが切り替わらないよう、autoplay を止めて待機する:

```js
import Swiper from "swiper";
import { EffectFade, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

export const initSlider = () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fadeSpeed = prefersReducedMotion ? 0 : 2000;

  const heroSwiperEl = document.querySelector(".hero__swiper");
  if (!heroSwiperEl) return;

  const heroSwiper = new Swiper(heroSwiperEl, {
    modules: [EffectFade, Autoplay],
    effect: "fade",
    fadeEffect: { crossFade: false },
    allowTouchMove: false,
    slidesPerView: 1,
    loop: true,
    speed: fadeSpeed,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
  });

  // 入場アニメがある環境でのみゲートをかける。
  // reduced-motion では入場アニメ自体が無い（= hero:animation-complete が
  // 来ない可能性がある）ため、ゲートせず即 autoplay
  if (!prefersReducedMotion) {
    heroSwiper.autoplay.stop();
    document.addEventListener("hero:animation-complete", () => heroSwiper.autoplay.start(), { once: true });
  }
};
```

## ローディング演出が無い場合の代替発火

イベント契約を維持したまま、`window.load` を代替トリガーにする。ヒーロー・カルーセル側のコードは一切変更しない:

```js
// main.js（initLoading の代わりに呼ぶ）
const initLoadingFallback = () => {
  const fire = () => {
    document.dispatchEvent(new Event("loading:overlay-fade-start"));
    document.dispatchEvent(new Event("loading:complete"));
  };
  if (document.readyState === "complete") {
    requestAnimationFrame(fire); // 購読側の登録（DOMContentLoaded 内）を待つ
  } else {
    window.addEventListener("load", fire);
  }
};
```

## 注意

- **発火順と登録順**: 購読側（hero.js / slider.js）の `addEventListener` は `DOMContentLoaded` の初期化で登録される。発火側が同期的に即 dispatch すると購読前に流れてしまうため、「オーバーレイ無し」「ローディング無し」の即時発火パスでは `requestAnimationFrame` を 1 つ挟む
- **rescue でも `hero:animation-complete` を必ず発火する**: 発火しないとカルーセル autoplay が永久に始まらない（entrance-timeline.md の rescue 処理参照）
- **イベント名は変えない**: 案件をまたいで同じ契約を使うことで、ローディング・ヒーロー・カルーセルの各モジュールを別案件へそのまま移植できる。演出を追加する場合も `名前空間:動詞` 形式（例 `hero:parallax-ready`）で揃える
- ペイロードが必要になったら `new CustomEvent("...", { detail: {...} })` に差し替えてよいが、既存 3 イベントは detail 無しを維持する（購読側の互換性）
