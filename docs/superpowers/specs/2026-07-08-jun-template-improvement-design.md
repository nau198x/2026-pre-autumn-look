# jun_template 改善設計書

- 日付: 2026-07-08
- ステータス: ユーザー承認済み設計（実装前）
- ベースライン: commit `bd552b6`

## 1. 背景と目的

jun_template は JUN の複数ブランド向け LP 制作のベーステンプレートで、Claude（AI エージェント）駆動での制作を前提に `.claude/rules` と `.claude/skills` を持つ。

2026-07 のレビューで、**ドキュメント層（CLAUDE.md / rules / skills）と実コードの矛盾**が多数見つかった。AI 駆動テンプレートではドキュメントがそのままエージェントの行動規範になるため、矛盾は全案件に混乱として遺伝する。本改善はこの矛盾解消を核心に、潜在バグ修正・ブランド差し替えの仕組み化・開発環境モダン化を行う。

### 発見された主な問題

| #   | 問題                                                                                                                                                                                                                 | 深刻度 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | 規約は CSS Modules、実態は素のグローバル CSS。静的 HTML に CSS Modules は原理的に適用不能で、add-section スキルの手順通りに作るとスタイルが当たらない                                                                | 重大   |
| 2   | rules は `src/js/`、実態と skills は `src/scripts/`                                                                                                                                                                  | 重大   |
| 3   | rules/skills 4 ファイルが `global.css` を前提とするが実ファイルは `main.css`。規約が前提とする `:root` の CSS 変数定義がどこにも存在せず、`main.css` が未定義変数（`--spacing-xs` 等）を参照し該当プロパティが無効化 | 重大   |
| 4   | CLAUDE.md の参照パス `.claude/skills/add-section.md` が実在しない（実際は `add-section/SKILL.md`）                                                                                                                   | 中     |
| 5   | CLAUDE.md は GSAP / Swiper をスタックと明記するが package.json に無い                                                                                                                                                | 中     |
| 6   | ブレークポイントが規約（min-width 768/1024）と異なる max-width 769 混在。769px ちょうどで重複適用                                                                                                                    | 中     |
| 7   | `Marcellus` フォント指定のみで読み込み手段が無く常にフォールバック表示                                                                                                                                               | 中     |
| 8   | `class="lazyload"` 残骸（lazysizes 不使用）、footer `<h3>` 単独で見出し階層破綻、img の width/height 欠落                                                                                                            | 小     |
| 9   | GTM ID `GTM-KRTNBQ5`・junonline.jp の favicon・ROPÉ フッターがハードコード。誤ブランド出荷（別ブランド LP に ROPÉ の GTM が載る等）を防ぐ仕組みが無い                                                                | 中     |
| 10  | git 未初期化、規約を強制するツール無し、package name が前案件の名残 `our_signature_s`                                                                                                                                | 小     |

## 2. 確定済みの意思決定

ユーザーヒヤリングで以下を確定した:

1. **テンプレートの位置づけ**: JUN の複数ブランド向け。ブランド固有部分は差し替えチェックリスト化する
2. **静的 HTML + Vite + vanilla JS を維持**する。CSS Modules・コンポーネントフレームワーク（Astro / Vue / React 等）は現時点では導入しない
3. CSS 方式の矛盾は**規約側をプレーン CSS に合わせて書き直す**ことで解消する
4. **将来的に Vue / React 等のコンポーネントベースへ移行する可能性を視野に入れ**、移行が機械的にできる規律を保つ
5. スコープ: ドキュメント整合性修正・コード潜在バグ修正・ブランド差し替え仕組み化・開発環境モダン化のすべて

## 3. 設計原則（CLAUDE.md に明文化する）

「静的 HTML のまま、将来コンポーネントベースに移行するとき **1 セクション = 1 コンポーネントに機械的に写せる**」状態を保つ:

1. **1 セクション = 1 ルートクラス = 1 CSS ファイル**（＋セクション固有のインタラクションがある場合のみ 1 JS モジュール）。例: `<section class="hero">` ⇔ `src/styles/hero.css` ⇔ `src/scripts/hero.js`
2. **CSS はセクションのルートクラス配下にネイティブネスト**で書き、疑似スコープを確保する。セレクタがルートクラス起点である限り、scoped style / CSS Modules への移植は機械作業になる
3. **JS はセクションごとに `init` 関数を export** し、DOM 参照はセクションルート要素起点で行う（`document` 全体への直接クエリを避ける）
4. **デザイントークンは `global.css` の `:root` の CSS 変数に集約**する
5. **スタイル用セレクタはクラスのみ**。ID はページ内アンカー用途に限定する

## 4. 改善内容

