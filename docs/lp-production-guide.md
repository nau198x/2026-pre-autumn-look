# LP 制作運用ガイド — テンプレート化から納品まで

このドキュメントは、**本リポジトリ（jun-lp-template）をテンプレートとして運用し、実際の LP 案件を立ち上げ、制作し、納品するまでの全工程**をまとめた資料です。

- **対象読者**: 新規 LP 案件を担当する制作者、およびテンプレートを管理する担当者
- **[`README.md`](../README.md) との関係**: README は立ち上げ手順のクイックガイド、本書はテンプレート登録から納品までを通した運用資料です。日々の作業では README を、全体像の把握・納品・運用ルールの確認には本書を参照してください

## 全体フロー

| フェーズ                                                    | やること                                             | 実施者・頻度                 |
| ----------------------------------------------------------- | ---------------------------------------------------- | ---------------------------- |
| [0. テンプレート登録](#フェーズ-0-テンプレート登録初回のみ) | GitHub にテンプレートリポジトリとして登録            | 管理者・**初回のみ**         |
| [1. 案件リポジトリの複製](#フェーズ-1-案件リポジトリの複製) | テンプレートから案件用リポジトリを作成・clone        | 案件ごと                     |
| [2. 環境構築](#フェーズ-2-環境構築と起動確認)               | `npm install` → `npm run dev` で起動確認             | 案件ごと                     |
| [3. ブランド設定](#フェーズ-3-ブランド設定setup-brand)      | `setup-brand` スキルでプレースホルダを実値に差し替え | 案件ごと・**最初の本番作業** |
| [4. セクション制作](#フェーズ-4-セクション制作)             | スキルを使って LP を組み立てる                       | 案件ごと・反復               |
| [5. 公開前チェック](#フェーズ-5-公開前チェック)             | プレースホルダ残存ゼロ・lint・build・console 確認    | 公開前                       |
| [6. 納品](#フェーズ-6-納品lp-delivery)                      | `lp-delivery` スキルでパッケージング・検品           | 納品時                       |

## 前提環境

- **Node.js 20.19 以上、または 22.12 以上**（Vite 7 の要件。LTS 版を推奨。21.x / 22.11 以前はサポート外）
- **[Claude Code](https://docs.claude.com/en/docs/claude-code/overview)**（CLI / デスクトップアプリ / IDE 拡張のいずれか）
- **git** と、テンプレートを置く **GitHub** へのアクセス（本書のコマンド例は [`gh` CLI](https://cli.github.com/) を使用。初回は `gh auth login` で認証する。Web UI でも代替可能）

制作用スキル（`setup-brand`・`add-section` ほか計 20 種）はリポジトリの [`.claude/skills/`](../.claude/skills/) に同梱されており、**複製先でも追加インストール不要**で使えます。Claude Code でプロジェクトフォルダを開き、後述のプロンプトを打つだけでスキルが起動します。

---

## フェーズ 0: テンプレート登録（初回のみ）

テンプレート管理者が一度だけ行う作業です。すでに GitHub 上にテンプレートリポジトリがある場合はスキップしてください。

1. リポジトリを GitHub に push する

   ```bash
   # リポジトリ直下で実行。<org> は組織/ユーザー名に置き換える
   gh repo create <org>/jun-lp-template --private --source=. --push
   ```

2. GitHub のリポジトリ **Settings → General → "Template repository"** にチェックを入れる

これで以降、「Use this template」ボタン（または `gh repo create --template`）から履歴を引き継がない新規案件リポジトリを作れるようになります。

### テンプレート自体を改良したとき

テンプレートへの修正（規約の更新・スキルの追加・不具合修正）は `jun-lp-template` リポジトリに直接コミットします。**複製済みの案件リポジトリには自動反映されない**ため、進行中の案件に取り込みたい変更がある場合は手動で移植してください（該当ファイルをコピーするか、案件リポジトリにテンプレートを remote として追加し該当コミットを `git cherry-pick` する）。

---

## フェーズ 1: 案件リポジトリの複製

案件ごとに、テンプレートから独立したリポジトリを作ります。`<brand>` は案件名に置き換えてください。

**方法 A（推奨・GitHub テンプレート機能）**

```bash
gh repo create <org>/<brand>-lp --private --template <org>/jun-lp-template
gh repo clone <org>/<brand>-lp
cd <brand>-lp
```

Web UI の場合は、テンプレートリポジトリの **「Use this template」→「Create a new repository」** から作成し、できたリポジトリを `git clone` します。

**方法 B（clone して履歴を切る）** — テンプレート機能を使わない場合。

```bash
git clone <テンプレートのURL> <brand>-lp
cd <brand>-lp
rm -rf .git && git init
git add -A && git commit -m "chore: <brand> LP をテンプレートから作成"
git remote add origin <新しいリポジトリのURL>   # 案件用の空リポジトリを事前に作っておく
git push -u origin main
```

> **リネームについて**: フォルダ名は clone 時に決まります。`package.json` の `name`（テンプレートでは `jun-lp-template`）はフェーズ 3 の setup-brand でブランド名に差し替えます。`package-lock.json` の `name` は、差し替え後にもう一度 `npm install` を実行すると自動同期されます（フェーズ 3 の検証で確認します）。

---

## フェーズ 2: 環境構築と起動確認

```bash
npm install      # 依存関係をインストール（Prettier 自動整形フックもここで有効化）
npm run dev      # 開発サーバー起動 → http://localhost:5173
```

ブラウザで開くと、フッターに「BRAND NAME」、ファビコンに黒地の「LP」など、**プレースホルダのままのテンプレート**が表示されます。土台が動くことを確認したら次へ進みます。

> `npm install` により、Claude Code でのファイル編集後に Prettier が自動整形するフック（[`.claude/settings.json`](../.claude/settings.json)）が機能するようになります。

---

## フェーズ 3: ブランド設定（setup-brand）

**新規案件で最初にやる本番作業です。** テンプレートに残るプレースホルダ（GTM ID・favicon・フッター・ロゴ・フォント・ブランドカラーなど **13 項目**）を、Claude Code の **`setup-brand` スキル**で案件の実値に差し替えます。

### 事前に揃えるもの

以下が揃っていると一度で完了できます（この一式で差し替え 13 項目を賄えます。不足分は Claude が対話でヒヤリングします）。

- ブランド名（表示名・コピーライト表記）
- GTM（Google Tag Manager）ID
- フッターのリンク（オンラインストア / スタッフスタイリング / その他）
- SNS の URL（Instagram / Facebook / X など。使わないものは削除）
- ロゴ画像（SVG 推奨）と favicon
- ブランドカラー（アクセントカラーの HEX）
- フォント方針（Google Fonts / 支給の Web フォント / 指定なし）
- `<title>` / meta description / OGP の文言と画像

### プロンプト例

```
このテンプレートを ◯◯（ブランド名）の LP としてセットアップして。
GTM ID は GTM-XXXXXXX、オンラインストアは https://... 、ブランドカラーは #xxxxxx。
```

対話で進めたい場合は `setup-brand で新規ブランドのセットアップを始めて。` だけでも起動します。

**ROPÉ 案件**は実値がブランド辞書（[`setup-brand/SKILL.md`](../.claude/skills/setup-brand/SKILL.md) 内に記載）に登録済みのため、`ROPÉ の LP としてセットアップして。` の一言でブランド共通の値（GTM ID・ロゴ・フッター・SNS・フォント・カラー等）が一括適用されます。ただし `<title>` / meta description / OGP 文言など**案件ごとに変わる値は辞書に含まれない**ため、別途指定してください。

新しいブランドをセットアップすると、その値は**手元の案件リポジトリ内**の辞書に追記されます。次の案件（テンプレートからの新しい複製）でも再利用するには、追記分をテンプレート側の `setup-brand/SKILL.md` に移植してコミットしてください。

### 完了時の検証（残存チェック）

スキルの最後に次の検証が行われます（手動でも実行可能）。

```bash
# プレースホルダの残存チェック（ヒット 0 件になること）
grep -rn -e "GTM-XXXXXXX" -e "example.com" -e "BRAND NAME" -e "jun-lp-template" index.html package.json src public
# title / description / OGP の記入漏れチェック（ヒット 0 件になること）
grep -n -e 'content=""' -e "LPタイトル" index.html
# ビルド確認
npm run build
```

あわせて次の 2 点も確認します。

- **GTM スクリプトがコメント解除され実 ID になっている**こと（テンプレートでは 404 を避けるためコメントアウトされています）
- **`npm install` をもう一度実行**し、`package.json` の `name` 差し替えが `package-lock.json` に同期されたこと（上記 grep は `package-lock.json` を対象にしないため、実行しないと旧名が残ります）

差し替え 13 項目の詳細は [`setup-brand/SKILL.md`](../.claude/skills/setup-brand/SKILL.md) を参照してください。

---

## フェーズ 4: セクション制作

ブランド設定が済んだら LP を組み立てます。BEM 風命名・デザイントークン・レスポンシブなどの規約は [`.claude/rules/`](../.claude/rules/) と自動整形で強制されるため、**作りたい内容を Claude Code に説明するだけ**で規約に沿ったコードが生成されます。

### 基本の流れ

1. **セクション追加は `add-section` スキル** — 「1 セクション = 1 ルートクラス = 1 CSS ファイル」の規律で HTML・CSS・（必要なら）JS を追加し、`main.js` への import まで行います

   ```
   Hero セクションを追加して。全画面の背景画像に大きな見出しを重ねる構成で。
   ```

2. **演出・部品は同梱スキルに任せる** — 依頼内容に合致するスキルがあれば、Claude が該当 SKILL.md を開いてから実装します（下記カタログ参照）
3. **随時確認** — セクション追加のたびにモバイル / タブレット / デスクトップ表示・console・`npm run lint` を確認します

### 同梱スキルカタログ（20 種）

| 分類                 | スキル                    | 用途                                                                |
| -------------------- | ------------------------- | ------------------------------------------------------------------- |
| テンプレート固有     | `setup-brand`             | 初回ブランドセットアップ（フェーズ 3）                              |
|                      | `add-section`             | セクション追加の標準手順                                            |
| 基盤・head           | `lp-design-tokens`        | デザイントークン・ブレークポイント・タイポグラフィの標準辞書        |
|                      | `lp-head-setup`           | `<head>` 一式（title / OGP / favicon / GTM）の生成・検品            |
|                      | `lp-utils`                | iOS の 100vh 対策・スクロール位置復元対策・スムースアンカー         |
| 入り口の演出         | `lp-preloader`            | 全画面プリローダー 4 変種（ロゴ塗り上がり / % 表示 ほか）           |
|                      | `lp-hero`                 | ヒーローの入場演出・Ken Burns・パララックス                         |
|                      | `swiper-hero-carousel`    | Swiper による fade + autoplay カルーセル（要 `npm install swiper`） |
|                      | `sound-bgm-modal`         | BGM 付き LP のサウンド ON/OFF モーダルと音声ライフサイクル管理      |
| スクロール・文字演出 | `scroll-reveal`           | `data-animate` によるスクロール連動フェードイン                     |
|                      | `split-text-animation`    | 見出しの 1 文字ずつリビール演出 4 種                                |
|                      | `grayscale-color-reveal`  | モノクロ → カラーの 2 段階画像リビール                              |
|                      | `floating-cta`            | スクロール連動のフローティング CTA ボタン                           |
|                      | `scroll-lock`             | モーダル・プリローダー表示中の背面スクロール停止                    |
|                      | `scrolltrigger-drift-fix` | ScrollTrigger の発火位置ズレの診断・修正                            |
| コンテンツ           | `lp-section-layouts`      | 写真ブロック（look）のレイアウト体系 3 方式                         |
|                      | `editorial-sections`      | lead / note / スタッフクレジット / フッター等の定番セクション 7 種  |
|                      | `credit-list`             | 罫線＋「NAME / PRICE / CLICK」のクレジットリスト                    |
|                      | `content-brief-parser`    | 支給ブリーフ（クレジット表・画像構成表）の正規化と LP への反映      |
| 納品                 | `lp-delivery`             | 納品パッケージの作成・検品（フェーズ 6）                            |

> **Swiper について**: バンドルサイズ配慮のためテンプレートには同梱していません。カルーセルを使う案件でのみ `npm install swiper` してください（[`.claude/rules/swiper.md`](../.claude/rules/swiper.md)）。

### 開発コマンド

```bash
npm run dev        # 開発サーバー起動 (localhost:5173)
npm run build      # プロダクションビルド (dist/)
npm run preview    # ビルド結果のプレビュー
npm run lint       # Stylelint + ESLint
npm run format     # Prettier で全ファイル整形
```

---

## フェーズ 5: 公開前チェック

公開・納品の前に、以下をすべて満たしていることを確認します。

- [ ] プレースホルダの残存がゼロ（[フェーズ 3 の検証 grep](#完了時の検証残存チェック) がヒット 0 件）
- [ ] `<title>` / meta description / OGP がすべて記入済み
- [ ] GTM スクリプトのコメントが解除され、実 ID になっている（可能なら GTM のプレビューモードでタグの発火まで確認する）
- [ ] `npm run lint` がパスする
- [ ] `npm run build` が警告・エラーなしで成功する
- [ ] `npm run dev` でブラウザのコンソールに警告・エラーが出ない
- [ ] OS の「視差効果を減らす（reduced motion）」を有効にしても、コンテンツが隠れず表示される
- [ ] 画像が圧縮済み（WebP 優先）で、`loading` / `width` / `height` / `alt` が設定されている

head 周りの詳細検品は `lp-head-setup` スキルの検品手順も利用できます。

---

## フェーズ 6: 納品（lp-delivery）

Claude Code に「納品準備して」と依頼すると **`lp-delivery` スキル**が起動し、チェック → パッケージング → 検品を固定順序で行います。要点は次のとおりです。

- 本テンプレート由来の案件は **ビルドあり納品**: `rm -rf dist` で古い成果物を消してから `npm run build` し直し、**`dist/` の中身（ランタイム資産）だけ**を zip にして渡します（古い `dist/` の流用・ソースファイルの同梱は禁止）
- **開発ファイルの混入ゼロを検品**: zip の内容一覧に `node_modules` / `.git` / `.claude` / `CLAUDE.md` / `README.md` / **`docs/`（本書を含む）** / ソースマップ（`*.map`）/ `.DS_Store` が入っていないことを機械的に確認します
- **サブディレクトリ配置に対応**: [`vite.config.js`](../vite.config.js) の `base: "./"` により相対パス出力になっています。納品前に設定が変わっていないか確認してください
- **再納品は上書きしない**: 納品物の複製を `<プロジェクト名>_MMDD`（日付入り）の名前で残して zip 化し、どの版を渡したかを追跡できるようにします
- 引き渡し時は、配置先パスの想定・zip の展開方法・更新差分の有無を添えます

詳細な手順・検品チェックリストは [`lp-delivery/SKILL.md`](../.claude/skills/lp-delivery/SKILL.md) を参照してください。

---

## 運用ルールまとめ

- **テンプレートを直接案件化しない** — 必ずフェーズ 1 で複製してから着手する。テンプレート本体には改良のみをコミットする
- **着手順を守る** — 複製 → 起動確認 → setup-brand → セクション制作。ブランド設定前にセクションを作り始めない
- **スキルファースト** — 依頼内容に合うスキルがあれば必ず該当 SKILL.md を開いてから実装する（Claude Code が自動で行います）
- **規約はリポジトリが持つ** — コーディング規約は [`CLAUDE.md`](../CLAUDE.md) と [`.claude/rules/`](../.claude/rules/) に集約されており、複製先にもそのまま引き継がれる

## 関連資料

- [`README.md`](../README.md) — 立ち上げ手順のクイックガイド
- [`CLAUDE.md`](../CLAUDE.md) — プロジェクト概要・技術スタック・設計原則
- [`.claude/rules/`](../.claude/rules/) — HTML / CSS / JavaScript / レスポンシブ / GSAP / Swiper のコーディング規約
- [`.claude/skills/`](../.claude/skills/) — 全 20 スキルの詳細手順
