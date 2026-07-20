---
globs: ["src/scripts/animations.js", "src/**/*.js"]
---

# GSAP 使用規約

## 初期化

- `ScrollTrigger` 等のプラグインは使用前に明示的に登録する: `gsap.registerPlugin(ScrollTrigger)`
- アニメーション定義は `src/scripts/animations.js` に集約する

## アクセシビリティ

- `prefers-reduced-motion: reduce` が有効な場合はアニメーションを無効化またはシンプルにする
- 実装例:

```js
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!prefersReducedMotion) {
  // GSAP アニメーションを実行
}
```

## 画像・要素の表示演出

- ファーストビュー外の要素のフェードイン演出には `ScrollTrigger` を使用する
- `IntersectionObserver` を別途使わず、表示トリガーは `ScrollTrigger` に一本化する
- 初期非表示を CSS で行うため、`gsap.from()` ではなく **`gsap.fromTo()` を使う**（`from()` は CSS の `opacity: 0` を終了値として読んでしまい、要素が表示されない）
- 実装例（テンプレ同梱の `src/scripts/animations.js` が正）:

```js
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
      },
    },
  );
}
```

- 表示演出の対象は HTML 側で `data-animate` 等のカスタムデータ属性で指定する
- 初期非表示は CSS 側で行い、**JS 無効・reduced-motion 環境では隠さない**（global.css に定義済み）:

```css
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  [data-animate] {
    opacity: 0;
  }
}
```

## パフォーマンス

- `transform` と `opacity` のみアニメーションさせることを優先する（レイアウトの再計算を避ける）
- 不要になった ScrollTrigger インスタンスは `.kill()` で破棄する