### WS1: ドキュメント整合性修正

| ファイル                                                                 | 修正                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                              | スタイリングを「プレーン CSS（BEM 風命名＋ネイティブネスト）」に訂正。スキル参照を実在パスに修正。ライブラリ導入方針を明記（GSAP: テンプレ同梱 / Swiper: カルーセルを使う案件でのみ `npm i swiper`）。§3 の設計原則を追記。新規案件開始時に `setup-brand` スキルを実行する旨を追記。開発コマンドに lint / format を追加                                                                                                                                                                        |
| `rules/css.md`                                                           | 全面改訂: CSS Modules 前提を廃止。`global.css` = `:root` トークン＋全体共通スタイルのみ、セクションは `src/styles/セクション名.css` に分割。クラス命名は **BEM 風・ケバブケース**（`.section-name` / `.section-name__element` / `--modifier`）に変更（camelCase は CSS Modules 前提だったため廃止）。ルートクラス配下ネスト規律・ID セレクタ禁止（アンカー除く）を追加。globs から `.module.css` を除去                                                                                        |
| `rules/responsive.md`                                                    | globs から `.module.css` を除去。内容（min-width 768/1024・レンジ構文・モバイルファースト）は現状維持                                                                                                                                                                                                                                                                                                                                                                                          |
| `rules/javascript.md`                                                    | セクション JS の規律（init 関数 export・ルート要素起点の DOM 参照）を追記。他は現状維持                                                                                                                                                                                                                                                                                                                                                                                                        |
| `rules/gsap.md`                                                          | `src/js/` → `src/scripts/` に修正。初期非表示 CSS を「`@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`」の複合条件に更新（§WS2 参照）                                                                                                                                                                                                                                                                                                                                 |
| `rules/swiper.md`                                                        | `src/js/slider.js` → `src/scripts/slider.js` に修正。「Swiper はカルーセルを使う案件でのみインストールする」注記を追加                                                                                                                                                                                                                                                                                                                                                                         |
| `skills/add-section/SKILL.md`                                            | **全面書き直し**（現手順は CSS Modules 前提で、手順通りに作るとスタイルが当たらない）。新手順: ① `<section class="section-name">` を BEM 風クラスで index.html に追加 → ② `src/styles/section-name.css` をルートクラス配下ネストで作成し main.js から import → ③ 固有インタラクションがある場合のみ `src/scripts/section-name.js` に init 関数を作成し DOMContentLoaded で初期化 → ④ チェックリスト（表示崩れ / data-animate 動作 / img 属性 / コンソールエラー / 見出し階層 / **lint パス**） |
| その他 skills（preloader / scroll-lock / credit-list / floating-button） | `global.css` 前提は WS2 のリネームで実態側が一致するため大きな変更なし。パス表記・前提条件を最終確認し、齟齬があれば微修正                                                                                                                                                                                                                                                                                                                                                                     |

### WS2: コード潜在バグ修正・スキャフォールド整備

**CSS:**

- `src/styles/main.css` → **`src/styles/global.css` にリネーム**し、冒頭に `:root` トークン定義を新設:

```css
:root {
  /* colors */
  --color-text: #000;
  --color-bg: #fff;
  --color-link: #000;
  --color-primary: #000; /* ブランドアクセント。setup-brand で差し替え対象 */
  --color-rule: #111; /* 濃罫線（枠・グループ境界） */
  --color-rule-light: #aaa; /* 薄罫線（区切り） */

  /* typography（ブランドフォントは setup-brand で差し替え） */
  --font-primary: "游明朝", YuMincho, "Hiragino Mincho ProN", serif;

  /* spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 4rem;

  /* layout */
  --content-width-mobile: 90%;

  /* motion */
  --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
}
```

（既存 CSS が参照する未定義変数、および credit-list 等の skills が前提とする変数をすべて網羅する）

- ブレークポイントを **min-width 768 / 1024・モダンレンジ構文** `@media (width >= 768px)` に統一し、`max-width: 769px` 混在と 769px 重複適用を解消。既存スタイルはモバイルファーストに書き換える
- 既存の `.ec` / footer スタイルを `src/styles/ec.css` / `src/styles/footer.css` に分割し、ルートクラス配下ネスト＋BEM 風命名の**実例**にする。footer の ID セレクタ（`#footer-logo` 等）はクラス（`.footer__logo` 等）に変換する
- `base.css` はリセット＋ベースのまま維持（`font-family` はトークン `var(--font-primary)` 参照に変更）

**フォント:**

