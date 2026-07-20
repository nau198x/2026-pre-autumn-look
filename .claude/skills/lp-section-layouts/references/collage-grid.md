# grid-area コラージュ型レイアウト

## 適用条件

雑誌的なコラージュ配置（中央 1 枚を上下で挟む、モザイク、タイル + 全幅など）が必要な LP に使う。`.look` をセクションルート、`.look__item` を 1 ルック単位とし、`grid-template-areas` で組んだ「名前付きレイアウト語彙」をモディファイア（`.look__item--grid-duo` 等）で切り替える。各画像はセル名モディファイア（`.look__image-link--row1a` 等）で担当エリアに割り当てる。

行をまたぐ変則配置や、PC / SP でエリア構成そのものが入れ替わるレイアウトを、HTML の並び順を変えずに実現できるのがこの方式の強み。

## 命名の注記（正規化済み）

参照元の実装は CSS Modules 流儀の camelCase（`.look__item--gridDuo`、`.look__imageLink--row1a` 等）だったが、本ライブラリの BEM 規約（kebab-case）に合わせて **`--grid-duo` / `.look__image-link--row1a` 形式に正規化して収録している**。camelCase 命名の過去案件からコピーする際は読み替えること。

## 前提トークン

--content-width-desktop, --color-text（lp-design-tokens スキル参照）。セル間 gap は 0.5rem / 1rem の直値で統一している。

## レイアウト語彙一覧

| モディファイア | 構成 | セル名 |
|---|---|---|
| --grid-duo | 2 カラム。SP: 上段 2 枚 → 右下 1 枚 → クレジット全幅 / PC: 左下がクレジット | --1, --2, --3 |
| --center-stack | 上段 2 枚 → 全幅 1 枚 → クレジット → 全幅 1 枚 | --row1a, --row1b, --center1, --center2 |
| --center-duo | 中央 1 枚（幅 60% → PC 50%）→ 下段 2 枚 → クレジット | --center, --row2a, --row2b |
| --mosaic-stack | 全幅 1 枚 → 2 枚並び → クレジット → 中央 1 枚。PC は左右に 5% のマージン列 | --top, --left, --right, --center |
| --sandwich-duo | 2 枚 → 中央 1 枚（挟み込み）→ 2 枚 → クレジット | --row1a, --row1b, --center, --row3a, --row3b |
| --tile-stack | タイル 4 枚（2×2）→ クレジット → 中央 1 枚。PC は左右に 10% のマージン列 | --tile1〜4, --center |

新パターンを足すときは、見た目の形容ではなく構成の説明で命名し（SKILL.md の命名規約参照）、この表に追記してから使う。

## CSS（完全コード / look.css）

