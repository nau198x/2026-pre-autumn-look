# scroll-lock-module — lockScroll / unlockScroll の JS + CSS 一式

## 適用条件

- `<body>` が実スクロールコンテナである一般的な構成（SPA の独自スクロールルートには body セレクタを差し替えて適用）
- ES Modules 構成（Vite / webpack / native ESM）。script 直書きなら export を外すだけ

なぜ CSS と JS の両方が要るか: body への `overflow: hidden` だけでは **iOS Safari のタッチスクロールが止まらない**。逆に JS の `preventDefault()` だけではスクロールバー操作やキーボードが残る。CSS 3 プロパティ + JS イベント抑止を同時に適用して初めて全プラットフォームで止まる。

## 基本版

### JS（utils/scroll-lock.js）

```js
// スクロールロック ユーティリティ
// wheel / touchmove を preventDefault し、body にクラスを付与して
// CSS 側の overflow:hidden + touch-action:none + overscroll-behavior:none を効かせる。

const CLASS_NAME = "is-scroll-locked";

const preventScroll = (e) => e.preventDefault();

export const lockScroll = () => {
  document.body.classList.add(CLASS_NAME);
  window.addEventListener("wheel", preventScroll, { passive: false });
  window.addEventListener("touchmove", preventScroll, { passive: false });
};

export const unlockScroll = () => {
  document.body.classList.remove(CLASS_NAME);
  window.removeEventListener("wheel", preventScroll);
  window.removeEventListener("touchmove", preventScroll);
};

export const isScrollLocked = () => document.body.classList.contains(CLASS_NAME);
```

ポイント:

- `{ passive: false }` は `preventDefault()` を有効にするために必須（wheel / touchmove のデフォルトは passive 扱い）
- `preventScroll` をモジュールスコープの const にしておくことで add / remove が同じ関数参照を指し、確実に解除できる

### CSS（global.css に追記）

```css
body.is-scroll-locked {
  overflow: hidden; /* デスクトップのホイール・スクロールバー操作を止める */
  touch-action: none; /* iOS Safari のタッチスクロールを止める */
  overscroll-behavior: none; /* Android Chrome 等の overscroll bounce を止める */
}
```

### 組み込み例

```js
import { lockScroll, unlockScroll } from "./utils/scroll-lock.js";

// モーダル
openButton.addEventListener("click", () => {
  modal.classList.add("is-open");
  lockScroll();
});
closeButton.addEventListener("click", () => {
  modal.classList.remove("is-open");
  unlockScroll();
});

// プリローダー（フェード完了時に解除）
lockScroll();
preloader.addEventListener(
  "transitionend",
  () => {
    preloader.remove();
    unlockScroll();
  },
  { once: true },
);

// ハンバーガーメニュー
menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  if (isOpen) lockScroll();
  else unlockScroll();
});
```

## 変種 1: ref counter 版（多重オーバーレイ対応）

A を開く → B を開く → B を閉じる、の順で B の unlock が A のロックまで解除してしまう問題をカウンタで防ぐ。export 名は基本版と同じなので呼び出し側は変更不要:

```js
const CLASS_NAME = "is-scroll-locked";
const preventScroll = (e) => e.preventDefault();

let lockCount = 0;

export const lockScroll = () => {
  lockCount++;
  if (lockCount === 1) {
    document.body.classList.add(CLASS_NAME);
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
  }
};

export const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.classList.remove(CLASS_NAME);
    window.removeEventListener("wheel", preventScroll);
    window.removeEventListener("touchmove", preventScroll);
  }
};
```

## 変種 2: scroll position 保持版（iOS の位置飛び対策）

iOS Safari は body に `overflow: hidden` をかけるとスクロール位置を失うことがある。`position: fixed` + `top: -scrollY` で見た目の位置を固定し、解除時に復元する:

```js
const CLASS_NAME = "is-scroll-locked";
const preventScroll = (e) => e.preventDefault();

let savedScrollY = 0;

export const lockScroll = () => {
  savedScrollY = window.scrollY;
  document.body.style.top = `-${savedScrollY}px`;
  document.body.classList.add(CLASS_NAME);
  window.addEventListener("wheel", preventScroll, { passive: false });
  window.addEventListener("touchmove", preventScroll, { passive: false });
};

export const unlockScroll = () => {
  document.body.classList.remove(CLASS_NAME);
  document.body.style.top = "";
  window.scrollTo(0, savedScrollY);
  window.removeEventListener("wheel", preventScroll);
  window.removeEventListener("touchmove", preventScroll);
};
```

対応する CSS（`position: fixed` を追加）:

```css
body.is-scroll-locked {
  position: fixed;
  left: 0;
  right: 0;
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}
```

## 変種 3: キーボードスクロールも封じる

アクセシビリティへの影響が大きいため、必要な場合のみ。input / textarea へのフォーカス中はブロックしない:

```js
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End", " "]);

const preventKey = (e) => {
  if (e.target.matches("input, textarea, select, [contenteditable]")) return;
  if (SCROLL_KEYS.has(e.key)) e.preventDefault();
};

// lockScroll 内に追加:  window.addEventListener("keydown", preventKey);
// unlockScroll 内に追加: window.removeEventListener("keydown", preventKey);
```

## 注意

- **オーバーレイ内部をスクロールさせたい場合**（長文モーダル等）: `preventScroll` を素通しにする例外を入れる。`const preventScroll = (e) => { if (e.target.closest(".modal__scrollable")) return; e.preventDefault(); };`（内部スクロール領域には CSS で `overscroll-behavior: contain` も付けておくと連鎖スクロールを防げる）
- body が実スクロールコンテナでない構成（`<div id="app">` 独自スクロール等）では、CSS のセレクタとクラス付与先をそのコンテナに差し替える
- 開発中の Hot Reload でモジュールが再評価されると `preventScroll` の参照がズレて解除できなくなることがある。ブラウザリロードで直る（本番では起きない）
