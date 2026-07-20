# links-list — 全幅罫線行のリンクリスト

## 適用条件

EC・外部モール・スタッフスタイリング・SNS 等、複数の遷移先を**等価に**並べるセクション。リスト上端 + 各行下端に 1px 罫線を引き、PC では行全体が hover で黒背景 + 白文字に反転する。ページ終盤（staff-credit の後、footer の前）が定位置。

遷移先が 1 つだけなら ec-button を使う。ページ中腹に ec-button、終盤に links-list の併用も定番。

## 前提トークン

--spacing-md, --color-text, --color-bg（lp-design-tokens スキル参照）。

## CSS（完全コード / links.css）

```css
/* ----------------------------------------------------------------
 Links
----------------------------------------------------------------- */
.links {
  max-width: 720px;
  margin: 0 auto;
  padding: 4rem var(--spacing-md);
}

.links__list {
  border-top: 1px solid var(--color-text);
}

.links__item {
  border-bottom: 1px solid var(--color-text);
}

.links__link {
  display: block;
  padding: 1.25rem 0.5rem;
  text-align: center;
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  text-decoration: none;
}

@media (width >= 768px) {
  .links {
    padding: 6rem var(--spacing-md);
  }

  .links__item {
    transition: background 0.3s ease-out;
  }

  .links__link {
    padding: 1.75rem 1rem;
    font-size: 1rem;
    transition: color 0.3s ease-out;
  }

  .links__item:hover {
    background: var(--color-text);
  }

  .links__item:hover .links__link {
    color: var(--color-bg);
  }
}
```

## HTML 例

```html
<section class="links" aria-label="Related Links">
  <ul class="links__list" data-animate>
    <li class="links__item">
      <a class="links__link" href="https://example.com/" target="_blank" rel="noopener">Online Store</a>
    </li>
    <li class="links__item">
      <a class="links__link" href="https://example.com/products/" target="_blank" rel="noopener">{{BRAND_NAME}} ALL ITEMS</a>
    </li>
    <li class="links__item">
      <a class="links__link" href="https://example.com/styling/" target="_blank" rel="noopener">Staff Styling</a>
    </li>
    <li class="links__item">
      <a class="links__link" href="https://example.com/mall-a/" target="_blank" rel="noopener">外部モール A はこちら</a>
    </li>
    <li class="links__item">
      <a class="links__link" href="https://example.com/sns/" target="_blank" rel="noopener">Follow us</a>
    </li>
  </ul>
</section>
```

## 運用メモ

- hover 反転は @media (width >= 768px) 配下にあるためタッチ環境では発火しないが、hover 対応タブレット等を厳密にケアするなら `@media (hover: hover)` に載せ替えてよい
- 行数は 3〜6 行が読みやすい。それ以上になる場合はカテゴリで分けて links を 2 ブロックにする
- 外部モールへのリンク行は「◯◯はこちら」のような和文ラベルが混ざりがち。英語行と和文行が混在してもデザインは崩れないが、letter-spacing の見え方が変わるため実機で確認する
- ul 直下に li 以外を置かない（罫線が乱れる）。見出しを付けたい場合はセクション見出しとして .links の外側ではなく内側の先頭に h2 を追加し、罫線には含めない
