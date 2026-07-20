# jun_template 改善 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ドキュメント層（CLAUDE.md / rules / skills）と実コードの矛盾を解消し、潜在バグを修正、ブランド差し替えを仕組み化、開発環境をモダン化する。

**Architecture:** 静的 HTML + Vite + vanilla JS + プレーン CSS（BEM 風命名＋ネイティブネスト）を維持。「1 セクション = 1 ルートクラス = 1 CSS ファイル」の規律で将来の Vue/React 移行に備える。ブランド固有値はプレースホルダ化し、`setup-brand` スキル（ブランド辞書つき）で差し替える。

**Tech Stack:** Vite 7 / GSAP (ScrollTrigger) / Prettier / Stylelint (stylelint-config-standard) / ESLint (flat config)

**Spec:** `docs/superpowers/specs/2026-07-08-jun-template-improvement-design.md`

**前提知識:**

- 作業ディレクトリ: `/Users/minai/Dev/ClientWork/Jun/jun_template`（git 初期化済み、baseline commit `bd552b6`）
- `node_modules` インストール済み（vite のみ）。GSAP・lint ツールは本計画内でインストールする
- このプロジェクトに JS テストフレームワークは無い。各タスクの検証は `npm run build` / `npm run lint` / grep / 目視で行う
- コミットメッセージ末尾には `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` を付ける

---

## Task 1: CSS 基盤（global.css 新設・base.css 改修）

**Files:**

- Delete: `src/styles/main.css`（global.css に置き換え）
- Create: `src/styles/global.css`
- Modify: `src/styles/base.css`（全置換）
- Modify: `src/scripts/main.js`（全置換）

- [ ] **Step 1: `src/styles/global.css` を新規作成**（デザイントークンのみ。旧 main.css の .ec / footer スタイルは Task 2 で分割ファイルへ移す）

```css
/* ----------------------------------------------------------------
 Design tokens
----------------------------------------------------------------- */
:root {
  /* colors */
  --color-text: #000;
  --color-bg: #fff;
  --color-link: #000;
  --color-primary: #000; /* ブランドアクセント。setup-brand で差し替え */
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

- [ ] **Step 2: `src/styles/base.css` を以下の内容に全置換**

変更点: `font-family` をトークン参照に / `font-size: 16px` を削除（ユーザーのフォントサイズ設定を尊重。既定値は同じ 16px）/ 旧 `@media (min-width: 769px)` の無意味な a:hover ブロックと React 残骸コメント・重複 img 定義を削除 / 色をトークン参照に。

```css
/* ----------------------------------------------------------------
 Reset
----------------------------------------------------------------- */
*,
*::before,
*::after {
  box-sizing: border-box;
}

* {
  margin: 0;
  padding: 0;
}

