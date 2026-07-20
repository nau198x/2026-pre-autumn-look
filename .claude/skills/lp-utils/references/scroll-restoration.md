# scroll-restoration — リロード時に必ずページ先頭から開始する

## 適用条件

入場アニメーション・プリローダー・ヒーロータイムラインがあるページで、リロード時にブラウザのスクロール位置復元が働くと「ページ中腹から再開して演出が空振りする」問題への対策。該当する演出があるページはほぼ必須。

ブラウザの復元は module スクリプトの実行より早いことがあるため、**head 内同期スクリプト + DOMContentLoaded 後の二重 rAF + beforeunload の多層防御**で入れる。

## 1. head 内同期スクリプト（index.html の <head> に直接記述）

```html
<!-- リロード時にスクロール位置を復元させない（module スクリプトでは遅すぎるため同期で設定） -->
<script>
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
</script>
```

## 2. main.js 側の防御層（完全コード）

```js
document.addEventListener("DOMContentLoaded", () => {
  // 防御層: ブラウザが DOMContentLoaded 後 1-2 フレームでスクロール復元する場合に備えて上書き
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  });

  // unload 時にスクロール位置を 0 に保存 → 次回 reload で復元される値自体を 0 にする
  window.addEventListener("beforeunload", () => {
    window.scrollTo(0, 0);
  });

  // ...以降、各セクションの init
});
```

## 運用メモ

- 3 層はそれぞれ役割が違う: head 同期＝復元自体の無効化（最速）、二重 rAF＝それでも復元されたフレームの上書き、beforeunload＝復元値そのものを 0 化。**どれか 1 つだけでは端末・ブラウザによってすり抜ける**
- ブラウザバックで「前回位置に戻りたい」要件のページ（縦長の読み物等）では beforeunload の 0 保存を外す。LP の入場演出ページでは通常そのままで良い
- プリローダー（lp-preloader スキル）併用時は、スクロールロック解除のタイミングとは独立に効く（競合しない）
- SPA 的なページ内遷移は無い前提（LP 用）。ルーターがあるサイトに持ち込む場合は scrollRestoration の扱いをルーター側に譲る
