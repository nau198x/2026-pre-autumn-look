# 名前付きパターン型レイアウト

## 適用条件

ルックのレイアウトが 3〜4 種の固定パターンの反復で構成できる LP に使う。`.look` をルートクラスとし、`.look--pattern-a / -b / -c` のモディファイアで完成形を切り替える。1 ファイル（look.css）で完結し、HTML 側の組合せ判断が不要なぶん、ページ全体の統一感が保ちやすい。

- **pattern-a**: 画像 2 枚横並び（グリッド）+ 右寄せクレジット
- **pattern-b**: PC はテキスト（左）と画像（右）の 2 カラム + 下段クレジット、SP は画像 → テキスト → クレジットの縦積み
- **pattern-c**: 画像 1 枚を中央配置（非トリミング・元比率のまま）+ 下にクレジット

## 前提トークン

--content-width-desktop, --spacing-xs/sm/md/lg, --color-text, --color-bg, --ease-out（lp-design-tokens スキル参照）。

## CSS（完全コード / look.css）

```css
/* ----------------------------------------------------------------
 Look — 共通
----------------------------------------------------------------- */
.look {
  max-width: var(--content-width-desktop);
  margin: 0 auto;
  padding: 2rem 0;
}

.look__image {
  display: block;
  overflow: hidden;
}

.look__image img {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 5 / 6; /* 統一トリミング比。素材に合わせて調整 */
  object-fit: cover;
  transition: filter 1s var(--ease-out);
}

/* JS のスクロールリビール演出で opacity を戻す前提の初期非表示。
   演出を実装しない場合はこのブロックごと削除する */
@media (scripting: enabled) {
  .look__image img {
    opacity: 0;
  }

  .look--pattern-b .look__description {
    opacity: 0;
  }

  .look__credits {
    opacity: 0;
  }
}

.look__credit-name,
.look__credit-price {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.look__credit-name {
  text-align: right;
}

/* 主役アイテムのクレジット行のみ太字で強調 */
.look__credit--featured .look__credit-name,
.look__credit--featured .look__credit-price {
  font-weight: 700;
}

/* グループ見出し（RIGHT / LEFT 等）— 同じ ul 内に li として混在させる */
.look__credit-label {
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-align: right;
}

.look__credit-label:not(:first-child) {
  margin-top: var(--spacing-sm);
}

.look__click {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 0.3rem 0.75rem;
  background: var(--color-text);
  color: var(--color-bg);
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  text-decoration: none;
}

@media (width >= 768px) {
  .look {
    padding: 4rem var(--spacing-md);
  }

  .look__credit-name,
  .look__credit-price {
    font-size: 1rem;
  }

  .look__credit-label {
    font-size: 0.85rem;
  }

  .look__click {
    min-width: 96px;
    padding: 0.4rem 1rem;
    font-size: 0.9rem;
    transition:
      background 0.2s ease-out,
      color 0.2s ease-out;
  }

  .look__click:hover {
    background: var(--color-bg);
    color: var(--color-text);
    outline: 1px solid var(--color-text);
    outline-offset: -1px;
  }

  .look__image:hover img {
    filter: brightness(0.85);
  }
}

/* ----------------------------------------------------------------
 Look — パターンA: 画像 2 枚横並び + 右寄せクレジット
----------------------------------------------------------------- */
.look--pattern-a .look__images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xs);
}

.look--pattern-a .look__credits {
  width: 100%;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-sm);
}

.look--pattern-a .look__credit {
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  gap: var(--spacing-sm);
}

@media (width >= 768px) {
  .look--pattern-a .look__images {
    gap: var(--spacing-sm);
  }

  .look--pattern-a .look__credits {
    width: 50%;
    margin-top: var(--spacing-md);
    margin-left: auto;
    align-items: stretch;
    gap: var(--spacing-sm);
    padding: 0 0 0 var(--spacing-sm);
  }

  .look--pattern-a .look__credit {
    grid-template-columns: 1fr auto auto;
  }
}

/* ----------------------------------------------------------------
 Look — パターンB: PC 横並び（左テキスト / 右画像）+ 下にクレジット、
                   SP 縦積み（画像 / テキスト / クレジット）
----------------------------------------------------------------- */
.look--pattern-b {
  display: grid;
  grid-template-areas:
    "images"
    "text"
    "credits";
  gap: var(--spacing-md);
}

.look--pattern-b .look__images {
  grid-area: images;
}

.look--pattern-b .look__text {
  grid-area: text;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-sm);
}

.look--pattern-b .look__heading {
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.05em;
}

.look--pattern-b .look__description {
  font-size: 0.8rem;
  line-height: 1.9;
  letter-spacing: 0.05em;
}

.look--pattern-b .look__credits {
  grid-area: credits;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-sm);
}

.look--pattern-b .look__credit {
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  gap: var(--spacing-sm);
}

@media (width >= 768px) {
  .look--pattern-b {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "text images"
      "credits credits";
    column-gap: var(--spacing-lg);
    row-gap: var(--spacing-md);
    align-items: center;
  }

  .look--pattern-b .look__text {
    padding: 0;
    gap: var(--spacing-md);
  }

  .look--pattern-b .look__heading {
    font-size: 1.75rem;
  }

  .look--pattern-b .look__description {
    font-size: 1rem;
    line-height: 2;
  }

  .look--pattern-b .look__credits {
    width: 50%;
    margin-left: auto;
    align-items: stretch;
    gap: var(--spacing-sm);
    padding: 0 0 0 var(--spacing-sm);
  }

  .look--pattern-b .look__credit {
    grid-template-columns: 1fr auto auto;
  }
}

/* ----------------------------------------------------------------
 Look — パターンC: 画像 1 枚センター配置 + 下にクレジット
----------------------------------------------------------------- */
.look--pattern-c {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.look--pattern-c .look__images {
  display: flex;
  justify-content: center;
}

.look--pattern-c .look__image {
  width: 100%;
  max-width: 480px;
}

/* パターンC は画像をクロップせず元の比率で表示 */
.look--pattern-c .look__image img {
  aspect-ratio: auto;
  height: auto;
  object-fit: initial;
}

.look--pattern-c .look__credits {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-sm);
}

.look--pattern-c .look__credit {
  display: grid;
  grid-template-columns: auto auto auto;
  align-items: center;
  gap: var(--spacing-sm);
}

@media (width >= 768px) {
  .look--pattern-c .look__image {
    max-width: 680px;
  }

  .look--pattern-c .look__credits {
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    align-items: stretch;
    gap: var(--spacing-sm);
    padding: 0;
  }

  .look--pattern-c .look__credit {
    grid-template-columns: 1fr auto auto;
  }
}
```