body {
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

img,
picture,
video,
canvas,
svg {
  display: block;
  max-width: 100%;
}

img {
  height: auto;
}

input,
button,
textarea,
select {
  font: inherit;
}

p,
h1,
h2,
h3,
h4,
h5,
h6 {
  overflow-wrap: break-word;
}

li {
  list-style: none;
}

a {
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

/* ----------------------------------------------------------------
 Base
----------------------------------------------------------------- */
html,
body {
  font-family: var(--font-primary);
  background: var(--color-bg);
}

a:link,
a:visited {
  color: var(--color-link);
}
```

- [ ] **Step 3: `src/styles/main.css` を削除し、`src/scripts/main.js` を以下に全置換**

```js
import "../styles/base.css";
import "../styles/global.css";
```

```bash
git rm src/styles/main.css
```

- [ ] **Step 4: ビルドで検証**

Run: `npm run build`
Expected: `✓ built in ...` で成功。エラー・警告なし

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "refactor: main.css を global.css に置換しデザイントークンを新設

未定義のまま参照されていた CSS 変数（--spacing-* 等）を :root で定義。
フォントは --font-primary トークンに一本化（ブランド差し替え対象）。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: セクション CSS 分割 + index.html 最終形 + favicon

**Files:**

- Create: `src/styles/ec.css`
- Create: `src/styles/footer.css`
- Create: `public/favicon.svg`
- Modify: `index.html`（全置換）
- Modify: `src/scripts/main.js`（import 追加）

- [ ] **Step 1: `src/styles/ec.css` を新規作成**（旧 main.css の .ec ブロックをモバイルファースト＋BEM＋ルートクラス配下ネストに書き換えたもの。px は rem に等価変換済み: 90px=5.625rem, 20px=1.25rem, 160px=10rem, 60px=3.75rem, 70px=4.375rem, 480px=30rem）

```css
/* ----------------------------------------------------------------
 EC store link
----------------------------------------------------------------- */
.ec {
  display: flex;
  justify-content: center;
  width: var(--content-width-mobile);
  margin: 5.625rem auto 1.25rem;

  @media (width >= 768px) {
    width: 100%;
    margin: 10rem auto;
  }

  .ec__link {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80%;
    min-height: 3.75rem;
    padding: 0 var(--spacing-sm);
    border: 1px solid var(--color-rule);
    font-size: 0.9rem;
    font-style: italic;
    letter-spacing: 0.15rem;
    text-align: center;
    color: var(--color-link);
    background-color: var(--color-bg);
    transition:
      color 0.2s var(--ease-out),
      background-color 0.2s var(--ease-out);

    @media (width >= 768px) {
      width: auto;
      min-width: 30rem;
      min-height: 4.375rem;
    }

    &:hover {
      color: var(--color-bg);
      background-color: var(--color-text);
    }
  }
}
```

- [ ] **Step 2: `src/styles/footer.css` を新規作成**（旧 main.css の footer ブロックを ID セレクタ → BEM クラスに変換、モバイルファースト化。旧 SNS アイコンの `margin: 0 15px` ＋ `gap: 10px` は `gap: 2.5rem` に集約し nth-of-type ハックを廃止。64px=4rem, 90px=5.625rem, 40px=2.5rem, 25px=1.5625rem, 33px=2.0625rem, 20px=1.25rem）

```css
/* ----------------------------------------------------------------
 Footer
----------------------------------------------------------------- */
.footer {
  width: 100%;
  margin: var(--spacing-lg) auto;
  text-align: center;

  @media (width >= 768px) {
    margin: 5.625rem auto;
  }

  a:hover img {
    opacity: 0.5;
  }

  .footer__logo {
    margin: 0 auto 5.625rem;

    p {
      width: 5.625rem;
      margin: 0 auto;
    }
  }

  .footer__links {
    margin: 0 auto 5.625rem;
    font-size: 0.8rem;
    letter-spacing: 0.1rem;

    a {
      display: block;
      margin: 0 auto 1.25rem;

      @media (width >= 768px) {
        display: inline;
        margin: 0;
      }
    }

    span {
      display: none;

      @media (width >= 768px) {
        display: inline;
        margin: 0 1.5625rem;
        color: var(--color-rule-light);
      }
    }
  }

  .footer__sns {
    margin: 0 auto 5.625rem;

    .footer__sns-title {
      margin: 0 auto 2.5rem;
      font-size: 1rem;
      letter-spacing: 0.1rem;
    }

    .footer__sns-icons {
      display: flex;
      justify-content: center;
      gap: 2.5rem;

      img {
        width: 2.0625rem;
      }
    }
  }

  .footer__copyright {
    margin: 0 auto 5.625rem;
    font-size: 0.8rem;
    letter-spacing: 0.1rem;
  }
}
```

- [ ] **Step 3: `public/favicon.svg` を新規作成**（ニュートラルなプレースホルダ。setup-brand で差し替え）

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#000"/><text x="32" y="43" font-family="serif" font-size="30" fill="#fff" text-anchor="middle">LP</text></svg>
```

- [ ] **Step 4: `index.html` を以下の内容に全置換**

変更点: GTM をプレースホルダ `GTM-XXXXXXX` 化してブロックごとコメントアウト（プレースホルダのまま読むと 404 になるため。setup-brand が有効化）/ favicon をローカルの `/favicon.svg` に / `.ec` を BEM 化し `aria-label`・`data-animate` 付与 / footer を BEM クラス化（ID 廃止）・`<h3>` → `<p>`（見出し階層破綻の解消）/ 全 img に width・height（logo.svg は viewBox 193.6×63.8 → 90×30、アイコンは正方形 → 33×33）/ `rel="noopener"` 明示 / `class="lazyload"` 残骸削除 / ブランド固有値（junonline.jp・ROPÉ 等）をプレースホルダ化（実値は Task 8 の setup-brand ブランド辞書に退避済み）。

```html
<!doctype html>
<html lang="ja">
  <head
    prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#"
  >
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="" />
    <title>LPタイトル</title>

    <meta property="og:locale" content="ja_JP" />
    <meta property="og:title" content="" />
    <meta property="og:url" content="" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="" />
    <meta property="og:description" content="" />
    <meta property="og:image" content="" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="" />
    <meta name="twitter:title" content="" />
    <meta name="twitter:description" content="" />
    <meta name="twitter:image:src" content="" />
    <meta name="twitter:url" content="" />

    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

    <!--
      Google Tag Manager
      setup-brand: 案件の GTM ID に置き換え、このコメントを解除して有効化する
    -->
    <!--
    <script>
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({
          "gtm.start": new Date().getTime(),
          event: "gtm.js",
        });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, "script", "dataLayer", "GTM-XXXXXXX");
    </script>
    -->
    <!-- End Google Tag Manager -->
  </head>

  <body>
    <!--
      Google Tag Manager (noscript)
      setup-brand: 案件の GTM ID に置き換え、このコメントを解除して有効化する
    -->
    <!--
    <noscript>
      <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display: none; visibility: hidden"></iframe>
    </noscript>
    -->
    <!-- End Google Tag Manager (noscript) -->

    <section class="ec" aria-label="オンラインストア" data-animate>
      <a
        class="ec__link"
        href="https://example.com/"
        target="_blank"
        rel="noopener"
        >ONLINE STORE</a
      >
    </section>

    <footer class="footer">
      <div class="footer__logo">
        <p>
          <a href="https://example.com/" target="_blank" rel="noopener"
            ><img
              src="src/assets/images/logo.svg"
              loading="lazy"
              alt="BRAND NAME"
              width="90"
              height="30"
          /></a>
        </p>
      </div>

      <nav class="footer__links" aria-label="関連リンク">
        <a href="https://example.com/" target="_blank" rel="noopener"
          >ONLINE STORE</a
        ><span>|</span>
        <a href="https://example.com/" target="_blank" rel="noopener"
          >STAFF STYLING</a
        ><span>|</span>
        <a href="https://example.com/" target="_blank" rel="noopener"
          >OTHER CONTENTS</a
        >
      </nav>

      <div class="footer__sns">
        <p class="footer__sns-title">Follow us</p>
        <div class="footer__sns-icons">
          <a href="https://example.com/" target="_blank" rel="noopener"
            ><img
              src="src/assets/images/icon_instagram.svg"
              loading="lazy"
              alt="Instagram"
              width="33"
              height="33"
          /></a>
          <a href="https://example.com/" target="_blank" rel="noopener"
            ><img
              src="src/assets/images/icon_facebook.svg"
              loading="lazy"
              alt="Facebook"
              width="33"
              height="33"
          /></a>
          <a href="https://example.com/" target="_blank" rel="noopener"
            ><img
              src="src/assets/images/icon_x.svg"
              loading="lazy"
              alt="X"
              width="33"
              height="33"
          /></a>
        </div>
      </div>

      <p class="footer__copyright">&copy; BRAND NAME ALL RIGHTS RESERVED.</p>
    </footer>

    <script type="module" src="/src/scripts/main.js"></script>
  </body>
</html>
```

- [ ] **Step 5: `src/scripts/main.js` に import を追加**（全置換）

```js
import "../styles/base.css";
import "../styles/global.css";
import "../styles/ec.css";
import "../styles/footer.css";
```

- [ ] **Step 6: ビルドで検証**

Run: `npm run build`
Expected: 成功。`dist/favicon.svg` が存在すること（`ls dist/favicon.svg`）

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "refactor: セクションCSS分割・index.htmlのBEM化とプレースホルダ化

- .ec / footer を個別CSSファイルに分割（1セクション=1ルートクラス=1ファイル）
- IDセレクタ廃止・BEM風クラスに統一、モバイルファースト化
- GTM/ブランド固有値をプレースホルダ化（実値は setup-brand 辞書へ）
- GTMはコメントアウト同梱（プレースホルダのままの404を防止）
- 見出し階層修正・img width/height付与・lazyload残骸削除

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: GSAP 導入・アニメーションスキャフォールド

**Files:**

- Create: `src/scripts/animations.js`
- Modify: `src/scripts/main.js`（全置換）
- Modify: `src/styles/global.css`（末尾に追記）
- Modify: `package.json`（npm install による自動変更）

- [ ] **Step 1: GSAP をインストール**

Run: `npm install gsap`
Expected: `added 1 package` 前後の出力。package.json の dependencies に `gsap` が入る

- [ ] **Step 2: `src/scripts/animations.js` を新規作成**

注意: CSS 側で初期非表示（opacity: 0）にするため、`gsap.from()` は使わない（from は CSS の 0 を終了値として読むため要素が表示されない）。必ず `gsap.fromTo()` を使う。

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

export const initScrollAnimations = () => {
  if (prefersReducedMotion) return;

  for (const el of gsap.utils.toArray("[data-animate]")) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      },
    );
  }
};
```

- [ ] **Step 3: `src/scripts/main.js` を全置換**（DOMContentLoaded 初期化構造）

```js
import "../styles/base.css";
import "../styles/global.css";
import "../styles/ec.css";
import "../styles/footer.css";

