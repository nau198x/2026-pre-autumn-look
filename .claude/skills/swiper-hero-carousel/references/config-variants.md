# 設定の判断表と基本コード

fade + autoplay カルーセルの標準設定と、単一インスタンス / 複数インスタンス一括初期化の実績コード。ES Modules（Vite 等）を前提に書くが、ビルドなし構成への読み替えも末尾に記す。

## 設定判断表

| オプション | ヒーロー | 本文ミニカルーセル | 備考 |
|---|---|---|---|
| `effect` | `"fade"` | `"fade"` | スライド式にしたい場合のみ省略 |
| `fadeEffect.crossFade` | `false` | `false` | 透過 / テキスト / サイズ違いスライドがあるなら `true` |
| `speed` | 1500〜2000 | 1200〜1500 | reduced-motion 時は 0 |
| `autoplay.delay` | 4000〜5000 | 3000 | |
| `autoplay.disableOnInteraction` | `false` | `false` | 必須。触っても止めない |
| `loop` | `true` | `true` | スライド 2 枚以上が前提 |
| `slidesPerView` | 1 | 1 | fade では常に 1 |
| `allowTouchMove` | 演出なら `false` | `false` | 操作させたいなら `true` |

## 基本コード（単一 + 複数インスタンス）

```js
// slider.js
import Swiper from "swiper";
import { EffectFade, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

const COMMON_OPTIONS = {
  modules: [EffectFade, Autoplay],
  effect: "fade",
  fadeEffect: { crossFade: false },
  allowTouchMove: false,
  slidesPerView: 1,
  loop: true,
};

export const initSlider = () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fadeSpeed = prefersReducedMotion ? 0 : 2000;

  // ヒーロー: 間隔大きめ
  const heroSwiperEl = document.querySelector(".hero__swiper");
  if (heroSwiperEl) {
    new Swiper(heroSwiperEl, {
      ...COMMON_OPTIONS,
      speed: fadeSpeed,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
    });
  }

  // 本文ミニカルーセル: 同クラスの全要素を一括初期化
  for (const el of document.querySelectorAll(".gallery__swiper")) {
    new Swiper(el, {
      ...COMMON_OPTIONS,
      speed: fadeSpeed,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
    });
  }
};
```

HTML は標準構造:

```html
<div class="hero__swiper swiper">
  <div class="swiper-wrapper">
    <div class="swiper-slide">
      <img src="assets/images/hero_01.webp" alt="" loading="eager" fetchpriority="high" width="1600" height="2000" />
    </div>
    <div class="swiper-slide">
      <img src="assets/images/hero_02.webp" alt="" loading="eager" width="1600" height="2000" />
    </div>
  </div>
</div>
```

## 演出オプション 1: スライド切替連動の背景色ワイプ

スライドごとに `data-bg` 属性で色を持たせ、切替のたびに隣接パネルの背景色を左からワイプで塗り替える。GSAP が必要。

```html
<div class="swiper-slide" data-bg="{{ACCENT_COLOR}}">
  <img src="assets/images/hero_01.webp" alt="" />
</div>
```

```js
const getBgColor = (swiper, fallback = "#fff") =>
  swiper.slides[swiper.activeIndex]?.dataset?.bg ?? fallback;

const wipeGradient = (panel, next, ease = "power1.inOut") => {
  const prev = panel.dataset.currentColor || "#fff";
  panel.style.backgroundImage = `linear-gradient(90deg, ${next} 0%, ${next} 50%, ${prev} 50%, ${prev} 100%)`;
  panel.style.backgroundSize = "200% 100%";
  panel.style.backgroundPosition = "100% 0";
  gsap.to(panel, {
    backgroundPosition: "0% 0",
    duration: 0.8,
    ease,
    onComplete() {
      panel.style.backgroundColor = next;
      panel.dataset.currentColor = next;
    },
  });
};

new Swiper(".hero__swiper", {
  speed: 1200,
  autoplay: { delay: 5000, disableOnInteraction: false },
  loop: true,
  effect: "fade",
  allowTouchMove: false,
  on: {
    init() {
      const panel = document.querySelector(".hero__panel");
      const initColor = getBgColor(this);
      panel.style.backgroundColor = initColor;
      panel.dataset.currentColor = initColor;
    },
    slideChangeTransitionStart() {
      const panel = document.querySelector(".hero__panel");
      wipeGradient(panel, getBgColor(this));
    },
  },
});
```

## 演出オプション 2: アクティブスライドの Ken Burns ズーム

表示中のスライド画像を「delay + フェード時間」かけて等速で 1.0 → 1.2 に拡大し続ける。`on.init` と `on.slideChangeTransitionStart` の両方から呼ぶ。

```js
const zoomActiveSlide = (swiper, { delay, speed }) => {
  const activeImg = swiper.slides[swiper.activeIndex]?.querySelector("img");
  if (!activeImg) return;
  gsap.set(activeImg, { scale: 1 });
  gsap.to(activeImg, { scale: 1.2, duration: (delay + speed) / 1000, ease: "none" });
};
```

拡大がはみ出さないよう、スライド側に `overflow: hidden` を設定すること。

## ビルドなし構成への読み替え

- `import` 節を削除し、`swiper-bundle.min.js`（または個別ビルド）と CSS を script / link タグで読み込む
- `modules: [...]` はバンドル版では不要
- 初期化は DOMContentLoaded 後、またはページ末尾の script で実行する
