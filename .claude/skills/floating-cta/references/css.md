# css — フローティング CTA の HTML / CSS（両変種共通）

## 適用条件

- references/gsap-scrolltrigger.md または references/intersection-observer.md と併用する
- JS は `.is-visible` クラスと `inert` 属性をトグルするだけ。見た目・アニメーションは全て CSS 側で持つ

## HTML（`</body>` 直前に置く）

```html
<div class="floating-cta">
  <a class="floating-cta__link" href="{{CTA_URL}}" target="_blank" rel="noopener">{{CTA_TEXT}}</a>
</div>
```

- `target="_blank"` を使う場合のみ `rel="noopener"` を付ける。同一ページ内アンカーなら `target` ごと外す
- スタイル・JS ともにクラス `.floating-cta` で参照する（ID は使わない）

## CSS（floating-cta.css）

出現アニメは blur-in / fade-in / slide-up の 3 種。コメントの指示に従って 1 つだけ有効化する:

```css
.floating-cta {
  position: fixed;
  left: 50%;
  bottom: 1.25rem;
  z-index: 100;
  width: 88%;
  max-width: 26rem;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);

  /* blur-in を選んだ場合のみ追加: filter: blur(8px); */
  /* slide-up を選んだ場合は上の transform を translate(-50%, 1.25rem) に置き換え */
  /* fade-in はこのままで良い（filter 行を追加しない） */

  @media (width >= 768px) {
    width: auto;
    max-width: none;
  }

  /* reduced-motion では transition を付けない = 表示/非表示は瞬時に切り替わる */
  @media (prefers-reduced-motion: no-preference) {
    transition:
      opacity 0.4s ease-out,
      filter 0.4s ease-out,
      transform 0.4s ease-out;
  }

  &.is-visible {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%);

    /* blur-in を選んだ場合のみ追加: filter: blur(0); */
    /* slide-up を選んだ場合は上の transform を translate(-50%, 0) に置き換え */
  }

  .floating-cta__link {
    display: block;
    padding: 0.9375rem 0.3125rem;
    border-radius: 3.125rem; /* ピル型。角丸(0.5rem) / 角なし(0) も可 */
    border: 2px solid #000;
    font-size: 1rem;
    letter-spacing: 0.1rem;
    text-align: center;
    text-decoration: none;
    color: #000;
    background-color: #fff;

    @media (width >= 768px) {
      padding: 1rem 5rem;
      transition:
        border-radius 0.2s ease-out,
        color 0.2s ease-out,
        background-color 0.2s ease-out;

      /* PC ホバー: 色反転 + 角丸解除。SP はこのメディアクエリ外なのでホバー無し */
      &:hover {
        color: #fff;
        background-color: #000;
        border-radius: 0;
      }
    }
  }
}
```

## 設計メモ

- **非表示は `opacity: 0` + `pointer-events: none` + JS の `inert`**: `display: none` にすると transition が効かない。`pointer-events: none` で誤タップを防ぎ、`inert`（JS 側でトグル）でフォーカス・読み上げを止める。`visibility` の制御は不要
- **配色・角丸はプロジェクトのトークンに置換してよい**: デザイントークン運用のプロジェクトでは `#000` / `#fff` を `var(--color-text)` / `var(--color-bg)`、`ease-out` を `var(--ease-out)` 等に読み替える
- **SP は幅 88% の全幅寄りピル、PC はコンテンツ幅**: SP で親指が届く画面下端センターに置く定番形。左右下コーナー固定にする場合は `left: auto; right: 1.25rem; transform: none;` に変更し、`is-visible` 側の transform も合わせて消す
- **transition を `@media (prefers-reduced-motion: no-preference)` 内に置く**: 表示・非表示の機能自体は残し、動きだけを無効化するための書き方。JS 側での分岐は不要になる
