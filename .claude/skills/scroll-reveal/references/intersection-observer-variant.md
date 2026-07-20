# IntersectionObserver + CSS クラス版（GSAP 不使用）

GSAP を入れていない軽量静的ページ向けのリビール実装。JS は「見えたらクラスを付けて監視解除する」だけで、動き自体はすべて CSS transition に任せる。jQuery プラグイン（inview 系）からの置き換え先としてもこの形にする。

適用条件: プロジェクトに GSAP を入れていない / 演出は単純フェード（+ 軽い移動）で十分 / バンドルを増やしたくない。GSAP を使うページでは使わない（SKILL.md「混在させない」参照）。

## CSS（global CSS に追加）

```css
/* JS 有効 + 動き許容のときだけ初期非表示にする。
   JS 無効・reduced-motion では最初から見える = コンテンツが消えない */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  [data-animate] {
    opacity: 0;
    translate: 0 30px;
    transition:
      opacity 0.8s ease-out,
      translate 0.8s ease-out;
    transition-delay: var(--animate-delay, 0s);
  }

  [data-animate].is-visible {
    opacity: 1;
    translate: 0 0;
  }
}
```

- transition を初期非表示と同じメディアクエリ内に置くことで、reduced-motion 環境では transition 自体が存在しない（= 即時表示）
- `translate` プロパティを使うと他の `transform`（scale 等）と競合しない。古いブラウザまで見る場合は `transform: translateY()` に置き換え可
- 個別遅延は `--animate-delay` カスタムプロパティで渡す（後述）

## JS（これだけで完結）

```js
// reveal.js
const initScrollReveal = () => {
  const targets = document.querySelectorAll("[data-animate]");
  if (targets.length === 0) return;

  // reduced-motion 時は CSS 側で初期非表示が無効なので、監視自体が不要
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target); // once: true 相当。逆スクロールで消えない
      }
    },
    {
      // ビューポート下端を 15% 内側に縮める = ScrollTrigger の "top 85%" 相当。
      // 既定のままだと要素が 1px 見えた瞬間に発火し、「動く前に見えてしまう」
      rootMargin: "0px 0px -15% 0px",
      threshold: 0,
    },
  );

  for (const el of targets) observer.observe(el);
};

document.addEventListener("DOMContentLoaded", initScrollReveal);
```

注記（元実装からの修正点）: 参考にした実装は `rootMargin` 未指定（= 1px 見えた瞬間に発火）だった。CSS の transition-delay で「見えてから動くまでの間」を作ってごまかせるが、発火ラインは observer 側で制御するほうが GSAP 版の `start` と考え方が揃うため、`rootMargin` 指定を標準とした。

## HTML

```html
<section>
  <figure data-animate>...</figure>

  <!-- 2 枚目を 0.3s 遅らせて時間差リビール -->
  <figure data-animate style="--animate-delay: 0.3s">...</figure>
</section>
```

- ファーストビュー内の要素には付けない（GSAP 版と同じルール。初期表示で不自然に動く）
- 遅延は CSS カスタムプロパティで渡すだけなので JS 側の分岐が不要

## GSAP 版との対応関係

| GSAP 版 | この版 | 備考 |
|---|---|---|
| `start: "top 85%"` | `rootMargin: "0px 0px -15% 0px"` | 下端 15% 縮小 = 85% ライン |
| `once: true` | `observer.unobserve()` | 発火後に監視解除 |
| `duration` / `ease` | CSS `transition` | 動きの質は CSS 管轄 |
| `delay` / `stagger` | `--animate-delay` | stagger は各要素に手動で段差を付ける |
| `ScrollTrigger.refresh()` | 不要 | observer は実位置を都度判定するため lazy 画像で位置がズレない |

lazy 画像による発火位置ズレ（drift）がこの方式では構造的に起きないのが最大の利点。逆に、タイムライン連携・スクラブ・ピン留めはできないので、要件が育ったら GSAP 版（references/animations-template.md）に乗り換える。

## 調整ポイント

| パラメータ | 既定値 | 説明 |
|---|---|---|
| `rootMargin` 下端 | -15% | -10%（早め）〜 -25%（しっかり見えてから）。SP は画面が短いので 0〜-10% に緩めることが多い |
| `transition` 時間 | 0.8s | 0.6〜2s。ゆったり見せる editorial 系は 1.5〜2s + delay 0.5s の組み合わせも定番 |
| `translate` 距離 | 30px | 0 にすれば純フェード。テキスト行は 5〜10px が自然 |
| `--animate-delay` | 0s | 同一行内の 2 枚目・3 枚目に 0.2〜0.4s 刻みで |

## 検品時の注意（GSAP 版チェックリストへの追加分）

- [ ] `rootMargin` に負のパーセントを指定した場合、`threshold: 0` のままであること（threshold を上げると縮めた root と組み合わさって発火しないことがある）
- [ ] 画面より背の高い要素（縦長画像等）が発火すること（root を縮めすぎると交差判定に一度も入らない場合がある。その要素だけ `rootMargin` を緩めた observer を分けるか、子要素に属性を付ける）