import { initScrollAnimations } from "./animations.js";

document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
});
```

- [ ] **Step 4: `src/styles/global.css` の末尾に初期非表示 CSS を追記**

reduced-motion 時は JS がアニメをスキップするので CSS 側も隠さない（複合条件が重要）。JS 無効環境では media query 自体が偽になり表示される。

```css
/* ----------------------------------------------------------------
 Scroll animation initial state
 JS有効かつモーション許可時のみ非表示（JS無効・reduced-motionでは隠さない）
----------------------------------------------------------------- */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  [data-animate] {
    opacity: 0;
  }
}
```

- [ ] **Step 5: ビルドと動作確認**

Run: `npm run build`
Expected: 成功。バンドルサイズが GSAP 分（~70KB gzip前）増える

Run: `npm run preview &` して `curl -s http://localhost:4173/ | grep -c "data-animate"`
Expected: `1`（.ec セクション）。確認後 preview プロセスを kill する

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "feat: GSAP ScrollTrigger による data-animate スキャフォールドを追加

- gsap.fromTo で CSS 初期非表示と両立（from だと表示されないバグを回避）
- prefers-reduced-motion / JS無効環境では CSS 側も隠さない複合条件
- main.js に DOMContentLoaded 初期化構造を導入

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 4: CLAUDE.md 書き直し

**Files:**

- Modify: `CLAUDE.md`（全置換）

- [ ] **Step 1: `CLAUDE.md` を以下の内容に全置換**

````markdown
# CLAUDE.md

## プロジェクト概要

JUN の複数ブランド向け LP テンプレート。静的 HTML + Vite + vanilla JavaScript で構築する。
新規案件はこのテンプレートを複製し、最初に `setup-brand` スキルでブランド情報を差し替えてから着手する。

## 技術スタック

