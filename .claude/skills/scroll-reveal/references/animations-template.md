# GSAP + ScrollTrigger 版（標準テンプレート）

`[data-animate]` を一括で拾う基本ループと、セクション個別調整用のファクトリ関数。**`gsap.from()` は使用禁止** — CSS で `opacity: 0` にした要素に `from()` を使うと、GSAP が「現在値 0」を終着値として読み、要素が表示されなくなる。必ず `fromTo()` で両端を明示する。

適用条件: プロジェクトで GSAP を使用している。表示トリガーは ScrollTrigger に一本化する（IntersectionObserver 併用禁止）。

## CSS（global CSS に追加）

```css
/* JS 有効 + 動き許容のときだけ初期非表示にする。
   JS 無効・reduced-motion では最初から見える = コンテンツが消えない */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  [data-animate] {
    opacity: 0;
  }
}
```

## JS（基本形）

```js
// animations.js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const initScrollAnimations = () => {
  if (prefersReducedMotion) return; // CSS 側の条件で初期非表示も無効なので、早期 return で完結

  for (const el of gsap.utils.toArray("[data-animate]")) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
          invalidateOnRefresh: true, // lazy 画像等で高さが変わっても refresh 時に再計算
        },
      },
    );
  }
};
```

## 呼び出し

```js
// main.js
import { initScrollAnimations } from "./animations.js";

document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
});
```

プリローダー併用時は DOMContentLoaded ではなく、プリローダーの `onComplete`（スクロールロック解除後）で呼ぶ。`overflow: hidden` 中に初期化すると下方トリガーの位置計算が破綻する。

## lazy 画像対策

`loading="lazy"` の画像が多い LP では、画像確定のたびにレイアウト高さが変わり、`once: true` で発火済み・未発火のトリガー位置がズレる。以下を併用する:

```js
// 主要画像（ヒーロー等）の確定後に一度 refresh
window.addEventListener("load", () => ScrollTrigger.refresh());
```

- `loading="lazy"` の `<img>` には必ず `width` / `height` 属性を付けてレイアウトシフト自体を抑える（根本対策）
- それでもズレる場合の症状は「下にスクロールするほど発火が遅れる / ページ中盤で発火しなくなる」

## ファクトリ関数型（セクション個別調整用）

一括ループでは足りない「このセクションだけ start・stagger・delay を変えたい」ケース向け。`autoAlpha`（opacity + visibility）を使う版。

```js
/**
 * スクロールで画面内に入ったらフェードイン
 * @param {string|Element} selector - 対象のセレクタまたは要素
 * @param {Object} opts
 * @param {string|Element} opts.trigger - ScrollTrigger のトリガー（省略時は selector）
 * @param {string} opts.start          - 開始位置（default: "top 85%"）
 * @param {number} opts.duration       - 秒数（default: 0.8）
 * @param {number} opts.delay          - 開始遅延（default: 0）
 * @param {number} opts.stagger        - 複数要素の間隔（default: 0.1）
 * @param {string} opts.ease           - イージング（default: "power1.out"）
 */
export const fadeIn = (selector, opts = {}) => {
  const { trigger = selector, start = "top 85%", duration = 0.8, delay = 0, stagger = 0.1, ease = "power1.out" } = opts;

  const elements = typeof selector === "string" ? document.querySelectorAll(selector) : [selector];
  if (elements.length === 0) return;

  gsap.set(elements, { autoAlpha: 0 });

  ScrollTrigger.create({
    trigger: typeof trigger === "string" ? document.querySelector(trigger) || trigger : trigger,
    start,
    once: true,
    invalidateOnRefresh: true,
    onEnter: () => {
      gsap.to(elements, { duration, autoAlpha: 1, stagger, ease, delay });
    },
  });
};
```

使用例:

```js
// リスト行を親トリガーで拾い、行を 0.1s 刻みで
fadeIn(".credit-list li", { trigger: ".credit-list", start: "top 90%" });

// 2 枚組の画像を時間差で
fadeIn(".gallery .item-1", { start: "top 80%" });
fadeIn(".gallery .item-2", { start: "top 80%", delay: 0.3 });
```

注意: ファクトリ型は `gsap.set` で初期非表示にするため、CSS の `[data-animate]` ルールとは独立して動く。同一要素に両方掛けない（どちらか一方に寄せる）。

## 個別調整をデータ属性で行う場合（任意拡張)

要素数が多く JS を触らせたくない場合は、属性値でパラメータを渡す拡張が使える:

```js
for (const el of gsap.utils.toArray("[data-animate]")) {
  const y = Number(el.dataset.animateDistance ?? 30);
  const delay = Number(el.dataset.animateDelay ?? 0);
  const start = el.dataset.animateStart ?? "top 85%";

  gsap.fromTo(
    el,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      delay,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start, once: true, invalidateOnRefresh: true },
    },
  );
}
```

```html
<figure data-animate data-animate-delay="0.3" data-animate-start="top 80%">...</figure>
```

## 調整ポイント

| パラメータ | 既定値 | 説明 |
|---|---|---|
| `start` | top 85% | 75〜90% の間で用途別に（SKILL.md の目安参照） |
| `y` | 30 | 移動量。大きい画像は 20〜30、テキスト行は 5〜10 が自然 |
| `duration` | 0.6 | 0.6〜1.0。長すぎるとスクロールに置いていかれる |
| `ease` | power2.out | 落ち着き系は power1.inOut |
| `once` | true | 原則固定。繰り返し再生はチカチカするので採用しない |
