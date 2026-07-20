# vh-fix — iOS URL バー対策の --vh カスタムプロパティ

## 適用条件

100vh ベースのレイアウト（ヒーロー等）が SP 実機でガタつく・見切れる場合の対策。まず CSS の `100svh` で解決できないか検討し、svh 非対応ブラウザまでケアする場合や「初期表示の高さで固定したい」場合にこの JS 版を使う（lp-utils SKILL.md の判断基準を参照）。

## JS（完全コード / viewport.js）

```js
/**
 * Viewport height helper
 *
 * svh 非対応ブラウザや、ブラウザ間の viewport 挙動差異に対するフォールバック。
 * `--vh` カスタムプロパティを window.innerHeight ベースで設定する。
 *
 * 重要: 更新は **初期化時 + orientationchange のみ**。
 * resize/scroll で更新すると、iOS の URL バー伸縮で頻発してレイアウトシフトを招く。
 */
export const initViewport = () => {
  const setVH = () => {
    document.documentElement.style.setProperty(
      "--vh",
      `${window.innerHeight * 0.01}px`,
    );
  };

  setVH();

  // iOS Safari は orientationchange 直後 innerHeight が古いので遅延を入れる
  window.addEventListener("orientationchange", () => {
    setTimeout(setVH, 200);
  });
};
```

## 初期化（main.js）

```js
import { initViewport } from "./viewport.js";

document.addEventListener("DOMContentLoaded", () => {
  initViewport(); // 他の init より先に呼ぶ（レイアウト値に依存する処理があるため）
});
```

## CSS 側の使い方

```css
.hero {
  /* --vh 未設定でも壊れないよう、必ずフォールバック付きで参照する */
  height: calc(var(--vh, 1vh) * 100);
}
```

`svh` と併用する場合は、svh を優先しつつフォールバックとして重ねる:

```css
.hero {
  height: calc(var(--vh, 1vh) * 100); /* フォールバック */
  height: 100svh; /* 対応ブラウザはこちらが勝つ */
}
```

## 運用メモ

- **resize で更新しない**のがこの実装の核。resize に紐付けると iOS の URL バー伸縮のたびに --vh が変わり、ヒーローの高さが動いて対策前より悪化する
- orientationchange の 200ms 遅延は iOS Safari が回転直後に古い innerHeight を返す実測対策。短くしない
- 「URL バーが縮んだ後の全画面高さ」に追従させたい要件（＝動く方が正しい要件）なら、このユーティリティではなく `100dvh` を使う
