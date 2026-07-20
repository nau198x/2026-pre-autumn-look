# autoplay ゲート（開始タイミングの制御）

「初期化はするが、合図があるまで autoplay を始めない」ための 2 パターン。ヒーロー登場アニメ・プリローダー・スクロールリビールとカルーセルの動き出しが競合して見苦しくなるのを防ぐ。

共通の考え方:

1. Swiper は通常どおり初期化する（レイアウト崩れを防ぐため遅延させない）
2. 直後に `swiper.autoplay.stop()` で自動再生だけ止める
3. 合図（カスタムイベント / ScrollTrigger / タイムライン onComplete）で `swiper.autoplay.start()`
4. **reduced-motion 時はゲートしない**（合図となる演出自体がスキップされ、永久停止する事故を防ぐ）

## パターン 1: カスタムイベントゲート

ヒーロー演出側が完了時に `document.dispatchEvent(new Event("hero:animation-complete"))` を発火する契約とセットで使う（プリローダーなら `loading:complete` 等、プロジェクトの完了イベント名に合わせる）。

```js
// COMMON_OPTIONS は fade カルーセルの共通設定（references/config-variants.md と同一）
const COMMON_OPTIONS = {
  modules: [EffectFade, Autoplay],
  effect: "fade",
  fadeEffect: { crossFade: false },
  allowTouchMove: false,
  slidesPerView: 1,
  loop: true,
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fadeSpeed = prefersReducedMotion ? 0 : 2000;

const heroSwiperEl = document.querySelector(".hero__swiper");
if (heroSwiperEl) {
  const heroSwiper = new Swiper(heroSwiperEl, {
    ...COMMON_OPTIONS,
    speed: fadeSpeed,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
  });
  if (!prefersReducedMotion) {
    heroSwiper.autoplay.stop();
    document.addEventListener(
      "hero:animation-complete",
      () => heroSwiper.autoplay.start(),
      { once: true },
    );
  }
}
```

### 変種: 行リビール完了で個別に起動

セクションごとのカルーセルを、そのセクションのリビールアニメ完了時に起動する場合。slider.js では止めるだけにして、起動はアニメーション側のタイムライン `onComplete` から要素経由で行う（`el.swiper` で初期化済みインスタンスに触れる）。

```js
// slider.js 側: 初期化して止めておく
for (const el of document.querySelectorAll(".gallery__swiper")) {
  const swiper = new Swiper(el, {
    ...COMMON_OPTIONS,
    speed: fadeSpeed,
    autoplay: { delay: 3000, disableOnInteraction: false },
  });
  if (!prefersReducedMotion) {
    swiper.autoplay.stop();
  }
}

// animations.js 側: リビール完了時に起動
const tl = gsap.timeline({
  scrollTrigger: { trigger: section, start: "top 70%", once: true },
  onComplete: () => {
    section.querySelector(".gallery__swiper")?.swiper?.autoplay.start();
  },
});
```

## パターン 2: ScrollTrigger ゲート

スクロールで画面に入り、フェードイン演出が終わってから回し始める。演出中の誤操作を防ぐためスライド操作もロックする。

```js
// autoplay.enabled: false は Swiper 8 以降。
// それ以前のバージョンでは初期化直後に swiperGallery.autoplay.stop() を呼ぶ
const swiperGallery = new Swiper(".gallery__swiper", {
  slidesPerView: 1,
  spaceBetween: 0,
  loop: true,
  effect: "fade",
  speed: 500,
  allowTouchMove: false,
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
    enabled: false,
  },
});

gsap.fromTo(
  ".gallery__swiper",
  { autoAlpha: 0 },
  {
    autoAlpha: 1,
    duration: 1.2,
    delay: 0.6,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".gallery",
      start: "top 80%",
      once: true,
      onEnter: () => {
        // フェードイン中の操作をロック
        swiperGallery.allowSlideNext = swiperGallery.allowSlidePrev = false;
      },
    },
    onComplete: () => {
      swiperGallery.allowSlideNext = swiperGallery.allowSlidePrev = true;
      swiperGallery.autoplay.start();
    },
  },
);
```

## 検証ポイント

- [ ] ゲートイベントが発火しないケース（reduced-motion・演出スキップ・JS エラー）でもカルーセルが止まりっぱなしにならない
- [ ] イベントリスナーに `{ once: true }` を付けている（多重 start 防止）
- [ ] `autoplay.start()` 後、`disableOnInteraction: false` により操作後も回り続ける
