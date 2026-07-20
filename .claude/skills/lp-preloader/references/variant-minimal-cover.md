# 変種 d: 最小カバーフェード

白（または背景色）の全画面カバーを、ヒーロー画像の準備完了で外すだけの最小構成プリローダー。進捗表示なし・ロゴ演出なし。軽いページで % やバーを見せると逆に間延びするため、「一瞬の白 → スッと開く」に徹する。

適用条件: ページが軽い（画像少なめ・動画なし）。演出予算最小。ビルドなしの静的構成でも使える。

完了待ちの方式が 2 つある:

| 方式 | 待つもの | 向いている条件 |
|---|---|---|
| d-1: `window.load` レース | 全リソースの load（3 秒タイムアウトとの早い者勝ち） | GSAP を既に使っている / 対象を選ぶのが面倒なとき |
| d-2: `img.decode()` | ヒーロー画像のデコード完了のみ | GSAP なしでも書ける / ヒーロー以外を待ちたくないとき。`decode()` は「取得済み」でなく「描画可能」まで待つので初回ペイントのチラつきが出ない |

## HTML（共通）

```html
<div class="cover" aria-hidden="true"></div>
```

## CSS（共通）

```css
.cover {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background-color: #fff;
}

body.is-loading {
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}

/* JS 無効環境では表示しない */
@media (scripting: none) {
  .cover {
    display: none;
  }
}
```

## JS: d-1（window.load OR タイムアウトの早い者勝ち）

`window.load` は lazy 画像を待たないので軽いページなら十分早い。二重実行ガード（`started`）とタイムアウトの clear を必ず入れる。`prefers-reduced-motion` ではフェードせず即時に開く。

```js
// GSAP（CDN 読み込みでも import でも可）を前提
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let started = false;
let loadTimeout = null;

const finishLoading = () => {
  document.body.classList.remove("is-loading");
  document.dispatchEvent(new Event("loading:complete"));
};

const revealPage = () => {
  if (started) return;
  started = true;

  if (loadTimeout) {
    clearTimeout(loadTimeout);
    loadTimeout = null;
  }

  const cover = document.querySelector(".cover");

  if (prefersReducedMotion) {
    // 動きなしで即時に開く
    if (cover) cover.style.display = "none";
    finishLoading();
    return;
  }

  gsap.to(cover, {
    autoAlpha: 0,
    duration: 0.4,
    onComplete: () => {
      cover.remove();
      finishLoading(); // ロック解除後に ScrollTrigger 初期化（completion-contract.md）
    },
  });
};

document.body.classList.add("is-loading");
window.addEventListener("load", revealPage);
loadTimeout = setTimeout(revealPage, 3000); // 安全網: 3 秒で必ず開く
```

## JS: d-2（img.decode() promise 版）

ヒーロー画像だけを `decode()` で待つ。GSAP 不要（カバーのフェードは CSS transition + クラストグル）。`decode()` の失敗（404 等）は `catch` で握りつぶして完了扱いにする — 画像 1 枚の失敗でページが開かない事故を防ぐ。

CSS に追記:

```css
.cover {
  transition: opacity 0.6s ease-out;
}

.cover.is-loaded {
  opacity: 0;
  pointer-events: none;
}
```

```js
document.addEventListener("DOMContentLoaded", () => {
  const cover = document.querySelector(".cover");
  document.body.classList.add("is-loading");

  // PC/SP で表示されている側のヒーロー画像だけを対象にする
  const isSP = window.matchMedia("(max-width: 768px)").matches;
  const heroSelector = isSP ? "#hero .sp img" : "#hero .pc img";
  const heroImages = [...document.querySelectorAll(heroSelector)];

  const decoded = heroImages.map((img) => img.decode().catch(() => {})); // 失敗も完了扱い
  const timeout = new Promise((resolve) => setTimeout(resolve, 3000)); // 安全網

  Promise.race([Promise.all(decoded), timeout]).then(() => {
    cover.classList.add("is-loaded");
    cover.addEventListener(
      "transitionend",
      () => {
        cover.remove();
        document.body.classList.remove("is-loading");
        document.dispatchEvent(new Event("loading:complete"));
      },
      { once: true },
    );

    // ヒーロー画像確定後に ScrollTrigger の位置を再計算（使用している場合）
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  });
});
```

元実装からの修正点（d-2）: タイムアウトの安全網がなく、`decode()` が永遠に解決しない環境（極端な回線不良）で開かない可能性があったため `Promise.race` を追加。

## 完了後のヒーロー演出につなぐ

カバーが開いた直後にロゴフェードや文字アニメを始めたい場合は、`loading:complete` を購読して開始する（references/completion-contract.md）。カバーのフェードと**重ねて**始めたい場合は `transitionend` を待たず `is-loaded` 付与直後に開始してよい。

## 調整ポイント

| パラメータ | 既定値 | 説明 |
|---|---|---|
| タイムアウト | 3000ms | 軽いページ前提なので短め。重くなってきたら変種 a / b への乗り換えを検討 |
| フェード時間 | 0.4〜0.6s | 短いほどキビキビ。1s 以上は間延びする |
| d-2 の対象セレクタ | ヒーロー画像のみ | ファーストビューに見えるものだけに絞るのがこの変種の趣旨。全画像を待つなら変種 b |
| 最低表示時間 | なし | この変種は「できるだけ早く開く」が正義なので設けない。チラつきが気になる場合のみ 300ms 程度の下限を追加 |
