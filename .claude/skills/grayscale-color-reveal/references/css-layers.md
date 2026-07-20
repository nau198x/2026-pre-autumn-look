# 層構造 HTML + CSS（ワイプ / クロスフェード共通）

同一画像を「grayscale 層」「color 層」の 2 枚重ねにする基盤。グレー版の画像ファイルは作らず、CSS フィルタ + カラーオーバーレイで生成する。ワイプでもクロスフェードでも HTML / CSS はこの 1 種類で共通（動きの違いは JS 側だけ）。

適用条件: ワイプ版・クロスフェード版（references/js-wipe.md）を使う場合。行 stagger 変種（references/row-stagger-variant.md）はこの層構造を使わない。

## HTML

```html
<!-- フォトブロック用: リンク内に 2 層。src は同一（ブラウザは 1 回しか取得しない） -->
<a href="{{PRODUCT_URL}}" class="reveal-image" target="_blank" rel="noopener">
  <div class="reveal-layer reveal-grayscale">
    <img src="images/look_01.webp" alt="{{ALT_TEXT}}" width="800" height="1000" loading="lazy" />
  </div>
  <div class="reveal-layer reveal-color">
    <img src="images/look_01.webp" alt="" aria-hidden="true" width="800" height="1000" loading="lazy" />
  </div>
</a>
```

- 2 枚目の img は視覚演出用の複製なので `alt=""` + `aria-hidden="true"`（スクリーンリーダーに二重に読ませない）
- `width` / `height` は実画像の寸法比に合わせる（lazy 画像のレイアウトシフト = ScrollTrigger ズレの主因）
- ヒーローで使う場合も構造は同じ。`loading="eager" fetchpriority="high"` に変えるだけ

## CSS

```css
/* ===============
   2 層リビール共通
   =============== */
.reveal-image {
  position: relative; /* color 層の absolute 基準 */
  display: block;
}

.reveal-image img {
  display: block;
  width: 100%;
  height: auto;
}

/* 両層とも JS が出すまで不可視。overflow: hidden はワイプの「幕」に必須 */
.reveal-layer {
  visibility: hidden;
  overflow: hidden;
}

/* --- grayscale 層 --- */
.reveal-grayscale {
  position: relative;
}

.reveal-grayscale img {
  /* コントラストを強めに上げるとフィルム調のモノクロになる。100〜300% で好みに調整 */
  filter: grayscale(100%) contrast(300%);
  transform-origin: left; /* ワイプ時の基準 */
}

/* カラーオーバーレイ: モノクロに薄くブランド色を乗せ、単純な白黒より誌面的なトーンにする */
.reveal-grayscale::after {
  content: "";
  position: absolute;
  inset: 0;
  background: {{ACCENT_COLOR}}; /* 例: 生成りベージュ・ブランドのアクセントカラー等 */
  mix-blend-mode: hard-light;   /* screen にすると軽く、multiply にすると重いトーン */
  pointer-events: none;
}

/* --- color 層（grayscale の真上に重なる） --- */
.reveal-color {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.reveal-color img {
  transform-origin: left;
}
```

## JS 無効 / reduced-motion のガード

`.reveal-layer { visibility: hidden }` を素で書くと、JS 無効環境では画像が永久に見えない。初期非表示は必ず条件付きメディアクエリで包むこと:

```css
/* 上の .reveal-layer { visibility: hidden } はこの中に移す */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  .reveal-layer {
    visibility: hidden;
    overflow: hidden;
  }
}

/* 条件を満たさない環境では grayscale 層ごと隠し、カラーのみ即時表示 */
@media (scripting: none), (prefers-reduced-motion: reduce) {
  .reveal-grayscale {
    display: none;
  }
  .reveal-color {
    position: static; /* absolute 重ねを解除して通常フローで表示 */
  }
}
```

注記: 参照元の実装は `visibility: hidden` が無条件で、JS 無効時に画像が表示されない潜在バグがあったため、このガードを標準に組み込んだ。

## 調整ポイント

| パラメータ | 既定値 | 説明 |
|---|---|---|
| `contrast()` | 300% | モノクロの硬さ。100%（素の白黒）〜300%（ハイコントラスト） |
| オーバーレイ色 | {{ACCENT_COLOR}} | 暖色系ならセピア調、寒色系ならクール調に転ぶ。無しも可（::after ごと削除） |
| `mix-blend-mode` | hard-light | screen = 明るく淡い / hard-light = 色が乗る / multiply = 暗く沈む |
| `transform-origin` | left | ワイプ方向を右→左にする場合は right に |
