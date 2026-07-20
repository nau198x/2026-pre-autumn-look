# GSAP コード（ワイプ / クロスフェード、batch + 追いつき処理込み）

references/css-layers.md の 2 層構造を動かす完全コード。ヒーロー用（ロード時自動再生）とフォトブロック用（ScrollTrigger.batch + 追いつき処理）の 2 系統 + タイムライン生成ヘルパー 2 種（ワイプ / クロスフェード）で構成。

適用条件: GSAP + ScrollTrigger を使用しているプロジェクト。HTML / CSS は references/css-layers.md を先に導入していること。

## タイムライン生成ヘルパー

ワイプとクロスフェードの違いはこのヘルパーだけ。どちらも paused なタイムラインを返し、呼び出し側が play のタイミングを制御する。

```js
// reveal-timelines.js
import gsap from "gsap";

/**
 * ワイプ型: 幕が開くように左→右へ。
 * 層（コンテナ）を xPercent -100→0、img を +100→0 と逆方向に動かすことで
 * overflow: hidden の窓の中を画像が「その場に留まったまま」現れて見える。
 */
export const buildWipeTimeline = (link, { grayDur = 1.0, colorDur = 1.2, overlap = 0.3 } = {}) => {
  const grayscaleLayer = link.querySelector(".reveal-grayscale");
  const colorLayer = link.querySelector(".reveal-color");
  const grayscaleImg = grayscaleLayer?.querySelector("img");
  const colorImg = colorLayer?.querySelector("img");
  if (!grayscaleLayer || !colorLayer) return null;

  const tl = gsap.timeline({ paused: true });

  // 1) グレースケール: 幕が開く
  tl.fromTo(grayscaleLayer, { autoAlpha: 1, xPercent: -100 }, { duration: grayDur, xPercent: 0, ease: "power2.out" });
  tl.fromTo(grayscaleImg, { xPercent: 100 }, { duration: grayDur, xPercent: 0, ease: "power2.out" }, "<");

  // 2) カラー: グレー完了の少し前に追いかけて重なる
  tl.fromTo(colorLayer, { autoAlpha: 1, xPercent: -100 }, { duration: colorDur, xPercent: 0, ease: "power2.out" }, `-=${overlap}`);
  tl.fromTo(colorImg, { xPercent: 100, opacity: 0 }, { duration: colorDur, xPercent: 0, opacity: 1, ease: "power2.out" }, "<");

  return tl;
};

/**
 * クロスフェード型: グレーがフェードイン → カラーが上からフェードで重なる。
 * フォトブロックが多いページの標準。
 */
export const buildCrossfadeTimeline = (link, { grayDur = 0.6, colorDur = 0.4, overlap = 0.3 } = {}) => {
  const grayscaleLayer = link.querySelector(".reveal-grayscale");
  const colorLayer = link.querySelector(".reveal-color");
  if (!grayscaleLayer || !colorLayer) return null;

  const tl = gsap.timeline({ paused: true });
  tl.fromTo(grayscaleLayer, { autoAlpha: 0 }, { duration: grayDur, autoAlpha: 1, ease: "power2.out" });
  tl.fromTo(colorLayer, { autoAlpha: 0 }, { duration: colorDur, autoAlpha: 1, ease: "power1.inOut" }, `-=${overlap}`);
  return tl;
};
```

注記（元実装からの修正点）: 参照元のクロスフェードは `set(autoAlpha: 1)` + `from(autoAlpha: 0)` の組み合わせだったが、scroll-reveal スキルの「from() は現在値を終値と誤読する事故が起きやすい」ルールに合わせ、両端明示の `fromTo()` に統一した。

## ヒーロー用（ロード時自動再生）

ScrollTrigger 不要。プリローダー併用時はその完了イベントから、なければ DOMContentLoaded から呼ぶ。

```js
// animations.js（ヒーロー）
import { buildWipeTimeline } from "./reveal-timelines.js";

export const initHeroReveal = () => {
  for (const container of document.querySelectorAll(".hero .reveal-image")) {
    const tl = buildWipeTimeline(container);
    if (!tl) continue;

    // ロゴ・見出し等を続けて出す場合はここに追加
    const heroLogo = container.closest(".hero")?.querySelector(".hero-logo");
    if (heroLogo) {
      tl.fromTo(heroLogo, { opacity: 0, x: -10 }, { duration: 0.8, opacity: 1, x: 0, ease: "power1.out" }, "-=0.6");
    }

    tl.play();
  }
};
```

