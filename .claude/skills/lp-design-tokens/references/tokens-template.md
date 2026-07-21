# `:root` トークン完全雛形 + 命名対応表

新規案件はこの雛形をそのまま `src/styles/global.css`（静的構成なら `css/style.css` の冒頭）に置き、ブランド実値（`{{ACCENT_COLOR}}` / `{{DISPLAY_FONT}}`）だけを差し替える。**独自の変数名を追加する前に、必ずこの雛形と下の対応表に同じ役割が無いか確認する。**

## 完全雛形

```css
/* ----------------------------------------------------------------
 Design tokens
----------------------------------------------------------------- */
:root {
  /* colors */
  --color-text: #000; /* 本文テキスト */
  --color-bg: #fff; /* ページ背景 */
  --color-link: #000; /* リンク */
  --color-primary: {{ACCENT_COLOR}}; /* ブランドアクセント（案件ごとに差し替え） */
  --color-rule: #111; /* 濃罫線（枠・グループ境界） */
  --color-rule-light: #aaa; /* 薄罫線（行間の区切り） */
  --color-muted: #999; /* 薄色テキスト（補足・タグ等。罫線には使わない） */

  /* typography（詳細は typography.md） */
  --font-primary:
    "游明朝", "YuMincho", "Hiragino Mincho ProN W3", "ヒラギノ明朝 ProN W3",
    "Hiragino Mincho ProN", serif; /* 本文: 和文明朝スタック */
  --font-display:
    "{{DISPLAY_FONT}}", "游明朝", "YuMincho",
    "Hiragino Mincho ProN", serif; /* 見出し・数字: 欧文ディスプレイ + 明朝フォールバック */

  /* spacing（rem スケール。中間値が必要なら -mdl 等を追加してよいが命名は揃える） */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 4rem;
  --spacing-xl: 6rem;

  /* layout */
  --content-width-mobile: 90%; /* モバイルのコンテンツ幅（%） */
  --content-width-tablet: 88%; /* タブレットのコンテンツ幅（%）。不要なら省略可 */
  --content-width-desktop: 70rem; /* コンテンツ最大幅（案件で 60〜80rem 程度に調整） */

  /* motion */
  --duration-fast: 0.2s;
  --duration-base: 0.5s;
  --duration-slow: 0.8s;
  --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1); /* 標準カーブ（easeOutCubic）。中身を変えない */
}
```

コンテナはトークンを参照する形で 1 箇所に定義する:

```css
.container {
  width: var(--content-width-mobile);
  max-width: var(--content-width-desktop);
  margin-inline: auto;
}

@media (width >= 768px) {
  .container {
    width: var(--content-width-tablet);
  }
}
```

## ページ全体キャップ（Hero 含む全幅上限）

Hero などフルブリードのセクションも含めて **LP 全体**に上限幅を掛ける案件のレシピ。ラッパー要素は追加せず `body` に直接掛ける（HTML 変更ゼロ・各セクションの `width: 100%` がそのまま body 幅に追従するため、セクション CSS のスコープ規律にも影響しない）:

```css
body {
  max-width: var(--content-width-desktop); /* 上限値は案件ごとに調整 */
  margin-inline: auto;
  overflow-x: hidden; /* 全幅ブロック使用時の横スクロール保険 */
}
```

トークンは `.container` と同じ `--content-width-desktop` を共有する（併用時もコンテナは % 幅で内側に収まるため衝突しない）。新しい名前を作らないこと。

### 注意点

- **上限値はヒーロー画像の実幅を目安にする**。支給画像の幅を超える上限は PC で拡大ボケになる（実例: 1024px 幅画像 + 1280px 上限 → 最大 1.25 倍拡大。許容範囲だが、それ以上は高解像度画像の支給を待つ）
- 上限超過時の左右ガターには `html` の背景（既定 `--color-bg`）が見える。ガターに別色を敷く場合は `html { background: ... }` で指定する
- `position: fixed` の要素（フローティング CTA 等）は viewport 基準のため body のキャップに追従しない。左右位置は `right: max(1rem, calc((100vw - var(--content-width-desktop)) / 2 + 1rem))` のように補正する
- **Vite dev ではページ更新の一瞬、コンテンツが左寄せで見える**（CSS が JS 経由で注入されるまでの FOUC。中央寄せが入ったことで目立つようになる）。ビルド成果物は `<head>` の `<link rel="stylesheet">` がレンダーブロッキングになるため発生しない。`npm run preview` で確認する