```css
/* ----------------------------------------------------------------
 Look — コラージュグリッド共通
----------------------------------------------------------------- */
.look {
  position: relative;
  padding: 4rem 1rem;
}

/* セクション先頭の罫線。--line-scale は JS 演出用（後述） */
.look::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(var(--line-scale, 1));
  transform-origin: left center;
  width: calc(100vw - 2rem);
  height: 1px;
  background: var(--color-text);
}

.look__item {
  max-width: var(--content-width-desktop);
  margin-inline: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

/* ルック間の区切り罫線 */
.look__item + .look__item {
  position: relative;
  margin-top: 3rem;
  padding-top: 3rem;
}

.look__item + .look__item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(var(--line-scale, 1));
  transform-origin: left center;
  width: calc(100vw - 2rem);
  height: 1px;
  background: var(--color-text);
}

/* 罫線を左→右に描き出すスクロール演出（GSAP 等で --line-scale を 0→1 に
   アニメーションさせる）を実装する場合の初期状態。演出しないなら削除する */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  .look,
  .look__item:not(:first-child) {
    --line-scale: 0;
  }
}

.look__image-link {
  display: block;
  position: relative;
  min-width: 0;
}

.look__image {
  display: block;
  width: 100%;
  height: auto;
}

.look__credit {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.75rem;
}

.look__credit-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 1.5rem;
}

.look__credit-name {
  flex: 1;
  min-width: 0;
}

.look__credit-link {
  text-decoration: underline;
  letter-spacing: 0.05em;
}

@media (width >= 768px) {
  .look {
    padding: 6rem 2rem;
  }

  .look::before,
  .look__item + .look__item::before {
    width: calc(100vw - 4rem);
  }

  .look__item {
    gap: 1rem;
  }

  .look__item + .look__item {
    margin-top: 6rem;
    padding-top: 6rem;
  }

  .look__credit {
    gap: 1rem;
    font-size: 0.875rem;
  }
}

@media (width >= 1024px) {
  .look {
    padding: 8rem 3rem;
  }

  .look::before,
  .look__item + .look__item::before {
    width: calc(100vw - 6rem);
    max-width: var(--content-width-desktop);
  }
}

/* ----------------------------------------------------------------
 --grid-duo: 2×2。SP は右下 1 枚 + クレジット全幅、PC は左下がクレジット
----------------------------------------------------------------- */
.look__item--grid-duo {
  grid-template-areas:
    "img1 img2"
    ".    img3"
    "credit credit";
}

.look__item--grid-duo > .look__image-link--1 {
  grid-area: img1;
}

.look__item--grid-duo > .look__image-link--2 {
  grid-area: img2;
}

.look__item--grid-duo > .look__image-link--3 {
  grid-area: img3;
}

.look__item--grid-duo > .look__credit {
  grid-area: credit;
  margin-top: 1.5rem;
  width: 95%;
  justify-self: center;
}

@media (width >= 768px) {
  .look__item--grid-duo {
    grid-template-areas:
      "img1   img2"
      "credit img3";
  }

  .look__item--grid-duo > .look__credit {
    margin-top: 0;
    width: auto;
    justify-self: auto;
  }
}

/* ----------------------------------------------------------------
 --center-stack: 上段 2 枚 → 全幅 1 枚 → クレジット → 全幅 1 枚
----------------------------------------------------------------- */
.look__item--center-stack {
  column-gap: 0;
  grid-template-areas:
    "row1a   row1b"
    "center1 center1"
    "credit  credit"
    "center2 center2";
}

.look__item--center-stack > .look__image-link--row1a {
  grid-area: row1a;
}

.look__item--center-stack > .look__image-link--row1b {
  grid-area: row1b;
}

.look__item--center-stack > .look__image-link--center1 {
  grid-area: center1;
  width: 100%;
  justify-self: center;
}

.look__item--center-stack > .look__image-link--center2 {
  grid-area: center2;
  width: 100%;
  justify-self: center;
}

.look__item--center-stack > .look__credit {
  grid-area: credit;
  margin-block: 2rem;
  width: 95%;
  justify-self: center;
}

@media (width >= 768px) {
  .look__item--center-stack > .look__image-link--center2 {
    width: 90%;
  }

  .look__item--center-stack > .look__credit {
    margin-block: 4rem;
    width: 50%;
  }
}

/* ----------------------------------------------------------------
 --center-duo: 中央 1 枚 → 下段 2 枚 → クレジット
----------------------------------------------------------------- */
.look__item--center-duo {
  grid-template-areas:
    "center center"
    "row2a  row2b"
    "credit credit";
}

.look__item--center-duo > .look__image-link--center {
  grid-area: center;
  width: 60%;
  justify-self: center;
}

.look__item--center-duo > .look__image-link--row2a {
  grid-area: row2a;
}

.look__item--center-duo > .look__image-link--row2b {
  grid-area: row2b;
}

.look__item--center-duo > .look__credit {
  grid-area: credit;
  margin-block: 2rem;
  margin-bottom: 0;
  width: 95%;
  justify-self: center;
}

@media (width >= 768px) {
  .look__item--center-duo > .look__image-link--center {
    width: 50%;
  }

  .look__item--center-duo > .look__credit {
    margin-block: 4rem;
    width: 50%;
  }
}

/* ----------------------------------------------------------------
 --mosaic-stack: 全幅 1 枚 → 2 枚並び → クレジット → 中央 1 枚
 PC では左右にマージン列（5%）を取り本文より一回り狭く見せる
----------------------------------------------------------------- */
.look__item--mosaic-stack {
  grid-template-columns: 0 50% 50% 0;
  gap: 0;
  grid-template-areas:
    ".      top    top    ."
    ".      left   right  ."
    "credit credit credit credit"
    "center center center center";
}

.look__item--mosaic-stack > .look__image-link--top {
  grid-area: top;
}

.look__item--mosaic-stack > .look__image-link--left {
  grid-area: left;
}

.look__item--mosaic-stack > .look__image-link--right {
  grid-area: right;
}

/* 任意の演出: 1 セルだけモノクロにして誌面的な緩急を付ける。不要なら削除 */
.look__item--mosaic-stack > .look__image-link--right .look__image {
  filter: grayscale(100%);
}

.look__item--mosaic-stack > .look__image-link--center {
  grid-area: center;
  width: 60%;
  justify-self: center;
}

.look__item--mosaic-stack > .look__credit {
  grid-area: credit;
  margin-block: 2rem;
  width: 95%;
  justify-self: center;
}

@media (width >= 768px) {
  .look__item--mosaic-stack {
    grid-template-columns: 5% 45% 45% 5%;
  }

  .look__item--mosaic-stack > .look__image-link--center {
    width: 50%;
  }

  .look__item--mosaic-stack > .look__credit {
    margin-block: 4rem;
    width: 50%;
  }
}

/* ----------------------------------------------------------------
 --sandwich-duo: 2 枚 → 中央 1 枚（挟み込み）→ 2 枚 → クレジット
----------------------------------------------------------------- */
.look__item--sandwich-duo {
  column-gap: 0;
  grid-template-areas:
    "row1a  row1b"
    "center center"
    "row3a  row3b"
    "credit credit";
}

.look__item--sandwich-duo > .look__image-link--row1a {
  grid-area: row1a;
}

.look__item--sandwich-duo > .look__image-link--row1b {
  grid-area: row1b;
}

.look__item--sandwich-duo > .look__image-link--row3a {
  grid-area: row3a;
}

.look__item--sandwich-duo > .look__image-link--row3b {
  grid-area: row3b;
}

.look__item--sandwich-duo > .look__image-link--center {
  grid-area: center;
  width: 60%;
  justify-self: center;
}

.look__item--sandwich-duo > .look__credit {
  grid-area: credit;
  margin-top: 2rem;
  width: 95%;
  justify-self: center;
}

@media (width >= 768px) {
  .look__item--sandwich-duo > .look__image-link--center {
    width: 50%;
  }

  .look__item--sandwich-duo > .look__credit {
    margin-top: 4rem;
    width: 50%;
  }
}

/* ----------------------------------------------------------------
 --tile-stack: タイル 4 枚（2×2）→ クレジット → 中央 1 枚
 PC では左右にマージン列（10%）
----------------------------------------------------------------- */
.look__item--tile-stack {
  grid-template-columns: 0 50% 50% 0;
  gap: 0;
  grid-template-areas:
    ".      tile1  tile2  ."
    ".      tile3  tile4  ."
    "credit credit credit credit"
    "center center center center";
}

.look__item--tile-stack > .look__image-link--tile1 {
  grid-area: tile1;
}

.look__item--tile-stack > .look__image-link--tile2 {
  grid-area: tile2;
}

.look__item--tile-stack > .look__image-link--tile3 {
  grid-area: tile3;
}

.look__item--tile-stack > .look__image-link--tile4 {
  grid-area: tile4;
}

.look__item--tile-stack > .look__image-link--center {
  grid-area: center;
  width: 60%;
  justify-self: center;
}

.look__item--tile-stack > .look__credit {
  grid-area: credit;
  margin-block: 2rem;
  width: 95%;
  justify-self: center;
}

@media (width >= 768px) {
  .look__item--tile-stack {
    grid-template-columns: 10% 40% 40% 10%;
  }

  .look__item--tile-stack > .look__image-link--center {
    width: 50%;
  }

  .look__item--tile-stack > .look__credit {
    margin-block: 4rem;
    width: 50%;
  }
}
```