- **ビルドツール**: Vite
- **言語**: vanilla JavaScript (ES Modules)
- **スタイリング**: プレーン CSS（BEM 風命名＋ネイティブネスト。デザイントークンは `src/styles/global.css` の `:root`）
- **アニメーション**: GSAP（同梱。`data-animate` のフェードインは `src/scripts/animations.js` に実装済み）
- **カルーセル**: Swiper（同梱しない。カルーセルを使う案件でのみ `npm install swiper`）

## 設計原則

将来 Vue / React 等のコンポーネントベースに移行する可能性を視野に、「1 セクション = 1 コンポーネントへ機械的に写せる」状態を保つ。

1. **1 セクション = 1 ルートクラス = 1 CSS ファイル**（＋固有インタラクションがある場合のみ 1 JS モジュール）
   - 例: `<section class="hero">` ⇔ `src/styles/hero.css` ⇔ `src/scripts/hero.js`
2. CSS はセクションのルートクラス配下に**ネイティブネスト**で書き、疑似スコープを保つ
3. JS はセクションごとに **init 関数を export** し、DOM 参照はセクションルート要素起点にする
4. デザイントークン（色・フォント・余白・イージング）は `global.css` の `:root` に集約する
5. スタイル用セレクタは**クラスのみ**。ID はページ内アンカー用途に限定する

## 開発コマンド

```bash
npm install        # 依存関係インストール
npm run dev        # 開発サーバー起動 (localhost:5173)
npm run build      # プロダクションビルド (dist/)
npm run preview    # ビルド結果のプレビュー
npm run lint       # Stylelint + ESLint
npm run format     # Prettier で全ファイル整形
```
````

## Skills

- **新規案件の開始時**: `setup-brand` スキルでブランド固有情報（GTM・フォント・ロゴ・フッター・favicon・カラー）を差し替える
- **セクション追加**: `add-section` スキル（`.claude/skills/add-section/SKILL.md`）の手順に従う

## 行動原則

1. **自分で全部やらない** - 専門領域はSubAgentに移譲する
2. **タスクを分解** - 大きなタスクは小さなタスクに分解する
3. **ユーザーと完全に認識を合わせる** - 曖昧なものは全て、AskUserQuestion Toolを細分化してヒヤリング必須

## 注意事項

- `node_modules/` と `dist/` はGit管理対象外にする
- 画像はWebP形式を優先し、適切に圧縮する
- ライブラリの追加は最小限にとどめ、バンドルサイズを意識する
- コンソールに警告・エラーが出ない状態を保つ
- テンプレート状態ではプレースホルダ（`GTM-XXXXXXX`・`example.com`・`BRAND NAME`）が残っている。公開前に setup-brand の検証手順で残存ゼロを確認する

````

- [ ] **Step 2: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md を実態に合わせて全面改訂

- CSS Modules 記載を撤回しプレーンCSS（BEM風+ネスト）に訂正
- コンポーネント移行を見据えた設計原則を明文化
- GSAP同梱/Swiper都度インストールの方針を明記
- setup-brand / add-section スキルの運用を記載

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
````

---

## Task 5: rules 改訂（css / responsive / javascript）

**Files:**

- Modify: `.claude/rules/css.md`（全置換）
- Modify: `.claude/rules/responsive.md`（frontmatter のみ）
- Modify: `.claude/rules/javascript.md`（末尾に追記）

- [ ] **Step 1: `.claude/rules/css.md` を以下の内容に全置換**

````markdown
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
````

## デザイントークン

- CSS 変数は `global.css` の `:root` で定義する。色・フォント・余白・イージングは必ずトークンを参照する
- `--color-primary` と `--font-primary` はブランド差し替え対象（setup-brand スキル）。ハードコードしない

## 単位・サイズ

- `px` よりも `rem` を優先する（`font-size` / `margin` / `padding` / `gap` は rem 必須。1px の罫線等は px 可）
- 画像の `max-width: 100%` は base.css で設定済み

## 画像の遅延読み込み

- 遅延読み込み対象の画像にはフェードイン等のトランジションを設定し、表示時のちらつきを緩和する

````

- [ ] **Step 2: `.claude/rules/responsive.md` の frontmatter を修正**（`.module.css` を除去。本文は現状維持）

```markdown
---
globs: ["src/**/*.css"]
---
````

- [ ] **Step 3: `.claude/rules/javascript.md` の末尾に以下を追記**

```markdown
## セクション JS の規律

- セクション固有のスクリプトは `src/scripts/セクション名.js` に置き、init 関数（例: `initHero`）を export する
- DOM 参照はセクションのルート要素を起点にする: `const root = document.querySelector(".hero")` で取得し、内部は `root.querySelector()` で辿る。ルートが無ければ早期 return する
- 初期化は `src/scripts/main.js` の `DOMContentLoaded` ハンドラから呼び出す
```

- [ ] **Step 4: コミット**

```bash
git add .claude/rules
git commit -m "docs: css/responsive/javascript ルールをプレーンCSS実態に合わせて改訂

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 6: rules 改訂（gsap / swiper）

**Files:**

- Modify: `.claude/rules/gsap.md`（全置換）
- Modify: `.claude/rules/swiper.md`（全置換）

- [ ] **Step 1: `.claude/rules/gsap.md` を以下の内容に全置換**

重要な修正: 旧例の `gsap.from()` は CSS の `opacity: 0` を終了値として読むため要素が表示されないバグがある → `fromTo` に修正。`forEach` → `for...of`（javascript.md との整合）。初期非表示 CSS を reduced-motion 複合条件に修正。パスを `src/scripts/` に修正。

