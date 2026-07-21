---
name: lp-design-tokens
description: LP のデザイントークン（CSS カスタムプロパティ）・ブレークポイント・タイポグラフィの標準辞書。`:root` トークンの完全雛形、過去案件で実際に起きた命名ドリフト（--color-rule vs --color-border / --color-muted の役割混同 / コンテンツ幅トークン 3 系統 / --ease-out の中身違い 3 種）の「揺れ実例 → 標準名」対応表、mobile-first ブレークポイント標準と旧 max-width 方式の 1px 境界バグ警告、欧文ディスプレイ + 和文明朝のフォント構成と clamp() 流体タイプのレシピ、min(%, px) 幅プリセット方式、body に掛けるページ全体キャップ（Hero 含む全幅上限）のレシピまでを含む。ユーザーが「デザイントークン決めて」「CSS 変数を整理して」「:root の変数作って」「ブレークポイントどうする」「レスポンシブの境界値」「フォント設定して」「タイポグラフィ組んで」「clamp でフォントサイズ」「色と余白の変数」「トークン初期化して」「ページ全体に max-width を入れて」「サイト全体の幅を制限して」等を言ったとき、または新規 LP プロジェクトの立ち上げ・スタイル基盤整備・他案件からの CSS 移植の文脈では必ずこのスキルを使うこと。
---

# lp-design-tokens

LP 案件のスタイル基盤（色・フォント・余白・幅・イージング・ブレークポイント）を、案件をまたいで同じ名前・同じ構造で初期化するための標準辞書。トークンの完全雛形と命名対応表は references にあり、SKILL.md は「どれを選び、どの順で入れるか」の判断だけを扱う。

## いつ使うか

- 新規 LP プロジェクトで `:root` のトークンセットを初期化するとき
- 既存案件の CSS を移植・流用する際に、変数名の揺れを標準名に正規化するとき
- ブレークポイントの方式（mobile-first / 旧 max-width）を決める・移行するとき
- 見出し・価格・本文のフォントサイズ設計（clamp() 流体タイプ）を組むとき

## 判断基準

### トークンは標準名で始める（独自命名しない）

命名は references/tokens-template.md の標準セットに従う。過去案件では同じ役割のトークンが案件ごとに別名（例: 濃罫線が `--color-rule` と `--color-border`、コンテンツ最大幅が `--content-width-desktop` / `--container-max` / `--content-max-width` の 3 系統）で定義され、移植のたびに読み替えが必要になった。**新規案件は標準名のみを使い、移植時は対応表で標準名に置換してから持ち込む。**

特に注意する揺れ:

| 役割                       | 標準名                              | 過去に観測された揺れ                                                |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| 濃罫線（枠・グループ境界） | `--color-rule`                      | `--color-border`                                                    |
| 薄罫線（行間区切り）       | `--color-rule-light`                | `--color-muted` を罫線に流用（役割混同）                            |
| 薄色テキスト（補足・タグ） | `--color-muted`                     | 罫線色と共用されがち                                                |
| コンテンツ最大幅           | `--content-width-desktop`           | `--container-max` / `--content-max-width` / `--container-max-width` |
| 標準イージング             | `--ease-out`（カーブは 1 種に固定） | 同名 `--ease-out` に**中身が 3 種**存在（最悪の揺れ）               |

`--ease-out` は「同じ名前なのに案件ごとにカーブが違う」状態が最も危険。標準カーブ以外を使いたい場合は別名（`--ease-out-quint` 等）を追加し、`--ease-out` の中身は変えない。

### ブレークポイントは mobile-first 2 段が標準

- 標準: 基本スタイルをモバイルで書き、`@media (width >= 768px)`（タブレット）と `@media (width >= 1024px)`（デスクトップ）で上書きする
- 旧方式（`max-width: 768px` と `min-width: 769px` の混在）は **768〜769px の間に 1px の適用漏れ・二重適用が生まれる境界バグ**の実例があるため新規では禁止。移行手順と事故パターンは references/breakpoints.md を参照
- PC / SP の画像出し分け（`.pc` / `.sp`）は同一境界値で隙間なく切り替える

### タイポグラフィは「役割 2 フォント + 流体サイズ」

