---
globs: ["src/**/*.js"]
---

# JavaScript コーディング規約

## 基本方針

- ES6+ のモダンな構文を積極的に採用する
- ES Modules (`import` / `export`) を使用する
- `var` は禁止。`const` を優先し、再代入が必要な場合のみ `let` を使用する
- DOM操作は `main.js` で DOMContentLoaded 後に初期化する
- 機能ごとにファイルを分割し、単一責任を保つ

## ES6+ 構文ルール

- アロー関数 (`() => {}`) を優先する。ただし `this` バインドが必要な場合は通常関数を使用する
- テンプレートリテラル (`` `${}` ``) を文字列結合の代わりに使用する
- 分割代入を積極的に使用する (`const { a, b } = obj` / `const [x, y] = arr`)
- スプレッド構文 (`...args`, `{ ...obj }`) でオブジェクト・配列の複製や結合を行う
- Optional Chaining (`?.`) と Nullish Coalescing (`??`) を活用し、冗長な null チェックを避ける
- `for...of` ループを `forEach` よりも優先する
- `Array.prototype` のメソッド (`map`, `filter`, `find`, `some`, `every` 等) を活用する
- `async` / `await` を Promise チェーン (`.then`) よりも優先する
- デフォルト引数を活用し、冗長な条件分岐を避ける

## セクション JS の規律

- セクション固有のスクリプトは `src/scripts/セクション名.js` に置き、init 関数（例: `initHero`）を export する
- DOM 参照はセクションのルート要素を起点にする: `const root = document.querySelector(".hero")` で取得し、内部は `root.querySelector()` で辿る。ルートが無ければ早期 return する
- 初期化は `src/scripts/main.js` の `DOMContentLoaded` ハンドラから呼び出す
