---
globs: ["src/**/*.css"]
---

# CSS コーディング規約

## ファイル構成

- `src/styles/base.css`: リセットとベーススタイルのみ
- `src/styles/global.css`: `:root` のデザイントークン（CSS 変数）と全体共通スタイルのみ
- セクションごとに `src/styles/セクション名.css` を作成する（例: `hero.css`, `features.css`）
- セクション CSS は `src/scripts/main.js` から import する

## 命名（BEM 風）

- ブロック（セクションのルートクラス）はケバブケース: `.section-name`
- 要素は `__` で繋ぐ: `.section-name__title`、修飾は `--`: `.section-name__title--large`
- スタイル用セレクタはクラスのみを使う。ID はページ内アンカー用途に限定する

## スコープ規律（コンポーネント移行を見据える）

- セクションのスタイルは必ずルートクラス配下にネイティブネストで書く
- ルートクラスの外に影響するセレクタ（タグ直指定のグローバル定義等）をセクション CSS に書かない

```css
.hero {
  padding: var(--spacing-lg) var(--spacing-sm);

  .hero__title {
    font-size: 1.5rem;
  }

  &:hover {
    opacity: 0.8;
  }
}
```

## デザイントークン

- CSS 変数は `global.css` の `:root` で定義する。色・フォント・イージングは必ずトークンを参照する
- 余白は `--spacing-*` スケール（`--spacing-xs` 〜 `--spacing-lg`）を基本とする。セクション上下の余白など、スケール外の値が必要な場合は rem 直値も可とする
- ブランド差し替え対象は `--color-primary` と `--font-display` の 2 つ（setup-brand スキル）。ハードコードしない
- フォントは 2 役割: `--font-primary` = 本文（和文明朝スタック・固定）/ `--font-display` = 見出し・数字・価格（ブランドの欧文ディスプレイ + 明朝フォールバック）

## 単位・サイズ

- `px` よりも `rem` を優先する（`font-size` / `margin` / `padding` / `gap` は rem 必須。1px の罫線等は px 可）
- 画像の `max-width: 100%` は base.css で設定済み

## 画像の遅延読み込み

- 遅延読み込み対象の画像にはフェードイン等のトランジションを設定し、表示時のちらつきを緩和する
