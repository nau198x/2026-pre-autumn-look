# fixes — ドリフトの修正コード集

SKILL.md の修正レシピに対応する完全コード。**①②③は常にセットで適用する**。

## ① img 属性を実寸比に合わせる（最優先・根治）

references/diagnosis.md の Step 1 で洗い出した不一致を、属性側を実寸（または等比）に直すことで解消する。

```html
<!-- Before: 実寸 1200x800（横長）なのに縦長の属性 -->
<img src="look_05.webp" width="800" height="1000" loading="lazy" />

<!-- After: 実寸比に一致（絶対値は等比なら何でもよい: 1200x800 = 600x400） -->
<img src="look_05.webp" width="1200" height="800" loading="lazy" />
```

## ② アニメ初期化を window.load に移す

```js
// Before
document.addEventListener("DOMContentLoaded", () => initAnimations());

// After
window.addEventListener("load", () => initAnimations());
```

外部フォント（@font-face / Web フォント <link>）を使っているページはフォント確定も待つ:

```js
window.addEventListener("load", async () => {
  await document.fonts.ready;
  initAnimations();
});
```

## ③ lazy 画像ロード時の refresh フック（2 方式から選ぶ）

### ③-A debounce 版（GreenSock 公式推奨パターン）

複数画像が連続ロードされても refresh は 1 秒 debounce で 1 回だけ。ロードが分散して起きるページに向く。

```js
// GSAP 公式推奨 — GreenSock フォーラム topic/36860 より
const handleLazyLoad = (config = {}) => {
  const lazyImages = gsap.utils.toArray("img[loading='lazy']");
  const timeout = gsap
    .delayedCall(config.timeout || 1, ScrollTrigger.refresh)
    .pause();
  const onImgLoad = () => timeout.restart(true);
  for (const img of lazyImages) {
    if (img.naturalWidth) onImgLoad();
    else img.addEventListener("load", onImgLoad, { once: true });
  }
};

// initAnimations() の最後で呼ぶ
handleLazyLoad();
```

### ③-B カウントダウン版（全ロード後に 1 回だけ）

「全部終わってから 1 回だけ」に倒した実装。スクロール中の refresh が mobile Safari で jank を起こしたページで採用された safety net。

```js
// lazy 画像のロードが全て終わったときに 1 回だけ ScrollTrigger を refresh する。
// 属性と実寸のズレによる累積 layout shift の残留対策（safety net）。
// スクロール中に頻繁に refresh すると mobile Safari で scroll jank を起こすため、
// 「全部終わってから 1 回だけ」に倒している。
const handleLazyLoad = () => {
  const lazyImages = gsap.utils.toArray("img[loading='lazy']");
  let remaining = lazyImages.filter((img) => !img.naturalWidth).length;
  if (remaining === 0) return;
  const onImgLoad = () => {
    if (--remaining === 0) ScrollTrigger.refresh();
  };
  for (const img of lazyImages) {
    if (img.naturalWidth) continue;
    img.addEventListener("load", onImgLoad, { once: true });
    img.addEventListener("error", onImgLoad, { once: true });
  }
};
```

**選び方**: 迷ったら ③-A。ページ後半の画像が多く「途中の refresh すら避けたい」なら ③-B。③-B は error リスナーも張っている（1 枚でも失敗すると永遠に refresh されない事故の防止）— ③-A を使う場合も同様の error ハンドリングを足すとより堅い。

**禁止**: scroll イベントで ScrollTrigger.refresh() を呼ぶこと（公式が "extremely inefficient" と明確に警告）。

## ④ invalidateOnRefresh: true（保険）

refresh 時に start/end と fromTo 値を再計算させる:

```js
gsap.fromTo(
  el,
  { opacity: 0, y: 10 },
  {
    opacity: 1,
    y: 0,
    duration: 0.6,
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
      once: true,
      invalidateOnRefresh: true, // ★
    },
  },
);
```

## ⑤ モバイル URL バー伸縮の resize 対策

iOS / Android の URL バー伸縮による resize で refresh が走り、かえってズレ・jank の原因になる場合:

```js
ScrollTrigger.config({ ignoreMobileResize: true });
```

初期化の最初（registerPlugin 直後）に 1 回だけ設定する。

## （旧実装の互換メモ）debounce を setTimeout で書く場合

gsap.delayedCall を使わないシンプルな debounce 実装例（100ms）。既存コードがこの形でも問題はない:

```js
let refreshTimeout;
const debouncedRefresh = () => {
  clearTimeout(refreshTimeout);
  refreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 100);
};

document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
  img.addEventListener("load", debouncedRefresh, { once: true });
});
```

ただし 100ms は連続ロードをまとめきれないことがあるため、新規実装では ③-A（1 秒）を使う。
