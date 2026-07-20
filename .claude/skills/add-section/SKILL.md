---
name: add-section
description: LPに新しいセクションを追加する標準手順。静的HTML＋プレーンCSS（BEM風・ルートクラス配下ネスト）で、1セクション=1ルートクラス=1CSSファイルの規律を守る。
user_invocable: true
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

- ルートクラスはケバブケースで、CSS ファイル名と一致させる
- `id` はページ内リンクが必要な場合のみ付与する（スタイルには使わない）
- `aria-label` でセクションの目的を明示する
- 見出し階層を維持する: 最初のセクション（Hero 等）にはページ唯一の `<h1>` を置き、以降のセクションの見出しは `<h2>` から始める
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