````markdown
---
globs: ["src/scripts/animations.js", "src/**/*.js"]
---

# GSAP 使用規約

## 初期化

- `ScrollTrigger` 等のプラグインは使用前に明示的に登録する: `gsap.registerPlugin(ScrollTrigger)`
- アニメーション定義は `src/scripts/animations.js` に集約する

## アクセシビリティ

- `prefers-reduced-motion: reduce` が有効な場合はアニメーションを無効化またはシンプルにする
- 実装例:

```js
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

if (!prefersReducedMotion) {
  // GSAP アニメーションを実行
}
```
````

## 画像・要素の表示演出

- ファーストビュー外の要素のフェードイン演出には `ScrollTrigger` を使用する
- `IntersectionObserver` を別途使わず、表示トリガーは `ScrollTrigger` に一本化する
- 初期非表示を CSS で行うため、`gsap.from()` ではなく **`gsap.fromTo()` を使う**（`from()` は CSS の `opacity: 0` を終了値として読んでしまい、要素が表示されない）
- 実装例（テンプレ同梱の `src/scripts/animations.js` が正）:

```js
for (const el of gsap.utils.toArray("[data-animate]")) {
  gsap.fromTo(
    el,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
    },
  );
}
```

- 表示演出の対象は HTML 側で `data-animate` 等のカスタムデータ属性で指定する
- 初期非表示は CSS 側で行い、**JS 無効・reduced-motion 環境では隠さない**（global.css に定義済み）:

```css
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  [data-animate] {
    opacity: 0;
  }
}
```

## パフォーマンス

- `transform` と `opacity` のみアニメーションさせることを優先する（レイアウトの再計算を避ける）
- 不要になった ScrollTrigger インスタンスは `.kill()` で破棄する

````

- [ ] **Step 2: `.claude/rules/swiper.md` を以下の内容に全置換**

```markdown
---
globs: ["src/scripts/slider.js", "src/**/*.js"]
---

# Swiper 使用規約

## 導入

- Swiper はテンプレートに同梱していない。カルーセルを使う案件でのみ `npm install swiper` する

## インポート

- コアCSS: `import 'swiper/css'`
- 使用するモジュールの CSS は個別にインポートする:

```js
import "swiper/css/navigation";
import "swiper/css/pagination";
````

- 使用するモジュールは個別にインポートし、`modules` オプションで登録する:

```js
import Swiper from "swiper";
import { Navigation, Pagination } from "swiper/modules";

const swiper = new Swiper(".swiper", {
  modules: [Navigation, Pagination],
  // ...
});
```

## 設計

- 初期化・設定は `src/scripts/slider.js` に集約する
- 複数のスライダーがある場合も同ファイル内で管理し、関数を分けて定義する
- ページ遷移や要素の破棄時には `.destroy()` を呼び出してメモリリークを防ぐ

````

- [ ] **Step 3: コミット**

```bash
git add .claude/rules
git commit -m "docs: gsap/swiper ルールのパス修正と gsap.from バグの是正

- src/js/ → src/scripts/ にパス統一
- gsap.from + CSS opacity:0 で要素が表示されないバグを fromTo に修正
- 初期非表示CSSを reduced-motion 複合条件に更新
- Swiper の都度インストール方針を明記

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
````

---

## Task 7: add-section スキル全面書き直し

**Files:**

- Modify: `.claude/skills/add-section/SKILL.md`（全置換）

- [ ] **Step 1: `.claude/skills/add-section/SKILL.md` を以下の内容に全置換**

````markdown
---
name: add-section
description: LPに新しいセクションを追加する標準手順。静的HTML＋プレーンCSS（BEM風・ルートクラス配下ネスト）で、1セクション=1ルートクラス=1CSSファイルの規律を守る。
---

# 新しいセクションの追加

## 前提（設計原則）

- **1 セクション = 1 ルートクラス = 1 CSS ファイル**（＋固有インタラクションがある場合のみ 1 JS モジュール）
- クラス命名は BEM 風: ブロックはケバブケース `.section-name`、要素は `.section-name__element`、修飾は `--modifier`
- 将来 Vue / React 等へ移行するとき 1 セクション = 1 コンポーネントに写せる状態を保つ

## 手順

### 1. index.html に `<section>` を追加

```html
<section class="section-name" aria-label="セクションの説明">
  <div class="section-name__inner" data-animate>
    <h2 class="section-name__title">見出し</h2>
    <!-- コンテンツ -->
  </div>
