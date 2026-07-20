# smooth-anchor — ページ内アンカーのスムーススクロール

## 適用条件

ページ内ナビ（目次・セクションジャンプ・TOP へ戻る）がある LP で、瞬間ジャンプをスムーススクロールにする。

- **GSAP を既に使っているページ** → ScrollToPlugin 版（ヘッダーオフセット・PC/SP duration・イージングを制御できる）
- **GSAP を入れていない軽量ページ** → CSS のみ版で済ませる

## A. GSAP ScrollToPlugin 版（完全コード / smooth-scroll.js）

```js
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

/**
 * ページ内アンカーのスムーススクロール
 * - 固定ヘッダーがある場合は headerOffset に実測値(px)を設定する
 * - prefers-reduced-motion では即時ジャンプに縮退する
 */
export const initSmoothScroll = ({ headerOffset = 20 } = {}) => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  for (const link of document.querySelectorAll('a[href^="#"]')) {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");

      // href="#" のみのリンクはスキップ（誤ってページ先頭へ飛ばさない）
      if (href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const offsetPosition =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;

      if (prefersReducedMotion) {
        window.scrollTo(0, offsetPosition);
        return;
      }

      // PC/SP で秒数を変える（SP は距離感が長く感じられるためゆっくり）
      const scrollDuration = window.innerWidth <= 768 ? 2 : 1;

      gsap.to(window, {
        scrollTo: { y: offsetPosition, autoKill: false },
        duration: scrollDuration,
        ease: "power1.inOut",
      });
    });
  }
};
```

初期化（main.js）:

```js
import { initSmoothScroll } from "./smooth-scroll.js";

document.addEventListener("DOMContentLoaded", () => {
  initSmoothScroll({ headerOffset: 20 });
});
```

## B. CSS のみ版（GSAP 不使用ページ向け）

```css
html {
  scroll-behavior: smooth;
  /* 固定ヘッダーの高さぶん着地位置を下げる */
  scroll-padding-top: 4rem;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

CSS 版は duration・イージングを制御できないが、JS ゼロで導入でき、reduced-motion 対応もメディアクエリだけで済む。

## 運用メモ

- 元実装からの変更点: ES module 化、reduced-motion の即時ジャンプ縮退を追加、`href="#"` ガードを維持
- `autoKill: false` はスクロール中のわずかなユーザー操作で移動が中断されるのを防ぐ。ページが長大で「ユーザーが途中で止めたい」ことが想定されるなら true も検討（SKILL.md の設計上の必須事項を参照）
- headerOffset は固定ヘッダーの実測高さ + 余白で決める。ヘッダーが SP/PC で高さが違う場合は matchMedia で出し分ける
- ScrollToPlugin を registerPlugin するのを忘れると `scrollTo` プロパティが無言で無視される（エラーにならないため気付きにくい）
