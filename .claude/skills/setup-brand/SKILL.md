---
name: setup-brand
description: 新規LP案件の初回セットアップ。テンプレートのプレースホルダ（GTM ID・favicon・フッター・ロゴ・フォント・ブランドカラー等）をブランド実値に差し替える。ユーザーが「新しい案件を始める」「◯◯ブランドのLPを作る」「ブランドをセットアップして」等と言ったとき、または複製直後のテンプレートで作業を始める文脈で必ず使用する。
user_invocable: true
---

# ブランドセットアップ

新規案件の最初に 1 回実行し、テンプレートのプレースホルダをブランド実値に差し替える。

## 手順

### 1. ブランドの確認

AskUserQuestion でブランド名を確認する。下の**ブランド辞書**にあるブランドなら辞書値を一括適用し、無いブランドは各チェックリスト項目をヒヤリングして埋める（完了後、新ブランドの値をこのファイルの辞書に追記すること）。

### 2. 差し替えチェックリスト

上から順にすべて消化する。

| #   | 項目                                      | 場所                                                                  | テンプレートのプレースホルダ                                                                                               |
| --- | ----------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | GTM ID（2 箇所）＋コメント解除            | `index.html` head 内 / body 冒頭                                      | `GTM-XXXXXXX`（コメントアウト状態）                                                                                        |
| 2   | favicon                                   | `public/favicon.svg`                                                  | プレースホルダ SVG（ブランドの favicon で上書き。PNG の場合は `index.html` の `<link rel="icon">` の href と type も変更） |
| 3   | フッターのロゴリンク先                    | `index.html` `.footer__logo` の `a[href]`                             | `https://example.com/`                                                                                                     |
| 4   | フッターのロゴ画像と alt                  | `src/assets/images/logo.svg` / `alt="BRAND NAME"`                     | ROPÉ のロゴが仮置き                                                                                                        |
| 5   | フッターのリンク 3 本（テキストと href）  | `index.html` `.footer__links`                                         | `https://example.com/`                                                                                                     |
| 6   | SNS リンク 3 本                           | `index.html` `.footer__sns-icons`                                     | `https://example.com/`（使わない SNS は `<a>` ごと削除）                                                                   |
| 7   | コピーライト                              | `index.html` `.footer__copyright`                                     | `BRAND NAME`                                                                                                               |
| 8   | `<title>` / `meta description` / OGP 一式 | `index.html` head                                                     | 空文字・`LPタイトル`                                                                                                       |
| 9   | package.json の name                      | `package.json`                                                        | `jun-lp-template`                                                                                                          |
| 10  | ブランドカラー                            | `src/styles/global.css` `--color-primary`                             | `#000`                                                                                                                     |
| 11  | ブランドフォント                          | `src/styles/global.css` `--font-display` ＋読み込み手段（下記）       | システムフォントスタック                                                                                                   |
| 12  | プリローダー用白ロゴ                      | `src/assets/images/rope_white_logo.svg`（preloader スキル使用時のみ） | ROPÉ の白ロゴが仮置き                                                                                                      |
| 13  | トップの ONLINE STORE リンク              | `index.html` `.ec` セクションの `.ec__link` の `href`                 | `https://example.com/`                                                                                                     |

### 3. ブランドフォントの導入（3 パターン）

ブランドフォント（見出し・数字用の欧文ディスプレイ）は **`--font-display` トークン**に入れる。本文用の `--font-primary`（和文明朝スタック）は原則そのまま。ただし本文の欧文もブランド書体で揃える方針のブランド（ROPÉ 等）は `--font-primary` の先頭にも同じ欧文書体を追加する（各ブランドの辞書に従う）。いずれの場合も `font-display: swap` 相当の挙動（CSS の `@font-face` ディスクリプタ。トークン名 `--font-display` とは別物）と、日本語フォールバックスタック（游明朝系等）の維持を必須とする。

1. **Google Fonts にあるフォント**: `npm install @fontsource/フォント名` → `main.js` の先頭で `import "@fontsource/フォント名";` → `--font-display` の先頭にフォント名を追加
2. **ライセンスフォント（支給 woff2）**: `src/assets/fonts/` に配置 → `global.css` に `@font-face`（`font-display: swap` を指定）→ `--font-display` を更新
3. **ブランドフォント指定なし**: トークンは既定のまま使う（見出しも明朝スタックで組む）

### 4. 検証

```bash
# プレースホルダの残存チェック（ヒット 0 件になること）
grep -rn -e "GTM-XXXXXXX" -e "example.com" -e "BRAND NAME" -e "jun-lp-template" index.html package.json src public
# title / description / OGP の記入漏れチェック（ヒット 0 件になること）
grep -n -e 'content=""' -e "LPタイトル" index.html
# ビルド確認
npm run build
```

- GTM のコメントが解除され、実 ID になっていることを目視確認する
- `npm run dev` でコンソールにエラー・警告が無いことを確認する

## ブランド辞書

### ROPÉ

- GTM ID: `GTM-KRTNBQ5`
- favicon: `https://www.junonline.jp/common/img/apple-touch-icon.png`（PNG・180x180。取得して `public/favicon.png` に置き、`<link rel="icon" href="/favicon.png" type="image/png" />` に変更。※旧 `favicon.png` 直下パスは 404）
- ロゴリンク先: `https://www.rope-jp.com`
- ロゴ画像: テンプレ同梱の `src/assets/images/logo.svg` / `rope_white_logo.svg` が ROPÉ 実物（差し替え不要）。alt は `ROPÉ`
- フッターリンク: ONLINE STORE `https://www.junonline.jp/rope/` / STAFF STYLING `https://www.junonline.jp/rope/styling/` / OTHER CONTENTS `https://www.junonline.jp/news?rope`
- トップ ONLINE STORE リンク（`.ec__link`）: `https://www.junonline.jp/rope/`（フッターの ONLINE STORE と同じ）
- SNS: Instagram `https://www.instagram.com/rope_jp/` / Facebook `https://www.facebook.com/rope1968` / X `https://twitter.com/ROPE_JP`
- コピーライト: `© JUN CO.,LTD. ALL RIGHTS RESERVED.`
- ブランドフォント: Marcellus（パターン1: `npm install @fontsource/marcellus`）→ `--font-display` と `--font-primary` の**両方**の先頭に `"Marcellus"` を追加（例: `"Marcellus", "游明朝", "YuMincho", "Hiragino Mincho ProN", serif`）。※ROPÉ は本文の欧文も Marcellus で揃える方針（テンプレ既定「本文は明朝固定」からの例外）
- ブランドカラー `--color-primary`: `#000`