</section>
```
````

- ルートクラスはケバブケースで、CSS ファイル名と一致させる
- `id` はページ内リンクが必要な場合のみ付与する（スタイルには使わない）
- `aria-label` でセクションの目的を明示する
- フェードイン演出が必要な要素には `data-animate` を付与する
- 画像には `loading` / `width` / `height` / `alt` を設定する（`.claude/rules/html.md` 参照）

### 2. `src/styles/セクション名.css` を作成

```css
.section-name {
  padding: var(--spacing-lg) var(--spacing-sm);

  @media (width >= 768px) {
    padding: 6rem var(--spacing-md);
  }

  @media (width >= 1024px) {
    padding: 8rem 3rem;
  }

  .section-name__title {
    font-size: 1.5rem;

    @media (width >= 768px) {
      font-size: 2rem;
    }
  }
}
```

- モバイルファースト・レンジ構文（`width >=`）で記述する
- スタイルは必ずルートクラス配下にネイティブネストで書く
- 色・余白・フォント・イージングは `global.css` のトークン（`var(--...)`）を参照する

### 3. `src/scripts/main.js` に CSS の import を追加

```js
import "../styles/section-name.css";
```

（既存の CSS import 群の末尾、DOM 順に合わせた位置に追加する）

### 4. JS ファイルを作成（固有インタラクションがある場合のみ）

`src/scripts/セクション名.js` を作成し、init 関数を export する。DOM 参照はルート要素起点。

```js
export const initSectionName = () => {
  const root = document.querySelector(".section-name");
  if (!root) return;

  // root.querySelector() で内部要素を辿って処理する
};
```

`main.js` の DOMContentLoaded で初期化を呼び出す:

```js
import { initSectionName } from "./section-name.js";

document.addEventListener("DOMContentLoaded", () => {
  // ...既存の初期化
  initSectionName();
});
```

### 5. チェックリスト

追加後に以下を確認する:

- [ ] モバイル・タブレット・デスクトップで表示が崩れていないか
- [ ] `data-animate` 要素のフェードインが正しく動作するか
- [ ] 画像がある場合 `loading="lazy"`, `width`, `height`, `alt` が設定されているか
- [ ] コンソールに警告・エラーが出ていないか
- [ ] 見出し階層が前後のセクションと整合しているか
- [ ] `npm run lint` がパスするか

````

- [ ] **Step 2: コミット**

```bash
git add .claude/skills/add-section
git commit -m "docs: add-section スキルをプレーンCSS前提に全面書き直し

旧手順は CSS Modules 前提で、静的HTMLに対してはスタイルが当たらず
手順として成立していなかった。実態と設計原則に整合する手順に刷新。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
````

---

## Task 8: setup-brand スキル新規作成

**Files:**

- Create: `.claude/skills/setup-brand/SKILL.md`

- [ ] **Step 1: `.claude/skills/setup-brand/SKILL.md` を新規作成**

````markdown
---
name: setup-brand
description: 新規LP案件の初回セットアップ。テンプレートのプレースホルダ（GTM ID・favicon・フッター・ロゴ・フォント・ブランドカラー等）をブランド実値に差し替える。ユーザーが「新しい案件を始める」「◯◯ブランドのLPを作る」「ブランドをセットアップして」等と言ったとき、または複製直後のテンプレートで作業を始める文脈で必ず使用する。
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
| 11  | ブランドフォント                          | `src/styles/global.css` `--font-primary` ＋読み込み手段（下記）       | システムフォントスタック                                                                                                   |
| 12  | プリローダー用白ロゴ                      | `src/assets/images/rope_white_logo.svg`（preloader スキル使用時のみ） | ROPÉ の白ロゴが仮置き                                                                                                      |
| 13  | トップの ONLINE STORE リンク              | `index.html` `.ec` セクションの `.ec__link` の `href`                 | `https://example.com/`                                                                                                     |

### 3. ブランドフォントの導入（3 パターン）

いずれの場合も `font-display: swap` 相当の挙動と、日本語フォールバックスタック（游明朝系等）の維持を必須とする。

1. **Google Fonts にあるフォント**: `npm install @fontsource/フォント名` → `main.js` の先頭で `import "@fontsource/フォント名";` → `--font-primary` の先頭にフォント名を追加
2. **ライセンスフォント（支給 woff2）**: `src/assets/fonts/` に配置 → `global.css` に `@font-face`（`font-display: swap` を指定）→ `--font-primary` を更新
3. **システムフォントのみ**: `--font-primary` の値を変更するだけ

### 4. 検証

```bash
# プレースホルダの残存チェック（ヒット 0 件になること）
grep -rn -e "GTM-XXXXXXX" -e "example.com" -e "BRAND NAME" -e "jun-lp-template" index.html package.json src public
# title / description / OGP の記入漏れチェック（ヒット 0 件になること）
grep -n 'content=""' index.html && grep -n "LPタイトル" index.html
# ビルド確認
npm run build
```
````

- GTM のコメントが解除され、実 ID になっていることを目視確認する
- `npm run dev` でコンソールにエラー・警告が無いことを確認する

## ブランド辞書

### ROPÉ

- GTM ID: `GTM-KRTNBQ5`
- favicon: `https://www.junonline.jp/favicon.png`（PNG。取得して `public/favicon.png` に置き、`<link rel="icon" href="/favicon.png" type="image/png" />` に変更）
- ロゴリンク先: `https://www.rope-jp.com`
- ロゴ画像: テンプレ同梱の `src/assets/images/logo.svg` / `rope_white_logo.svg` が ROPÉ 実物（差し替え不要）。alt は `ROPÉ`
- フッターリンク: ONLINE STORE `https://www.junonline.jp/rope/` / STAFF STYLING `https://www.junonline.jp/rope/styling/` / OTHER CONTENTS `https://www.junonline.jp/news?rope`
- トップ ONLINE STORE リンク（`.ec__link`）: `https://www.junonline.jp/rope/`（フッターの ONLINE STORE と同じ）
- SNS: Instagram `https://www.instagram.com/rope_jp/` / Facebook `https://www.facebook.com/rope1968` / X `https://twitter.com/ROPE_JP`
- コピーライト: `© JUN CO.,LTD. ALL RIGHTS RESERVED.`
- ブランドフォント: Marcellus（パターン1: `npm install @fontsource/marcellus`）→ `--font-primary: "Marcellus", "游明朝", YuMincho, "Hiragino Mincho ProN", serif;`
- ブランドカラー `--color-primary`: `#000`