- フォントは**ブランド資産**として扱う。font-family 指定を `--font-primary` トークンに一本化し、テンプレのデフォルトは**外部フォント依存のないシステムフォントスタック**（現行の游明朝系）にする
- 現状の `Marcellus`（宣言のみで読み込み手段が無いバグ）は、コードから除去し ROPÉ のブランド辞書（setup-brand）へ退避する。ブランドフォントの導入自体は setup-brand の責務（WS3 参照）

**index.html:**

- `class="lazyload"` 残骸を削除
- footer の `<h3>` → `<p>`（見出し階層破綻の解消。ロゴは見出しではない）
- すべての `<img>` に実寸の `width` / `height` を付与（実装時に SVG の viewBox から取得）
- `target="_blank"` に `rel="noopener"` を明示
- `.ec` セクションに `aria-label` と `data-animate` を付与（アニメーション・スキャフォールドの動作実例を兼ねる）
- footer の HTML を BEM 風クラスに書き換え（`id="footer"` 等は廃止）

**JS スキャフォールド:**

- `gsap` を dependencies に追加（全案件で使う前提のコア。CLAUDE.md のスタック記載と package.json を一致させる）
- `src/scripts/animations.js` を新設: rules/gsap.md の canonical パターン（`gsap.registerPlugin(ScrollTrigger)`・`[data-animate]` の一括フェードイン・`prefers-reduced-motion` ガード・`once: true`）を最初から動く形で実装
- `src/scripts/main.js` に DOMContentLoaded 初期化構造を実装（CSS import → `initScrollAnimations()` 呼び出し）
- 初期非表示 CSS を global.css に追加。**reduced-motion 有効時に要素が opacity: 0 のまま残るバグを防ぐため**、複合条件にする:

```css
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  [data-animate] {
    opacity: 0;
  }
}
```

（JS 無効なら CSS が適用されず表示、reduced-motion なら JS がアニメをスキップしても CSS 側も隠さないので表示される。rules/gsap.md も同じパターンに更新する）

### WS3: ブランド差し替えの仕組み化

**テンプレ本体のプレースホルダ化:**

| 箇所                                                 | 現状                                          | 変更後                                                                                                                                                                |
| ---------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GTM ID（head スクリプト＋noscript iframe の 2 箇所） | `GTM-KRTNBQ5`                                 | `GTM-XXXXXXX` に置換した上で**ブロックごとコメントアウト**（プレースホルダのまま読み込むと 404 でコンソールエラーになるため。setup-brand が実 ID を埋めて有効化する） |
| favicon                                              | `https://www.junonline.jp/favicon.png`        | `public/favicon.svg`（ニュートラルなプレースホルダ SVG を同梱、`<link rel="icon">` に変更）                                                                           |
| footer のロゴ・リンク・SNS・copyright                | ROPÉ 実値                                     | 構造は維持し、URL を `https://example.com/`、テキストを `BRAND NAME` 等のプレースホルダに                                                                             |
| `package.json` name                                  | `our_signature_s`                             | `jun-lp-template`                                                                                                                                                     |
| フォント                                             | `Marcellus`（読み込み手段なしのハードコード） | `--font-primary` トークン＋システムフォントスタックのデフォルト。ブランドフォントは setup-brand が導入する                                                            |
| OGP / title                                          | 空文字 / `LPタイトル`                         | 現状維持（案件ごとの必須記入項目として setup-brand チェックリストに含める）                                                                                           |

狙い: **誤ブランド出荷の構造的防止**。GTM の書き忘れはすぐ気づくが、別ブランドの GTM が載ったまま公開されると気づけず分析データを汚染する。デフォルトを「壊れているが安全」に倒す。

**新スキル `.claude/skills/setup-brand/SKILL.md`:**

- 新規案件の初回に実行する対話式セットアップ手順
- **差し替え箇所の完全リスト**をチェックリストとして保持: GTM ID ×2 / favicon / footer ロゴ（href・img・alt）/ footer リンク ×3 / SNS リンク ×3 / copyright / `<title>`・meta description・OGP 一式 / package.json name / ロゴ画像アセット（`logo.svg`・`rope_white_logo.svg` の差し替え）/ `--color-primary` トークン / **ブランドフォント**（`--font-primary` トークン＋読み込み手段）
- **フォント導入は 3 パターンをサポート**: ① Google Fonts 系 → `@fontsource/フォント名` を npm install し main.js で import、② ライセンスフォント → woff2 を `src/assets/fonts/` に置き `@font-face` を global.css に追記、③ システムフォントのみ → トークン値の変更だけ。いずれも `font-display: swap` と日本語フォールバックスタックの維持を必須とする
- **ブランド辞書**を保持: ROPÉ の実値（GTM `GTM-KRTNBQ5`、junonline.jp リンク群、SNS URL、copyright、フォント: Marcellus = `@fontsource/marcellus` ＋游明朝フォールバック）を辞書として退避。ROPÉ 案件なら辞書から一括適用、他ブランドは AskUserQuestion でヒヤリングして埋める。ブランドが増えたら辞書に追記する
- 最終検証ステップ: `GTM-XXXXXXX` や `example.com` 等のプレースホルダが残っていないか grep で確認

