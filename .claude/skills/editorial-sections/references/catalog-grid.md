# catalog-grid — 商品サムネイル一覧グリッド

## 適用条件

商品を 1 点ずつ語らず「物量」で見せるサムネイルグリッド。上下 1px 罫線で挟んだ枠の中に 3 カラムで正方形サムネイルを敷き詰め、各サムネイルから商品ページへリンクする。ルック本編の後、EC ボタンの前に置くのが定番。

商品名・価格を添えて 1 点ずつ語りたい場合は credit-list スキル、写真を大きく組みたい場合は lp-section-layouts スキルを使う。

## 前提トークン

--content-width-mobile, --content-width-desktop, --spacing-xs/md/lg/xl, --color-rule（lp-design-tokens スキル参照）。

## CSS（完全コード / catalog.css）

```css
/* ----------------------------------------------------------------
 Catalog
----------------------------------------------------------------- */
.catalog {
  width: var(--content-width-mobile);
  max-width: var(--content-width-desktop);
  margin: 4rem auto;
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--color-rule);
  border-bottom: 1px solid var(--color-rule);
}

.catalog__grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md) 2%;
}

.catalog__item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.catalog__figure {
  margin: 0;
  overflow: hidden;
}

.catalog__figure a {
  display: block;
}

.catalog__figure img {
  width: 100%;
  height: auto;
  display: block;
}

@media (width >= 768px) {
  .catalog {
    width: 50%;
    margin: 8rem auto;
    padding: var(--spacing-xl) 0;
  }

  .catalog__grid {
    gap: var(--spacing-lg) var(--spacing-lg);
  }
}
```

## HTML 例

```html
<section class="catalog" aria-label="CATALOG">
  <ul class="catalog__grid">
    <li class="catalog__item" data-animate>
      <figure class="catalog__figure">
        <a
          href="https://example.com/products/XXX"
          target="_blank"
          rel="noopener"
        >
          <img
            src="src/assets/images/catalog/catalog_01.webp"
            alt="Catalog item 1"
            width="512"
            height="512"
            loading="lazy"
            decoding="async"
          />
        </a>
      </figure>
    </li>
    <li class="catalog__item" data-animate>
      <figure class="catalog__figure">
        <a
          href="https://example.com/products/XXX"
          target="_blank"
          rel="noopener"
        >
          <img
            src="src/assets/images/catalog/catalog_02.webp"
            alt="Catalog item 2"
            width="512"
            height="512"
            loading="lazy"
            decoding="async"
          />
        </a>
      </figure>
    </li>
    <!-- 以降 catalog_03, catalog_04, ... を同構造で繰り返す -->
  </ul>
</section>
```

## 運用メモ

- 元実装の罫線色は #000 ハードコードだったが、本ライブラリではトークン（--color-rule）参照に正規化している
- 上下 padding は元実装が `8vw` だったが、テンプレの stylelint 規約（padding / margin / gap は rem 必須・`vw` 禁止。`declaration-property-unit-allowed-list`）に抵触して `npm run lint` が落ちるため、spacing トークン（SP `--spacing-md` / PC `--spacing-xl`）に置換済み。**vw に戻さないこと**
- 画像は正方形（1:1）で書き出してもらうのが前提。比率が混在する支給の場合は `aspect-ratio: 1 / 1; object-fit: cover;` を .catalog__figure img に追加する
- 点数は 3 の倍数で揃うのが理想。端数が出る場合はそのままで良い（grid が左詰めで処理する）
- PC で `width: 50%` に絞っているのは「サムネイルはあくまで索引」という位置付けのため。カタログを主役にする案件では max-width 側を広げる
- 実案件での調整レバーは 2 つ。**サムネイルの大きさ = PC の `width`**（50% → 60% / 70% と一段ずつ広げる）、**詰まり具合 = PC の `gap`**。`--spacing-lg`(4rem) が空きすぎる場合は 3rem 前後の rem 直値でよい（トークン間の中間値はスケール外として許容）
- alt は「Catalog item N」の連番ではなく、可能なら品名（支給クレジットの NAME）を入れる