````

- [ ] **Step 2: チェックリストとプレースホルダの突合検証**

Run: `grep -rn -e "GTM-XXXXXXX" -e "example.com" -e "BRAND NAME" index.html package.json src public | wc -l`
Expected: プレースホルダの出現数は 12（GTM×2・example.com×8・BRAND NAME×2）。ただし logo 行は example.com と BRAND NAME が同一行のため、行数カウントでは 11 になる。チェックリストの項目がこれら全出現箇所をカバーしていることを目視で突合する

- [ ] **Step 3: コミット**

```bash
git add .claude/skills/setup-brand
git commit -m "feat: setup-brand スキルを新規作成（ブランド辞書つき差し替えチェックリスト）

誤ブランド出荷（別ブランドのGTM混入等）を構造的に防ぐため、
テンプレはプレースホルダ、実値はスキル内のブランド辞書に集約。

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
````

---

## Task 9: 残り 4 スキルの整合確認

**Files:**

- Verify (必要時のみ Modify): `.claude/skills/credit-list/SKILL.md`, `.claude/skills/floating-button/SKILL.md`, `.claude/skills/preloader/SKILL.md`, `.claude/skills/scroll-lock/SKILL.md`

- [ ] **Step 1: 古い前提の残存を検査**

Run:

```bash
grep -rn -e "src/js/" -e "module\.css" -e "main\.css" .claude/skills/credit-list .claude/skills/floating-button .claude/skills/preloader .claude/skills/scroll-lock
```

Expected: ヒット 0 件（これらのスキルは元々 `src/scripts/`・`global.css` 前提で書かれており、Task 1 のリネームで実態と一致済み）

- [ ] **Step 2: トークン前提の充足を検査**

Run:

```bash
grep -o -- "--[a-z-]*" .claude/skills/credit-list/SKILL.md | sort -u
```

Expected: 出てくる CSS 変数（`--color-rule`, `--color-rule-light`, `--color-text`, `--color-link`, `--ease-out` 等）がすべて `src/styles/global.css` の `:root` に定義済みであること。未定義があれば global.css に追加する

- [ ] **Step 3: ヒットがあった場合のみ該当箇所を修正してコミット**（`src/js/` → `src/scripts/`、`main.css` → `global.css` に置換）。ヒット 0 件ならコミット不要、次のタスクへ

---

## Task 10: ツール導入（Prettier / Stylelint / ESLint）

**Files:**

- Create: `.prettierrc`
- Create: `.prettierignore`
- Create: `.stylelintrc.json`
- Create: `eslint.config.js`
- Modify: `package.json`（name / scripts / devDependencies）

- [ ] **Step 1: dev 依存をインストール**

Run: `npm install -D prettier stylelint stylelint-config-standard eslint @eslint/js globals`
Expected: `added N packages` で成功

- [ ] **Step 2: `package.json` の name と scripts を修正**（devDependencies は Step 1 で自動追記済み。以下のフィールドになるよう編集）

```json
{
  "name": "jun-lp-template",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "format": "prettier --write .",
    "lint": "npm run lint:css && npm run lint:js",
    "lint:css": "stylelint \"src/**/*.css\"",
    "lint:js": "eslint src"
  }
}
```

- [ ] **Step 3: `.prettierrc` を新規作成**（デフォルト設定を明示的に採用）

```json
{}
```

- [ ] **Step 4: `.prettierignore` を新規作成**

```
dist
package-lock.json
```

- [ ] **Step 5: `.stylelintrc.json` を新規作成**

`selector-class-pattern` は BEM 風（`block__element--modifier`）を許可するよう上書き（standard のデフォルトは `__` を拒否する）。`scripting` メディア特性が未知扱いされる場合に備えて ignore を指定。

```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "media-feature-range-notation": "context",
    "media-feature-name-no-unknown": [
      true,
      { "ignoreMediaFeatureNames": ["scripting"] }
    ],
    "declaration-property-unit-allowed-list": {
      "font-size": ["rem"],
      "/^(margin|padding|gap)/": ["rem", "%"]
    },
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      {
        "message": "BEM 風（block__element--modifier、ケバブケース）で命名してください"
      }
    ]
  }
}
```

- [ ] **Step 6: `eslint.config.js` を新規作成**

```js
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/"] },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "prefer-arrow-callback": "error",
    },
  },
];
```

- [ ] **Step 7: lint を実行して検証**

Run: `npx stylelint "src/**/*.css" --fix && npm run lint`
Expected: exit 0。stylelint の自動修正で直らない違反が出た場合は、規約（css.md）に合わせて手で修正する。`npm run build` も成功すること

- [ ] **Step 8: コミット**

```bash
git add -A
git commit -m "chore: Prettier/Stylelint/ESLint を導入し規約を自動強制