### WS4: 開発環境モダン化

- **Prettier**（デフォルト設定）— HTML / CSS / JS / JSON / MD の整形
- **Stylelint**（`stylelint-config-standard` ベース）— css.md 規約の自動強制:
  - `media-feature-range-notation: "context"`（レンジ構文の強制）
  - `declaration-property-unit-allowed-list` で `font-size` / `margin` / `padding` / `gap` に `rem`（＋`%` / `auto`）を強制。`border` 等の 1px 罫線は対象外
- **ESLint**（flat config、`@eslint/js` recommended ＋ browser globals）— `no-var` / `prefer-const` / `prefer-template` / `prefer-arrow-callback` 等、rules/javascript.md との整合
- npm scripts: `format`（prettier --write .）/ `lint`（lint:css ＋ lint:js）/ `lint:css` / `lint:js`
- `.claude/settings.json` に **PostToolUse フック**を追加: Edit / Write 後に編集ファイルを Prettier で自動整形（AI 駆動運用での規約逸脱を構造的に防ぐ）
- git 初期化＋ベースラインコミット（実施済み: `bd552b6`）。改善作業は意味単位でコミットする

## 5. 最終ファイル構成

```
jun_template/
├── CLAUDE.md                    (改訂)
├── index.html                   (修正: プレースホルダ化・a11y・スキャフォールド)
├── package.json                 (name 変更・scripts / deps 追加)
├── vite.config.js               (現状維持: base "./")
├── eslint.config.js             (新規)
├── .prettierrc                  (新規)
├── .stylelintrc.json            (新規)
├── public/
│   └── favicon.svg              (新規: プレースホルダ)
├── docs/superpowers/specs/      (本設計書)
├── .claude/
│   ├── settings.json            (フック追加)
│   ├── rules/                   (css / responsive / javascript / gsap / swiper 改訂)
│   └── skills/
│       ├── add-section/         (全面書き直し)
│       ├── setup-brand/         (新規)
│       └── credit-list / floating-button / preloader / scroll-lock (整合確認・微修正)
└── src/
    ├── assets/images/           (現状維持。ロゴ類は setup-brand の差し替え対象として文書化)
    ├── scripts/
    │   ├── main.js              (エントリ: import 集約＋DOMContentLoaded 初期化)
    │   └── animations.js        (新規: data-animate スキャフォールド)
    └── styles/
        ├── base.css             (リセット＋ベース)
        ├── global.css           (main.css をリネーム: :root トークン＋共通)
        ├── ec.css               (新規: 分割)
        └── footer.css           (新規: 分割)
```

## 6. スコープ外（YAGNI）

画像最適化パイプライン、SSG / コンポーネントフレームワーク移行、フォーム・サンクスページ、CI 設定、`.vscode` 推奨拡張。必要になった案件で個別対応する。

## 7. 検証基準（実装完了の定義）

1. `npm run build` が警告・エラーなしで成功する
2. `npm run lint` がパスする
3. dev サーバーでコンソールエラー・警告ゼロ。`.ec` の data-animate フェードインが動作する
4. `prefers-reduced-motion: reduce` 環境でコンテンツが隠れない（opacity: 0 のまま残らない）
5. 矛盾の残存ゼロを grep で確認: `src/js/`・`.module.css`・`main.css` への参照が本設計書以外に存在しない。`GTM-KRTNBQ5`・`Marcellus` は本設計書と setup-brand のブランド辞書（ROPÉ 実値）以外に存在しない
6. **add-section スキルのドライラン**: 書き直した手順に従って仮セクションを 1 つ追加し、スタイル適用・アニメーション・lint がすべて通ることを確認してから仮セクションを破棄する
7. setup-brand スキルのチェックリストがプレースホルダ箇所を 100% カバーしている（grep で突合）

## 8. 実装順序（writing-plans への入力)

1. **WS2**（コードを正にする）→ 2. **WS1**（正になったコードに合わせてドキュメントを書き直す）→ 3. **WS3**（プレースホルダ化＋setup-brand）→ 4. **WS4**（ツール導入・全体フォーマット・フック）→ 5. 検証基準の消化（add-section ドライラン含む）

順序の理由: コードが先に確定するとドキュメントが書きやすく、ツール導入を最後にすると一括フォーマットが 1 コミットに収まる。
