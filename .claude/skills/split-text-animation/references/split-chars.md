# 文字分割ユーティリティ（a11y 込み）

見出しテキストを 1 文字ずつ span に分割するユーティリティ。プリセット a / b はフラット版、プリセット c / d はマスク 2 重版を使う。どちらも「元テキストを `aria-label` に退避 → 生成 span は `aria-hidden`」で読み上げを 1 語に保つ。

## マスク 2 重版（プリセット c / d 用。a / b でも使える）

各文字を `outer（overflow: hidden のマスク）> inner（動かす実体）` の 2 重にする。inner を `yPercent: 100 → 0` すると「行の中からせり上がる」表現になる。スペースは span にせずテキストノードとして挿入する（inline-block 間の自然な語間になる）。

```js
// split-text.js
export const splitChars = (el) => {
  if (el.dataset.split === "true") return; // 二重分割ガード

  const text = el.textContent;
  el.setAttribute("aria-label", text); // 読み上げは元テキスト 1 語で
  el.textContent = "";

  for (const char of text) {
    if (char === " ") {
      el.insertAdjacentText("beforeend", " ");
      continue;
    }
    const mask = document.createElement("span");
    mask.className = "char-mask";
    mask.setAttribute("aria-hidden", "true");

    const inner = document.createElement("span");
    inner.className = "char";
    inner.textContent = char;

    mask.appendChild(inner);
    el.appendChild(mask);
  }

  el.dataset.split = "true";
};
```

付属 CSS。`line-height` はマスクの天地。詰めすぎるとディセンダ（g, y, p）や濁点が切れるので、フォントに合わせて 1.2〜1.4 で調整する。

```css
/* Split Text — 一文字 reveal 用 */
.char-mask {
  display: inline-block;
  overflow: hidden;
  line-height: 1.2; /* ディセンダが切れる場合は広げる */
  vertical-align: bottom;
}

.char {
  display: inline-block;
  line-height: 1.2;
}
```

## フラット版（プリセット a / b 用の最小構成）

マスク不要な場合の 1 重 span 版。この方式ではスペースを ` `（&nbsp;）にして span 内に保持する（空 span + 通常スペースは inline-block で潰れることがあるため）。分割した span の NodeList を返すので、そのまま GSAP のターゲットにできる。

```js
export const splitCharsFlat = (el) => {
  if (el.dataset.split === "true") return el.querySelectorAll(".char");

  const text = el.textContent;
  const chars = Array.from(text); // サロゲートペア（絵文字等）も 1 文字扱い
  el.setAttribute("aria-label", text);
  el.textContent = "";

  for (const c of chars) {
    const span = document.createElement("span");
    span.className = "char";
    span.setAttribute("aria-hidden", "true");
    span.textContent = c === " " ? " " : c;
    el.appendChild(span);
  }

  el.dataset.split = "true";
  return el.querySelectorAll(".char");
};
```

```css
.char {
  display: inline-block;
}
```

## 単語ラップ（英文見出しの折り返し対策）

inline-block の文字 span は**単語の途中でも折り返す**。複数単語の英文見出しでは、単語ごとに `display: inline-block` のラッパーを挟むと単語単位で折り返すようになる。

```js
export const splitCharsByWord = (el, splitFn = splitCharsFlat) => {
  if (el.dataset.wordSplit === "true") return el.querySelectorAll(".char");

  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.textContent = "";

  for (const [i, word] of text.split(" ").entries()) {
    if (i > 0) el.insertAdjacentText("beforeend", " ");
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";
    wordSpan.textContent = word;
    el.appendChild(wordSpan);
    splitFn(wordSpan); // 単語内をさらに 1 文字分割
    wordSpan.removeAttribute("aria-label"); // aria-label は親にだけ残す
    wordSpan.setAttribute("aria-hidden", "true");
  }

  el.dataset.wordSplit = "true";
  return el.querySelectorAll(".char");
};
```

```css
.word {
  display: inline-block;
  white-space: nowrap;
}
```

## シード付き乱数（プリセット b 用）

`Math.random()` ではなく mulberry32 を使い、**シードが同じなら常に同じシャッフル順**にする。演出の印象が固定され、QA・録画・不具合再現が安定する。

```js
// seeded-random.js
export const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const seededShuffle = (array, seed) => {
  const rng = mulberry32(seed);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
```

## 使い方（分割フェーズの標準形）

分割は**アニメの有無に関わらず** DOMContentLoaded 直後に行い、DOM 構造を安定させる。初期状態のセットとアニメ発火はプリセット側（references/reveal-presets.md）が担う。

```js
import { splitChars } from "./split-text.js";

// 対象見出しを事前に分割（reduced-motion でも分割自体は行う）
for (const heading of document.querySelectorAll("[data-split-text]")) {
  splitChars(heading);
}
```

## 注意点

- **`textContent` ベース**なので、見出し内に `<br>` や `<span>` 等の子要素があると消える。改行入り見出しは行ごとに分割対象の要素を分ける
- 日本語見出しはスペースがないため折り返し対策は不要だが、長い場合は `<wbr>` 相当の折り返し位置制御ができなくなる点に注意（必要なら行単位で要素を分ける）
- 数百文字への適用は DOM ノード数・アニメ負荷ともに過剰。見出し・キャッチコピー専用と考える