- rem必須（font-size/margin/padding/gap）・レンジ構文・BEM命名を Stylelint で強制
- package name を jun-lp-template に変更（前案件の名残を解消）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 11: Claude Code フック（自動フォーマット）

**Files:**

- Modify: `.claude/settings.json`（全置換）

- [ ] **Step 1: `.claude/settings.json` を以下の内容に全置換**（既存の enabledPlugins を維持しつつ hooks を追加）

Edit / Write 後に対象ファイルを Prettier で自動整形する。`--ignore-unknown` で非対象ファイルは無視、失敗してもツール実行を妨げない。

```json
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "frontend-design@claude-plugins-official": true
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path // empty' | xargs npx prettier --write --ignore-unknown --log-level silent 2>/dev/null || true"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: フックの動作確認**

Run: `echo '{"tool_input":{"file_path":"src/scripts/main.js"}}' | jq -r '.tool_input.file_path // empty' | xargs npx prettier --write --ignore-unknown --log-level silent 2>/dev/null || true; echo "exit=$?"`
Expected: `exit=0`。main.js の内容が変わらないこと（既に整形済みのため）

- [ ] **Step 3: コミット**

```bash
git add .claude/settings.json
git commit -m "chore: Edit/Write 後の Prettier 自動整形フックを追加

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 12: 全体フォーマットと lint 消化

**Files:**

- Modify: リポジトリ全体（Prettier による整形のみ）

- [ ] **Step 1: 全体フォーマット**

Run: `npm run format`
Expected: 各ファイルが整形される（`.claude/*.md`、`docs/`、`index.html`、CSS、JS、JSON）

- [ ] **Step 2: lint とビルドの最終確認**

Run: `npm run lint && npm run build`
Expected: どちらも成功。違反が出たら修正する（Prettier と Stylelint が衝突した場合は Stylelint 側の指摘を優先し、両方通る書き方にする）

- [ ] **Step 3: コミット**

```bash
git add -A
git commit -m "style: Prettier で全ファイルを一括整形

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 13: 最終検証（受け入れテスト）

**Files:** なし（検証のみ。ドライラン後は元に戻す）

- [ ] **Step 1: 矛盾の残存ゼロを grep で確認**（spec 検証基準 5）

Run:

```bash
grep -rn "src/js/" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=docs .
grep -rn "\.module\.css" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=docs .
grep -rln "main\.css" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=docs .
```

Expected: すべてヒット 0 件（docs/ は設計書・計画書のため除外）

Run:

```bash
grep -rln -e "GTM-KRTNBQ5" -e "Marcellus" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=docs .
```

Expected: `.claude/skills/setup-brand/SKILL.md` の 1 ファイルのみ

- [ ] **Step 2: add-section スキルのドライラン**（spec 検証基準 6）

書き直した手順の通りに仮セクションを追加して、手順が実際に機能することを証明する。

2-1. `index.html` の `</footer>` の直後（`<script>` の前）に追加:

```html
<section class="dry-run" aria-label="ドライラン検証">
  <div class="dry-run__inner" data-animate>
    <h2 class="dry-run__title">Dry Run</h2>
  </div>
</section>
```

2-2. `src/styles/dry-run.css` を作成:

```css
.dry-run {
  padding: var(--spacing-lg) var(--spacing-sm);

  @media (width >= 768px) {
    padding: 6rem var(--spacing-md);
  }

  .dry-run__title {
    font-size: 1.5rem;

    @media (width >= 768px) {
      font-size: 2rem;
    }
  }
}
```

2-3. `src/scripts/main.js` の CSS import 群の末尾に追加:

```js
import "../styles/dry-run.css";
```

2-4. 検証:

Run: `npm run lint && npm run build`
Expected: 両方成功

Run: `npm run build && grep -c "dry-run" dist/index.html`
Expected: `1` 以上（セクションがビルドに含まれる）。dist/assets の CSS に `.dry-run` が含まれること: `grep -rl "dry-run" dist/assets` で 1 ファイル

2-5. ドライランを完全に破棄:

```bash
git checkout -- index.html src/scripts/main.js
rm src/styles/dry-run.css
git status --short
```

Expected: `git status --short` の出力が空（作業ツリーがクリーン）

- [ ] **Step 3: ビルド＋プレビューの最終確認**（spec 検証基準 1・3）

Run: `npm run build 2>&1 | tail -5`
Expected: `✓ built` で完了、警告なし

Run: `npm run preview` をバックグラウンド起動し `curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/`
Expected: `200`。確認後 preview を停止

- [ ] **Step 4: ユーザーへのブラウザ確認案内**

自動検証できない項目（spec 検証基準 3・4 の体感部分）をユーザーに案内する:

- `npm run dev` でコンソールにエラー・警告が出ないこと
- スクロールで `.ec` セクションがフェードインすること
- OS の「視差効果を減らす」を有効にしてもコンテンツが表示されたままであること

- [ ] **Step 5: 完了報告**

すべての検証基準（spec §7 の 1〜7）に対する結果を明記して報告する。

---

## タスク依存関係

- Task 1 → 2 → 3 は順序必須（CSS 基盤 → 分割 → JS）
- Task 4〜9（ドキュメント）は Task 3 完了後なら任意の順で可（ただし記載順を推奨）
- Task 10 → 11 → 12 は順序必須（ツール → フック → 一括整形）
- Task 13 は最後