## HTML 例

### --grid-duo

```html
<section class="look" aria-label="Looks">
  <article id="look-1" class="look__item look__item--grid-duo">
    <a class="look__image-link look__image-link--1" href="https://example.com/item/0001" target="_blank" rel="noopener" aria-label="Look 1 cut 1">
      <img class="look__image" src="src/assets/images/look/look1_row1_left.webp" alt="Look 1 cut 1" width="1028" height="1371" loading="lazy" decoding="async" />
    </a>
    <a class="look__image-link look__image-link--2" href="https://example.com/item/0001" target="_blank" rel="noopener" aria-label="Look 1 cut 2">
      <img class="look__image" src="src/assets/images/look/look1_row1_right.webp" alt="Look 1 cut 2" width="1028" height="1371" loading="lazy" decoding="async" />
    </a>
    <a class="look__image-link look__image-link--3" href="https://example.com/item/0002" target="_blank" rel="noopener" aria-label="Look 1 cut 3">
      <img class="look__image" src="src/assets/images/look/look1_row2_right.webp" alt="Look 1 cut 3" width="1028" height="1371" loading="lazy" decoding="async" />
    </a>
    <div class="look__credit">
      <p class="look__credit-item">
        <span class="look__credit-name">Jacket</span>
        <span class="look__credit-price">¥00,000</span>
        <a class="look__credit-link" href="https://example.com/item/0001" target="_blank" rel="noopener">CHECK</a>
      </p>
      <p class="look__credit-item">
        <span class="look__credit-name">Pants</span>
        <span class="look__credit-price">¥00,000</span>
        <a class="look__credit-link" href="https://example.com/item/0002" target="_blank" rel="noopener">CHECK</a>
      </p>
    </div>
  </article>
</section>
```