- フォントは `--font-primary`（本文。和文明朝フォールバックスタック）と `--font-display`（欧文ディスプレイ {{DISPLAY_FONT}}。見出し・数字用）の 2 役割で構成する。詳細は references/typography.md
- 見出し・価格など画面幅で大きく変わるサイズは `clamp(最小, 可変, 最大)` の流体タイプで 1 定義に収める（ブレークポイントごとの font-size 上書きを乱立させない）

### 幅の設計は 2 方式から選ぶ

- **コンテナ方式（既定）**: `--content-width-mobile`（%）+ `--content-width-desktop`（上限）を `.container` に集約。セクションの幅が概ね揃う通常の LP はこちら
- **幅プリセット方式**: `min(%, px)` の段階プリセット（xs〜2xl〜full）を定義し、ブロックごとに幅を選ぶ。**画像ごとに幅を変えるエディトリアル型（縦に写真を並べ、リズムを幅で作る構成）**ではこちらが向く。references/fluid-width-presets.md を参照
- 両方式は併用可（読み物はコンテナ、ギャラリーはプリセット）
- **ページ全体キャップ（どちらの方式とも併用可）**: Hero などフルブリードのセクションも含めて LP 全体に上限幅を掛ける場合は、ラッパー要素を追加せず `body` に `max-width: var(--content-width-desktop)` + `margin-inline: auto` を掛ける。上限値は案件ごとに決めるが、**ヒーロー画像の実幅を超えると PC で拡大ボケする**ため支給画像幅を目安にする。レシピと注意点（ガター背景・fixed 要素の補正・dev の FOUC）は references/tokens-template.md を参照

## 導入手順

1. references/tokens-template.md の `:root` 雛形を `src/styles/global.css`（静的構成なら `css/style.css` 冒頭）に配置する
2. ブランド実値を差し替える: `--color-primary` に {{ACCENT_COLOR}}、`--font-display` に {{DISPLAY_FONT}}（フォント読み込みは案件のフォント方針に従う）
3. ブレークポイントを references/breakpoints.md の標準形（mobile-first 2 段）で統一する。既存 CSS を移植する場合は旧方式の検出 grep を先に実行する
4. 見出し・価格の clamp() レシピを references/typography.md から適用する
5. エディトリアル型なら references/fluid-width-presets.md の幅プリセットを追加する
6. ページ全体に上限幅を掛ける案件は references/tokens-template.md の「ページ全体キャップ」を body に適用する（上限値はヒーロー画像の実幅を目安に案件ごとに決める）
7. 移植した CSS 内の揺れ名を対応表に従って標準名へ一括置換し、未定義変数参照が残っていないか検査する

## 検品チェックリスト

- [ ] 色・フォント・イージングのハードコードがセクション CSS に無い（必ず `var(--...)` 参照）
- [ ] 同じ役割のトークンが 2 つの名前で存在しない（対応表の揺れ名で grep してヒット 0）
- [ ] `var(--...)` の参照先がすべて `:root` に定義されている（タイポミス・移植漏れの未定義参照ゼロ）
- [ ] `--ease-out` の中身が標準カーブと一致している（別カーブが必要な箇所は別名トークン）
- [ ] メディアクエリが `width >=` の mobile-first で統一され、`max-width: 768px` / `min-width: 769px` の混在が無い
- [ ] ブレークポイント境界（767 / 768 / 769px）で表示崩れ・`.pc`/`.sp` の同時表示・同時非表示が起きない
- [ ] clamp() の最小値がモバイル実機で読めるサイズ（本文相当は 12px を下回らない）
- [ ] ブランド差し替え対象（`--color-primary` / `--font-display`）がプレースホルダのまま残っていない

## references

- `references/tokens-template.md` — `:root` 完全雛形と「揺れ実例 → 標準名」命名対応表、移植時の一括置換手順。
- `references/breakpoints.md` — mobile-first 標準形、PC / SP 出し分け、旧 max-width 方式の 1px 境界バグと移行手順。
- `references/typography.md` — 欧文ディスプレイ + 和文明朝の役割構成、フォールバックスタック、clamp() 流体タイプのレシピと計算式。
- `references/fluid-width-presets.md` — `min(%, px)` 幅プリセット方式（エディトリアル型向けの代替案）。
