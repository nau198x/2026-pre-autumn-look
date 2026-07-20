# fluid-width-presets — min(%, px) 幅プリセット方式

## 適用条件

縦に写真を並べ、**ブロックごとに幅を変えてリズムを作るエディトリアル型**の LP 向けの幅管理方式。`min(%, px)` の段階プリセットを :root に定義し、各ブロックは「どの段を使うか」だけを選ぶ。

- % 側 … 小さい画面では画面比で伸縮
- px 側 … 大きい画面では上限で止まる（写真が間延びしない）

通常のコンテンツ幅 2 段階（--content-width-mobile / -desktop）で足りる案件では不要。「ブロックごとに幅指定が頻発しそう」と感じた時点でこちらに切り替えると、後から `#block-N { width: ... }` の個別上書きが増殖するのを防げる。

## トークン定義（完全コード / global.css の :root に追加）

```css
/* 幅トークン: 読み物幅（テキスト/クレジット）とギャラリーの段階プリセット。
   各ブロックは width: var(--gallery-*) で段を選ぶ。
   既定幅を変えたいブロックは自ブロック内で --gallery-width を上書きする */
:root {
  --readable: min(80%, 1000px); /* 読み物幅（テキスト・クレジット用） */

  /* 小さめプリセット */
  --gallery-xs: min(32%, 400px);
  --gallery-sm: min(44%, 550px);
  --gallery-width: min(56%, 700px); /* ギャラリー既定幅 */

  /* 大きめプリセット */
  --gallery-md: min(68%, 850px);
  --gallery-lg: min(80%, 1000px); /* ≒読み物幅 */
  --gallery-xl: min(90%, 1400px);
  --gallery-2xl: min(96%, 1760px);
  --gallery-full: 100%; /* 画面全幅 */
}

/* SP では % 側しか効かないため、SP 専用の比率に調整する */
@media (width < 768px) {
  :root {
    --readable: 80%;
    --gallery-width: 64%;
  }
}
```

全幅ブロック（--gallery-full）を使う場合は、横スクロール保険を body に入れておく:

```css
body {
  overflow-x: hidden; /* 全幅ブロック使用時の横スクロール保険 */
}
```

## 使い方（HTML + CSS 例）

```css
.image-gallery {
  width: var(--gallery-width); /* 既定幅 */
  margin: 0 auto;
}

/* ブロック単位で段を変える: モディファイアで段を選ぶ */
.image-gallery--lg {
  --gallery-width: var(--gallery-lg);
}

.image-gallery--full {
  --gallery-width: var(--gallery-full);
}
```

```html
<div class="image-gallery">…既定幅のブロック…</div>
<div class="image-gallery image-gallery--lg">…大きめのブロック…</div>
<div class="image-gallery image-gallery--full">…全幅のブロック…</div>
```

## 運用メモ

- **段の追加は最終手段**。xs〜full の 8 段で足りない「中間が欲しい」が出たら、まずどちらかの段に寄せる。段を増やすと「実質フリーハンド」に戻り、プリセットの意味が消える
- ブロック個別の幅指定は、生の width 上書きではなく **--gallery-width の上書き**（または段選択モディファイア）で行う。こうすると「どの段を使ったか」が CSS から追える
- 読み物（テキスト・クレジット）は常に --readable を使い、ギャラリーの段と混ぜない
- lp-section-layouts スキルのユーティリティ型（w-narrow / w-wide 等）とは思想が競合する。**1 案件でどちらか一方に統一する**こと（併用すると幅の出どころが二重管理になる）