### --center-stack

```html
<article id="look-2" class="look__item look__item--center-stack">
  <a class="look__image-link look__image-link--row1a" href="https://example.com/item/0003" target="_blank" rel="noopener" aria-label="Look 2 cut 1">
    <img class="look__image" src="src/assets/images/look/look2_row1_left.webp" alt="Look 2 cut 1" width="1028" height="1371" loading="lazy" decoding="async" />
  </a>
  <a class="look__image-link look__image-link--row1b" href="https://example.com/item/0003" target="_blank" rel="noopener" aria-label="Look 2 cut 2">
    <img class="look__image" src="src/assets/images/look/look2_row1_right.webp" alt="Look 2 cut 2" width="1028" height="1371" loading="lazy" decoding="async" />
  </a>
  <a class="look__image-link look__image-link--center1" href="https://example.com/item/0003" target="_blank" rel="noopener" aria-label="Look 2 cut 3">
    <img class="look__image" src="src/assets/images/look/look2_row2_center.webp" alt="Look 2 cut 3" width="1028" height="770" loading="lazy" decoding="async" />
  </a>
  <div class="look__credit">
    <p class="look__credit-item">
      <span class="look__credit-name">Shirt</span>
      <span class="look__credit-price">¥00,000</span>
      <a class="look__credit-link" href="https://example.com/item/0003" target="_blank" rel="noopener">CHECK</a>
    </p>
  </div>
  <a class="look__image-link look__image-link--center2" href="https://example.com/item/0004" target="_blank" rel="noopener" aria-label="Look 2 cut 4">
    <img class="look__image" src="src/assets/images/look/look2_row4_center.webp" alt="Look 2 cut 4" width="1028" height="1371" loading="lazy" decoding="async" />
  </a>
</article>
```

他のパターンも同じ要領: `article.look__item.look__item--パターン名` の直下に、語彙一覧表のセル名モディファイアを付けた `.look__image-link` と `.look__credit` を（表示順どおりに）並べるだけでよい。HTML の並び順と表示位置は grid-template-areas 側が決めるため、DOM 順は原則「読み上げ順（上から下）」を保つ。

## セルを Swiper カルーセルに置き換える

任意のセルは同じ grid-area を割り当てた Swiper コンテナに置き換えられる。カルーセル化するセルは高さが画像で決まらないため、aspect-ratio でセルの箱を確定させるのが要点。

```css
.look__item--grid-duo > .look__swiper {
  grid-area: img2; /* 置き換えたいセルのエリア名 */
  width: 100%;
  min-width: 0;
  min-height: 0;
  aspect-ratio: 3 / 4; /* 素材の比率に合わせる */
}

.look__swiper .look__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

```html
<div class="swiper look__swiper">
  <div class="swiper-wrapper">
    <div class="swiper-slide">
      <a class="look__image-link" href="https://example.com/item/0001" target="_blank" rel="noopener" aria-label="Look 1 alternate cut 1">
        <img class="look__image" src="src/assets/images/look/look1_sw_1.webp" alt="Look 1 alternate cut 1" width="1028" height="1371" loading="lazy" decoding="async" />
      </a>
    </div>
    <div class="swiper-slide">
      <a class="look__image-link" href="https://example.com/item/0001" target="_blank" rel="noopener" aria-label="Look 1 alternate cut 2">
        <img class="look__image" src="src/assets/images/look/look1_sw_2.webp" alt="Look 1 alternate cut 2" width="1028" height="1371" loading="lazy" decoding="async" />
      </a>
    </div>
  </div>
</div>
```

Swiper の初期化・fade 等のオプションは swiper-hero-carousel スキルの規約に従う。

## 運用メモ

- グリッドの直下の子（`>`）に対してのみ grid-area を割り当てているため、セルの中に装飾用ラッパーを挟むとエリア割当が外れる。ラッパーが必要な場合はラッパー自身にセル名モディファイアを移す
- マージン列（--mosaic-stack の 5%、--tile-stack の 10%）は「本文幅よりわずかに狭い」誌面の版面率を作るための列。SP では 0 にして全幅を使う
- クレジットの罫線演出付きリスト（NAME / PRICE / CLICK の 3 点構成）が必要な場合は credit-list スキルの `.credit-list` に差し替えてよい
- 罫線演出（--line-scale）を使う場合、JS 側は各罫線要素の `--line-scale` を ScrollTrigger で 0→1 にアニメーションさせる。演出を使わないなら scripting ガードのブロックを削除すれば罫線は常時表示になる
