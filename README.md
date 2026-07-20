# JUN LP テンプレート

JUN の複数ブランド向け LP を作るためのベーステンプレートです。**静的 HTML + [Vite](https://vitejs.dev/) + vanilla JavaScript + プレーン CSS** で構築されており、[Claude Code](https://docs.claude.com/en/docs/claude-code/overview) のスキルを使って、ブランド差し替えやセクション追加を対話的に進められるよう設計されています。

新規案件は、このテンプレートを複製してブランド情報を差し替えるところから始めます。このドキュメントはその手順書です。

> 設計思想・技術スタック・コーディング規約の詳細は [`CLAUDE.md`](./CLAUDE.md) と [`.claude/rules/`](./.claude/rules/) を参照してください。

---

## 前提

- **Node.js 20.19 以上**（Vite 7 の要件。LTS 版を推奨）
- **[Claude Code](https://docs.claude.com/en/docs/claude-code/overview)**（CLI / デスクトップアプリ / IDE 拡張のいずれか）
- **git** と、テンプレートを置く **GitHub** へのアクセス

> **スキルについて**: `setup-brand`・`add-section` などの制作用スキルは、このリポジトリの [`.claude/skills/`](./.claude/skills/) に同梱されています。複製先でも**追加インストール不要で自動的に使えます**。Claude Code でこのフォルダを開けば、後述のプロンプトを打つだけでスキルが起動します。
>
> `npm install` を実行すると、ファイル編集後に [Prettier](https://prettier.io/) で自動整形する仕組み（`.claude/settings.json` のフック）も有効になります。

---

## クイックスタート（全体像）

1. **複製** — このテンプレートから新しいリポジトリを作り、clone する（[Step 1](#step-1--テンプレートを複製する)）
2. **起動確認** — `npm install` → `npm run dev` でテンプレートが表示されることを確認（[Step 2](#step-2--依存インストールと起動確認)）
3. **ブランド設定** — Claude Code に「◯◯ブランドとしてセットアップして」と依頼し、プレースホルダをブランド実値に差し替える（[Step 3](#step-3--ブランドをセットアップする)）
4. **セクション制作** — 「Hero セクションを追加して」のように依頼して LP を組み立てていく（[Step 4](#step-4--セクションを作っていく)）
5. **公開前チェック** — プレースホルダの残存ゼロ・lint・build を確認（[公開前チェックリスト](#公開前チェックリスト)）

---

## Step 1 — テンプレートを複製する

### 〈テンプレート管理者・初回のみ〉GitHub にテンプレートとして登録する

まだテンプレートが GitHub 上に無い場合、管理者が一度だけ次を行います。

```bash
# リポジトリ直下で実行。<org> は組織/ユーザー名に置き換える
gh repo create <org>/jun-lp-template --private --source=. --push
```

その後、GitHub のリポジトリ **Settings → General → "Template repository"** にチェックを入れると、以降「Use this template」から新規案件を作れるようになります。

### 〈新規案件〉テンプレートから新しいリポジトリを作る

**方法 A（推奨・GitHub テンプレート機能）** — `<brand>` を案件名に置き換えてください。

```bash
# テンプレートから新リポジトリを作成して clone
gh repo create <org>/<brand>-lp --private --template <org>/jun-lp-template
gh repo clone <org>/<brand>-lp
cd <brand>-lp
```

> GitHub の Web UI から作る場合は、テンプレートリポジトリの緑の **「Use this template」→「Create a new repository」** ボタンを使い、できたリポジトリを `git clone` します。

**方法 B（clone して履歴を切る）** — GitHub のテンプレート機能を使わない場合。

```bash
git clone <テンプレートのURL> <brand>-lp
cd <brand>-lp
rm -rf .git && git init                      # 履歴をリセットして新規案件の履歴にする
git add -A && git commit -m "chore: <brand> LP をテンプレートから作成"
git remote add origin <新しいリポジトリのURL>   # 案件用の空リポジトリを事前に作っておく
git push -u origin main
```

> **リネームについて**: フォルダ名は clone 時に決まります。`package.json` の `name`（現在 `jun-lp-template`）は次の **Step 3（setup-brand）** でブランド名に差し替えます。`package-lock.json` の `name` は、その後の `npm install` で自動的に同期されます。

---

## Step 2 — 依存インストールと起動確認

```bash
npm install      # 依存関係をインストール（Prettier 自動整形フックもここで有効化）
npm run dev      # 開発サーバー起動 → http://localhost:5173
```

ブラウザで開くと、フッターに **「BRAND NAME」**、ファビコンに黒地の「LP」など、**プレースホルダのままのテンプレート**が表示されます。これで土台が動いていることを確認できたら、次のブランド設定に進みます。

---

## Step 3 — ブランドをセットアップする

**ここが新規案件で最初にやる本番作業です。** テンプレートに残っているプレースホルダ（GTM ID・フッター・ロゴ・favicon・フォント・カラーなど）を、案件のブランド実値に差し替えます。この作業は Claude Code の **`setup-brand` スキル**が案内します。

### 事前に用意しておくもの

以下が揃っていると一度で完了できます（無いものは Claude が対話で聞いてくれます）。

- **ブランド名**（表示名・コピーライト表記）
- **GTM（Google Tag Manager）ID**（例: `GTM-XXXXXXX`）
- **フッターのリンク**（オンラインストア / スタッフスタイリング / その他コンテンツ 等）
- **SNS の URL**（Instagram / Facebook / X など。使わないものは削除）
- **ロゴ画像**（SVG 推奨）と、**favicon**
- **ブランドカラー**（アクセントカラーの HEX）
- **フォント方針**（Google Fonts / 支給の Web フォント / システムフォント のいずれか）
- **ページの `<title>` / meta description / OGP** の文言と画像

### Claude Code に打つプロンプト（例）

**① 情報をまとめて渡す場合:**

```
このテンプレートを ◯◯（ブランド名）の LP としてセットアップして。
GTM ID は GTM-XXXXXXX、オンラインストアは https://... 、
Instagram は https://... 、ブランドカラーは #xxxxxx、
フォントは △△ を使いたい。ロゴは src/assets/images/ に差し替え済み。
```

**② まず対話で進めたい場合:**

```
setup-brand で新規ブランドのセットアップを始めて。
```

（Claude が必要な情報を順に質問してくれます）

**③ ROPÉ 案件の場合（辞書から一括適用）:**

```
ROPÉ の LP としてセットアップして。
```

（`setup-brand` スキルに ROPÉ の実値が辞書として登録済みなので、まとめて適用されます）

### スキルが行うこと

`setup-brand` は、`index.html` を中心とした **13 項目のプレースホルダ**（GTM ID×2・フッターのロゴ/リンク/SNS・トップの ONLINE STORE リンク・コピーライト・`<title>`/OGP・`package.json` の name・ブランドカラー `--color-primary`・ブランドフォント `--font-display` など）をブランド実値に差し替えます。フォントは **3 パターン**（Google Fonts / 支給 woff2 の `@font-face` / 指定なし）に対応し、本文用の `--font-primary`（和文明朝スタック）は固定のまま変更しません。詳細は [`.claude/skills/setup-brand/SKILL.md`](./.claude/skills/setup-brand/SKILL.md) を参照してください。

### 差し替え漏れの確認

スキルの最後に、次の検証が行われます（手動でも実行できます）。

```bash
# プレースホルダの残存チェック（ヒット 0 件になること）
grep -rn -e "GTM-XXXXXXX" -e "example.com" -e "BRAND NAME" -e "jun-lp-template" index.html package.json src public
# title / description / OGP の記入漏れチェック（ヒット 0 件になること）
grep -n -e 'content=""' -e "LPタイトル" index.html
# ビルド確認
npm run build
```

加えて、**GTM のスクリプトがコメント解除され実 ID になっていること**（テンプレートでは 404 を避けるためコメントアウトされています）を目視で確認します。

---

## Step 4 — セクションを作っていく

ブランド設定が済んだら、LP のセクションを追加していきます。BEM 風命名・デザイントークン・レスポンシブ・lint といった規約は [`.claude/rules/`](./.claude/rules/) と自動整形で強制されるので、**作りたい内容を説明するだけ**で規約に沿ったコードが生成されます。

### セクションを追加する（`add-section` スキル）

```
Hero セクションを追加して。全画面の背景画像に大きな見出しを重ねる構成で。
```

`add-section` が「1 セクション = 1 ルートクラス = 1 CSS ファイル」の規律で、HTML・CSS・（必要なら）JS を追加し、`main.js` への import まで行います。

### よく使う制作スキル（早見表）

いずれも「こう言えば起動する」というトリガーがあります。プロンプト例をそのまま打って構いません。

| やりたいこと                                               | スキル            | プロンプト例                                                         |
| ---------------------------------------------------------- | ----------------- | -------------------------------------------------------------------- |
| 全画面ローディング画面（フォントのちらつき対策・進捗演出） | `lp-preloader`    | `ローディング画面を入れて。フォントのちらつきを隠したい`             |
| 商品写真の下に「商品名 / 価格 / CLICK」のクレジット一覧    | `credit-list`     | `商品写真の下に NAME / PRICE / CLICK のクレジットリストを入れて`     |
| スクロールで出てくる追従 CTA ボタン                        | `floating-cta`    | `スクロールしたら出てくる予約ボタンを付けて。フッターで消えるように` |
| モーダル等の表示中に背景スクロールを止める                 | `scroll-lock`     | `モーダルを開いている間、背景のスクロールを止めたい`                 |
| スクロールでふわっとフェードイン表示                       | `scroll-reveal`   | `セクションが画面に入ったら下からふわっと出るようにして`             |

> **上記以外にも** ヒーロー演出・文字分割・モノクロ→カラー・サウンド・head 設定・ScrollTrigger ズレ診断・納品準備など、計 20 スキルを同梱しています。一覧は [`.claude/skills/`](./.claude/skills/) を参照してください。

> **カルーセルが必要な場合**: Swiper はテンプレートに同梱していません。使う案件でのみ `npm install swiper` を実行してください（詳細は [`.claude/rules/swiper.md`](./.claude/rules/swiper.md)）。

---

## 開発コマンド

```bash
npm install        # 依存関係インストール
npm run dev        # 開発サーバー起動 (localhost:5173)
npm run build      # プロダクションビルド (dist/)
npm run preview    # ビルド結果のプレビュー
npm run lint       # Stylelint + ESLint
npm run format     # Prettier で全ファイル整形
```

---

## 公開前チェックリスト

- [ ] プレースホルダの残存がゼロ（上記 [Step 3 の検証 grep](#差し替え漏れの確認) がヒット 0 件）
- [ ] `<title>` / meta description / OGP がすべて記入済み
- [ ] GTM スクリプトのコメントが解除され、実 ID になっている
- [ ] `npm run lint` がパスする
- [ ] `npm run build` が警告・エラーなしで成功する
- [ ] `npm run dev` でブラウザのコンソールに警告・エラーが出ない
- [ ] OS の「視差効果を減らす（reduced motion）」を有効にしても、コンテンツが隠れず表示される

---

## さらに詳しく

- [`CLAUDE.md`](./CLAUDE.md) — プロジェクト概要・技術スタック・設計原則
- [`.claude/rules/`](./.claude/rules/) — HTML / CSS / JavaScript / レスポンシブ / GSAP / Swiper のコーディング規約
- [`.claude/skills/`](./.claude/skills/) — 各スキルの詳細手順。テンプレート固有の `setup-brand` / `add-section` に加え、汎用スキルライブラリ 18 種（演出・セクション・診断・納品ほか）を同梱