## 命名対応表（揺れ実例 → 標準名）

複数の実案件を横断して観測された「同じ役割・別の名前」。移植・流用時はこの表で標準名へ置換してから持ち込む。

| 役割                       | 標準名                                               | 観測された揺れ実例                                                                                                               | 備考                                                     |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 濃罫線（枠・グループ境界） | `--color-rule`                                       | `--color-border: #111`                                                                                                           | 値はほぼ同じ、名前だけ違う典型                           |
| 薄罫線（行間区切り）       | `--color-rule-light`                                 | `--color-rule-light: #ddd` / `--color-muted: #aaa` を罫線に流用                                                                  | 「muted = テキスト」「rule = 線」で役割を分離する        |
| 薄色テキスト               | `--color-muted`                                      | `--color-muted: #666` / `#999` / `#aaa`（罫線と共用）                                                                            | 値の濃さは案件裁量。役割の混同だけ禁止                   |
| コンテンツ最大幅           | `--content-width-desktop`                            | `--container-max: 980px` / `--content-max-width: 1200px` / `--container-max-width: 1200px`                                       | 3 系統 4 表記が併存していた最大の揺れ                    |
| モバイル幅（%）            | `--content-width-mobile`                             | `88%` / `90%` / `92%`（名前は同じで値だけ揺れ）                                                                                  | 値の揺れは許容。名前は固定                               |
| 標準イージング             | `--ease-out` = `cubic-bezier(0.215, 0.61, 0.355, 1)` | 同名で `cubic-bezier(0.22, 1, 0.36, 1)`（quint 系・強い減速）/ `cubic-bezier(0.2, 0.7, 0.2, 1)`（独自カーブ）の**中身違い 3 種** | 同名別値は移植時に演出の質感が変わる事故になる。下記参照 |

### `--ease-out` の 3 カーブ問題

同じ `--ease-out` という名前で中身が案件ごとに違うと、CSS を移植した瞬間にアニメーションの質感が変わる（しかも lint では検出できない）。ルールは 2 つ:

1. `--ease-out` の中身は標準カーブ `cubic-bezier(0.215, 0.61, 0.355, 1)` に固定する
2. より強い減速（quint 系）が欲しい演出は**別名で追加**する:

```css
:root {
  --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1); /* 標準 */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1); /* 強い減速が欲しい演出用 */
}
```

## 移植時の一括検査・置換手順

```bash
# 1. 揺れ名の検出（移植元・移植先の両方で実行。標準名以外が出たら置換対象）
grep -rn --include="*.css" \
  -e "--color-border" -e "--container-max" -e "--content-max-width" -e "--container-max-width" \
  src/styles/

# 2. 置換（例: --container-max → --content-width-desktop）
grep -rl --include="*.css" -- "--container-max" src/styles/ | \
  xargs sed -i '' 's/--container-max\b/--content-width-desktop/g'

# 3. 未定義変数参照の検査: 使用中の変数一覧と :root 定義を突き合わせる
grep -rhoE 'var\(--[a-z0-9-]+' src/styles/ | sort -u | sed 's/var(//'
grep -rhoE '^\s*--[a-z0-9-]+' src/styles/global.css | sed 's/^\s*//' | sort -u
# → 前者にあって後者に無い名前 = 未定義参照（タイポ or 置換漏れ）
```

## 運用ルール

- セクション CSS に色・フォント・イージングのハードコードを書かない。必ず `var(--...)` を参照する（1px の罫線の px 値などは直値可）
- ブランド差し替え対象は `--color-primary` と `--font-display` の 2 つに集約する。セクション側にブランド色を直書きすると差し替え漏れの温床になる
- トークンの追加は「3 箇所以上で使う値」を目安にする。1 箇所でしか使わない値の変数化はノイズ
