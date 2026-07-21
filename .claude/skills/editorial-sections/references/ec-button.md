# ec-button — オンラインストア誘導ボタン

## 適用条件

単一の遷移先（オンラインストア・特集ページ等）へ強く誘導する、中央配置の枠線ボタン。イタリック + letter-spacing のテキストを 1px 枠で囲み、hover で黒背景 + 白文字に反転する。ページ中腹（ルック群の区切り）と終盤の 2 箇所に置く構成が定番。

遷移先が複数あるなら links-list を使う。

## 前提トークン

--content-width-mobile, --spacing-sm, --color-rule, --color-link, --color-text, --color-bg, --ease-out（lp-design-tokens スキル参照）。

## CSS（完全コード / ec.css）

```css
/* ----------------------------------------------------------------
 EC store link
----------------------------------------------------------------- */
.ec {
  display: flex;
  justify-content: center;
  width: var(--content-width-mobile);
  margin: 3rem auto;

  @media (width >= 768px) {
    width: 100%;
    margin: 5rem auto;
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

## HTML 例

```html
<section class="ec" aria-label="オンラインストア" data-animate>
  <a class="ec__link" href="https://example.com/" target="_blank" rel="noopener"
    >ONLINE STORE</a
  >
</section>
```

## 運用メモ

- ボタンラベルは「ONLINE STORE」「VIEW ALL ITEMS」等の英語大文字が定番。イタリックが不要なブランドトーンなら font-style を外すだけでよい
- 同一ページに 2 箇所置く場合、ラベルを変える（中腹「ONLINE STORE」/ 終盤「VIEW ALL ITEMS」等）とクリック計測を分けやすい
- 上下マージンは上下共通（SP 3rem / PC 5rem）を既定とし、**隣接セクションに応じて調整する**。直前に lead 等のテキストセクションがあると、そのセクションの下パディングと二重になり上が空きすぎる（実例: lead 下 4rem + 旧 ec 上 10rem = 14rem）ので、その場合はこの控えめ値でよい。逆に前後がフルブリード画像で余白ゼロなら大きめ（PC 8〜10rem）に広げる
- PC の min-width: 30rem（480px）はこの見た目の要。ラベルが長くて折り返す場合は min-width を広げるのではなく padding 側で調整する
- text-decoration は base.css のリセットで消えている前提。リセットが無い環境では .ec__link に text-decoration: none を追加する
- hover 反転は透明背景だと効かないため、background-color: var(--color-bg) を必ず持たせる（ヒーロー画像上に重ねる場合など）
