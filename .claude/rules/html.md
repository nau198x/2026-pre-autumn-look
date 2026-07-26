---
globs: ["**/*.html"]
---

# HTML コーディング規約

## 整形（Prettier）

- HTML のみ `printWidth: 140`（`.prettierrc` の `overrides` で指定）。CSS / JS / MD は既定の 80 のまま
- 理由: Prettier は幅を超えると属性を**1 つずつ改行**する（部分的に折り返す挙動が無い）。既定の 80 では `<img>` や商品リンクの `<a>` が毎回 5〜7 行に分解され、構造が追えなくなる
- 140 は実測値。`<img src alt width height loading decoding />` が最深ネストで約 134 桁になるため、これが 1 行に収まる下限として選んでいる
- 属性の過剰改行が復活したときは、まず `.prettierrc` の overrides が消えていないかを疑う

## セマンティクス

- セマンティックなHTML要素を使用する (`<header>`, `<section>`, `<nav>`, `<footer>` など)
- 見出し階層を適切に維持する（`<h1>` → `<h2>` → `<h3>` の順）

## アクセシビリティ

- すべての `<img>` に意味のある `alt` 属性を設定する
- インタラクティブ要素には適切な `aria` 属性を付与する
- フォーカス可能な要素のキーボードナビゲーションを確保する

## 画像の遅延読み込み

- ファーストビュー外の `<img>` には `loading="lazy"` を付与する
- ファーストビュー内（Hero等）の画像には `loading="eager"` を明示し、`fetchpriority="high"` を付与する
- `loading="lazy"` を使う `<img>` には必ず `width` / `height` 属性を指定する（レイアウトシフト防止）
- ファーストビュー外の演出対象には `data-animate` 属性を付与する