## HTML 例

### パターンA（2 枚横並び + クレジット）

```html
<section class="look look--pattern-a" id="look-1" aria-label="Look 1">
  <div class="look__images">
    <a class="look__image" href="https://example.com/item/0001" target="_blank" rel="noopener" aria-label="ITEM NAME">
      <img src="images/look_1.webp" alt="Look 1 cut 1" decoding="async" width="800" height="960" loading="lazy" />
    </a>
    <a class="look__image" href="https://example.com/item/0001" target="_blank" rel="noopener" aria-label="ITEM NAME">
      <img src="images/look_2.webp" alt="Look 1 cut 2" decoding="async" width="800" height="960" loading="lazy" />
    </a>
  </div>
  <ul class="look__credits">
    <li class="look__credit look__credit--featured">
      <span class="look__credit-name">ITEM NAME</span>
      <span class="look__credit-price">¥00,000</span>
      <a class="look__click" href="https://example.com/item/0001" target="_blank" rel="noopener" aria-label="ITEM NAME をオンラインストアで見る">CLICK</a>
    </li>
    <li class="look__credit">
      <span class="look__credit-name">PULLOVER</span>
      <span class="look__credit-price">¥00,000</span>
      <a class="look__click" href="https://example.com/item/0002" target="_blank" rel="noopener" aria-label="PULLOVER をオンラインストアで見る">CLICK</a>
    </li>
  </ul>
</section>
```

グループ見出し（左右 2 体制のルック等）を入れる場合は、同じ ul 内に次の li を挟む。

```html
<li class="look__credit-label">LEFT</li>
```

### パターンB（テキスト + 画像分割）

```html
<section class="look look--pattern-b" id="look-2" aria-label="Look 2 — ITEM NAME">
  <div class="look__text">
    <h3 class="look__heading">ITEM NAME</h3>
    <p class="look__description" lang="ja">
      商品の説明文をここに入れる。素材感・使い勝手・シーン提案などを 3〜5 文で。
    </p>
  </div>
  <div class="look__images">
    <a class="look__image" href="https://example.com/item/0003" target="_blank" rel="noopener" aria-label="ITEM NAME">
      <img src="images/look_3.webp" alt="ITEM NAME 詳細" decoding="async" width="800" height="960" loading="lazy" />
    </a>
  </div>
  <ul class="look__credits">
    <li class="look__credit look__credit--featured">
      <span class="look__credit-name">ITEM NAME</span>
      <span class="look__credit-price">¥00,000</span>
      <a class="look__click" href="https://example.com/item/0003" target="_blank" rel="noopener" aria-label="ITEM NAME をオンラインストアで見る">CLICK</a>
    </li>
  </ul>
</section>
```

### パターンC（中央 1 枚・非トリミング）

```html
<section class="look look--pattern-c" id="look-3" aria-label="Look 3">
  <div class="look__images">
    <a class="look__image" href="https://example.com/item/0004" target="_blank" rel="noopener" aria-label="ITEM NAME">
      <img src="images/look_4.webp" alt="Look 3" decoding="async" width="1024" height="768" loading="lazy" />
    </a>
  </div>
  <ul class="look__credits">
    <li class="look__credit look__credit--featured">
      <span class="look__credit-name">ITEM NAME</span>
      <span class="look__credit-price">¥00,000</span>
      <a class="look__click" href="https://example.com/item/0004" target="_blank" rel="noopener" aria-label="ITEM NAME をオンラインストアで見る">CLICK</a>
    </li>
  </ul>
</section>
```

## 運用メモ

- 横位置（ランドスケープ）素材はパターンC に置くと画面上のリズムが変わり、縦位置 2 枚のパターンA との交互配置で単調さを防げる
- パターンの追加は「--pattern-d」を定義してから使う。1 ページ限りの微調整で既存パターンを ID 上書きしない（SKILL.md の劣化防止ルール参照）
- クレジット部は 3 パターンとも同一構造（.look__credits > .look__credit）なので、商品差し替え時はパターンをまたいでコピペできる
