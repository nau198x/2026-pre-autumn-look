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
- ブランド差し替え対象は `--color-primary` と `--font-display`（本 ROPÉ 案件では `--font-primary` の欧文ブランド書体も。setup-brand スキル）。ハードコードしない
- フォントは 2 役割: `--font-primary` = 本文 / `--font-display` = 見出し・数字・価格。どちらも先頭にブランドの欧文ディスプレイ（本案件は Marcellus）を置き、和文は明朝スタックへフォールバックする。※テンプレ既定では `--font-primary` は明朝固定だが、本 ROPÉ 案件は本文の欧文もブランド書体で揃える方針

## 単位・サイズ

- `px` よりも `rem` を優先する（`font-size` / `margin` / `padding` / `gap` は rem 必須。1px の罫線等は px 可）
- 画像の `max-width: 100%` は base.css で設定済み

## 画像の遅延読み込み

- 遅延読み込み対象の画像にはフェードイン等のトランジションを設定し、表示時のちらつきを緩和する