- SP はワイプ時間を少し詰める（`buildWipeTimeline(container, { grayDur: 1.0, colorDur: 1.0 })` 等）と間延びしない
- PC / SP で画像を出し分けている場合は表示中のコンテナだけが動く（非表示側もタイムラインは走るが見えないだけなので実害はない。気になる場合は `offsetParent` チェックでスキップ）

## フォトブロック用（ScrollTrigger.batch + 追いつき処理）

ブロック数が多いページの標準形。パフォーマンスのため:

- DOM 取得とタイムライン構築は**初期化時に 1 回だけ**行う（スクロール中に querySelector しない）
- トリガーは要素ごとに作らず `ScrollTrigger.batch()` に集約する
- 同一ブロック内に複数画像がある場合は連鎖再生（2 枚目以降を少し遅らせる）

```js
// animations.js（フォトブロック）
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { buildCrossfadeTimeline } from "./reveal-timelines.js"; // ワイプにしたければ buildWipeTimeline に差し替え

gsap.registerPlugin(ScrollTrigger);

export const initPhotoBlockReveal = () => {
  const blockAnimations = [];

  for (const block of document.querySelectorAll("[data-reveal-block]")) {
    const links = block.querySelectorAll(".reveal-image");
    if (links.length === 0) continue;

    // ブロック内の全画像を 1 本のマスタータイムラインに連結
    const masterTl = gsap.timeline({ paused: true });
    let imageIndex = 0;

    for (const link of links) {
      const imageTl = buildCrossfadeTimeline(link);
      if (!imageTl) continue;
      imageTl.paused(false); // マスターに入れるので個別の paused は解除
      masterTl.add(imageTl, imageIndex > 0 ? "-=0.4" : 0); // 2 枚目以降は 0.4s 食い込ませて連鎖
      imageIndex++;
    }

    blockAnimations.push({ trigger: links[0], timeline: masterTl, played: false });
  }

  if (blockAnimations.length === 0) return;

  // --- batch: 同時に視界へ入った複数ブロックを 1 回のコールバックで処理 ---
  ScrollTrigger.batch(
    blockAnimations.map((b) => b.trigger),
    {
      start: "top 70%",
      once: true,
      onEnter: (batch) => {
        for (const trigger of batch) {
          const anim = blockAnimations.find((b) => b.trigger === trigger);
          if (anim && !anim.played) {
            anim.played = true;
            anim.timeline.play();
          }
        }
      },
    },
  );

  // --- 追いつき処理: 初期化時点で既にビューポート内にある要素を即再生 ---
  // SP は 1 画面の要素占有率が高く、ロード時点で先頭 1〜2 ブロックが視界内に
  // 入っていることが多い。batch の onEnter は「入った瞬間」しか拾わないため、
  // これが無いと最初のブロックがグレーのまま止まる。
  const threshold = window.innerHeight * 0.8;
  for (const anim of blockAnimations) {
    if (anim.played) continue;
    if (anim.trigger.getBoundingClientRect().top < threshold) {
      anim.played = true;
      anim.timeline.play();
    }
  }
};
```

HTML 側はブロックの親に `data-reveal-block` を付けるだけ:

```html
<section data-reveal-block>
  <a href="..." class="reveal-image">（references/css-layers.md の 2 層構造）</a>
  <a href="..." class="reveal-image">...</a>
</section>
```

## 呼び出し

```js
// main.js
import { initHeroReveal, initPhotoBlockReveal } from "./animations.js";

document.addEventListener("DOMContentLoaded", () => {
  initHeroReveal();       // プリローダー併用時は完了イベント購読に載せ替える
  initPhotoBlockReveal();
});
```

## 調整ポイント

| パラメータ | 既定値 | 説明 |
|---|---|---|
| ワイプ `grayDur` / `colorDur` | 1.0 / 1.2 | カラーをグレーよりわずかに長くすると追い越しの気持ちよさが出る。SP は両方 1.0 目安 |
| クロスフェード `grayDur` / `colorDur` | 0.6 / 0.4 | ブロック数が多いページはこのくらい短くてよい |
| `overlap` | 0.3〜0.4 | グレー完了を待たずにカラーを重ね始める食い込み量。0 だと 2 段階が「別々の動き」に見えて鈍い |
| batch `start` | top 70% | ワイプ / 2 段階演出は「しっかり見えてから」動かすため、単純フェード（85%）より深めに取る |
| 連鎖の食い込み | -=0.4 | 同一ブロック内 2 枚目以降の開始前倒し量 |
| 追いつき threshold | innerHeight * 0.8 | batch の start（70%）よりわずかに緩くして取りこぼしを防ぐ |
