# ユーティリティ型レイアウト体系

## 適用条件

写真ブロックが多く（目安 10+）、幅・列数・比率・gap の組合せが多様な LP に使う。`.content-block` をルートに、幅クラス・レイアウトクラス・モディファイアを HTML 側で合成する。組合せ表現力が高い代わりに、規律を失うと劣化しやすい（末尾のアンチパターン参照）。

## 前提トークン

lp-design-tokens スキルの標準トークン（--spacing-*, --content-width-mobile, --content-width-desktop）に加え、この体系専用の幅トークンを使う。未定義なら :root に追加する。

```css
:root {
  /* 幅プリセット（PC時の #main 比） */
  --content-width-narrow: 40%;
  --content-width-medium: 50%;
  --content-width-large: 60%;
  --content-width-wide: 70%;
  --content-width-full: 80%;
  --content-width-90v: 90%;
  --content-width-100v: 100%;
}
```

## CSS（完全コード）

```css
/* ============================================================
   コンテナ
============================================================ */
.main {
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
}

@media (width >= 768px) {
  .main {
    width: 90%;
    max-width: var(--content-width-desktop);
  }
}

/* ============================================================
   Content block（ブロック共通の余白）
============================================================ */
.content-block {
  position: relative;
  margin: var(--spacing-md) auto;
}

@media (width >= 768px) {
  .content-block {
    margin-block: var(--spacing-xl);
  }
}

/* ============================================================
   幅クラス（.content-block に併記）
============================================================ */
/* SP: narrow のみ 60%、他は 90% に収束させる */
.w-narrow {
  width: 60%;
}

.w-medium,
.w-large,
.w-wide,
.w-full {
  width: var(--content-width-mobile);
}

.w-90v {
  width: var(--content-width-90v);
}

.w-100v {
  width: var(--content-width-100v);
}

@media (width >= 768px) {
  .w-narrow {
    width: var(--content-width-narrow);
  }
  .w-medium {
    width: var(--content-width-medium);
  }
  .w-large {
    width: var(--content-width-large);
  }
  .w-wide {
    width: var(--content-width-wide);
  }
  .w-full {
    width: var(--content-width-full);
  }
}

/* ============================================================
   画像アイテム共通
============================================================ */
.image-item img {
  width: 100%;
  display: block;
}

.image-item a {
  -webkit-tap-highlight-color: transparent;
  position: relative;
  display: block;
  overflow: hidden;
}

/* 演出用フック（スクロールリビール等で scale した画像のはみ出しをクリップ） */
.photo {
  overflow: hidden;
}

/* ============================================================
   レイアウトクラス
============================================================ */
/* --- 単一画像（中央配置） --- */
.layout-single .image-gallery {
  display: flex;
  justify-content: center;
  align-items: center;
}

.layout-single .image-gallery .image-item {
  width: 100%;
}

/* --- 2 カラム（1 ギャラリー内に 2 枚） --- */
.layout-two-col .image-gallery {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5%;
}

.layout-two-col .image-gallery .image-item {
  flex: 1;
  min-width: 0;
}

@media (width >= 768px) {
  .layout-two-col .image-gallery {
    gap: var(--spacing-md);
  }
}

/* --- 2 ギャラリー横並び（静止画ギャラリー + カルーセル等） --- */
.layout-two-gallery {
  display: flex;
  gap: 5%;
}

.layout-two-gallery .image-gallery {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.layout-two-gallery .image-gallery .image-item {
  width: 100%;
}

@media (width >= 768px) {
  .layout-two-gallery {
    gap: var(--spacing-md);
  }
}

/* --- 画像 + クレジット横並び --- */
.layout-with-credit {
  display: flex;
  gap: var(--spacing-sm);
}

.layout-with-credit .image-gallery {
  flex: 1;
  min-width: 0;
}

.layout-with-credit .image-gallery .image-item {
  width: 100%;
}

.layout-with-credit .credit {
  flex: 0.6;
  display: flex;
  justify-content: center;
  align-items: center;
}

.layout-with-credit .credit .product-list {
  margin: 0 auto;
}

@media (width >= 768px) {
  .layout-with-credit {
    gap: var(--spacing-md);
  }
}

/* ============================================================
   モディファイア
============================================================ */
/* --- gap --- */
.gap-medium .image-gallery,
.gap-large .image-gallery {
  gap: 0.5rem;
}

@media (width >= 768px) {
  .gap-medium .image-gallery {
    gap: 1.75rem;
  }

  .gap-large .image-gallery {
    gap: 4rem;
  }
}

/* --- 比率（PC のみ。SP は flex: 1 の 50:50 に戻る） --- */
@media (width >= 768px) {
  .ratio-55-45 .image-gallery .item-1 {
    flex: 55;
  }
  .ratio-55-45 .image-gallery .item-2 {
    flex: 45;
  }

  .ratio-45-55 .image-gallery .item-1 {
    flex: 45;
  }
  .ratio-45-55 .image-gallery .item-2 {
    flex: 55;
  }

  /* 左縦長 / 右横長 等、アスペクト比差の補正に */
  .ratio-40-60 .image-gallery .item-1 {
    flex: 40;
  }
  .ratio-40-60 .image-gallery .item-2 {
    flex: 60;
  }

  .ratio-60-40 .image-gallery .item-1 {
    flex: 60;
  }
  .ratio-60-40 .image-gallery .item-2 {
    flex: 40;
  }
}

/* --- カラム内 2 枚並び --- */
/* item-1 内に 2 枚横並び（左カラム 2 枚、右カラム 1 枚） */
.item1-dual .image-gallery .item-1 {
  display: flex;
  gap: var(--spacing-xs);
}

/* item-2 内に 2 枚横並び（左カラム 1 枚、右カラム 2 枚） */
.item2-dual .image-gallery .item-2 {
  display: flex;
  gap: var(--spacing-xs);
}

/* --- カラム内側余白（画像を一回り小さく見せる） --- */
.item1-pad-lg .image-gallery .item-1 {
  padding: 5%;
}

@media (width >= 768px) {
  .item1-pad-lg .image-gallery .item-1 {
    padding: 8%;
  }

  .item2-pad-sm .image-gallery .item-2 {
    padding: 4%;
  }

  .item2-pad-md .image-gallery .item-2 {
    padding: 5%;
  }
}
```

## HTML 例

### 1. 単一画像（幅 narrow）

```html
<section class="content-block w-narrow layout-single" id="look-block-1">
  <div class="image-gallery">
    <div class="image-item item-1">
      <div class="photo">
        <a href="https://example.com/item/0001" target="_blank" rel="noopener">
          <img src="images/look_01.webp" alt="Look 1" width="1028" height="1371" loading="lazy" decoding="async" />
        </a>
      </div>
    </div>
  </div>
</section>
```

### 2. 2 枚横並び + 比率 55:45 + gap

```html
<section class="content-block w-wide layout-two-col ratio-55-45 gap-medium" id="look-block-2">
  <div class="image-gallery">
    <div class="image-item item-1">
      <div class="photo">
        <a href="https://example.com/item/0002" target="_blank" rel="noopener">
          <img src="images/look_02.webp" alt="Look 2 cut 1" width="1028" height="1371" loading="lazy" decoding="async" />
        </a>
      </div>
    </div>
    <div class="image-item item-2">
      <div class="photo">
        <a href="https://example.com/item/0003" target="_blank" rel="noopener">
          <img src="images/look_03.webp" alt="Look 2 cut 2" width="1028" height="1371" loading="lazy" decoding="async" />
        </a>
      </div>
    </div>
  </div>
</section>
```

### 3. 画像 + クレジット横並び

クレジットリスト（.product-list）自体の装飾・アニメーションは credit-list スキルを参照。

```html
<section class="content-block w-large layout-with-credit" id="look-block-3">
  <div class="image-gallery">
    <div class="image-item item-1">
      <div class="photo">
        <a href="https://example.com/item/0004" target="_blank" rel="noopener">
          <img src="images/look_04.webp" alt="Look 3" width="1028" height="1371" loading="lazy" decoding="async" />
        </a>
      </div>
    </div>
  </div>
  <div class="credit">
    <ul class="product-list">
      <li class="product-item item-1">
        <span class="product-name">Cardigan</span>
        <span class="product-price">¥00,000</span>
        <a href="https://example.com/item/0004" target="_blank" rel="noopener" class="product-action">CLICK</a>
      </li>
      <li class="product-item item-2">
        <span class="product-name">Skirt</span>
        <span class="product-price">¥00,000</span>
        <a href="https://example.com/item/0005" target="_blank" rel="noopener" class="product-action">CLICK</a>
      </li>
    </ul>
  </div>
</section>
```

### 4. 2 ギャラリー横並び（静止画 + カルーセル）

```html
<section class="content-block w-wide layout-two-gallery" id="look-block-4">
  <div class="image-gallery">
    <div class="image-item item-1">
      <div class="photo">
        <a href="https://example.com/item/0006" target="_blank" rel="noopener">
          <img src="images/look_05.webp" alt="Look 4 cut 1" width="1028" height="1371" loading="lazy" decoding="async" />
        </a>
      </div>
    </div>
  </div>
  <div class="image-gallery">
    <div class="swipe-gallery swiper">
      <div class="swiper-wrapper">
        <div class="swiper-slide">
          <div class="photo">
            <a href="https://example.com/item/0006" target="_blank" rel="noopener">
              <img src="images/look_06.webp" alt="Look 4 cut 2" width="1028" height="1371" loading="lazy" decoding="async" />
            </a>
          </div>
        </div>
        <div class="swiper-slide">
          <div class="photo">
            <a href="https://example.com/item/0006" target="_blank" rel="noopener">
              <img src="images/look_07.webp" alt="Look 4 cut 3" width="1028" height="1371" loading="lazy" decoding="async" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

## アンチパターン: ブロック固有 ID 上書き（禁止・教材）

実案件で、この体系の CSS が次の形で劣化した。**ブロック 1 個ごとに ID セレクタで padding / width / margin を上書きし、それが 21 ブロック × 数十行 = 数百行に膨張**。同じ padding 組合せが 6 ブロックにコピペされ、値の変更漏れ・SP 側の打ち消し忘れが頻発した。

```css
/* ❌ 悪い例（実際に数百行に膨張したパターン。禁止） */
#photo-block-12 .image-gallery .item-1 {
  padding: 96px;
  padding-right: 12px;
  padding-top: 0;
  padding-bottom: 0;
}

#photo-block-12 .image-gallery .item-2 {
  padding: 96px;
  padding-left: 12px;
  padding-top: 0;
  padding-bottom: 0;
}

@media (width < 768px) {
  #photo-block-12 .image-gallery .item-1 {
    padding: 15px;
    padding-right: 8px;
    /* …以下同型の打ち消しがブロック数ぶん続く… */
  }
}
```

```css
/* ✅ 良い例: 同じ見た目をモディファイアに昇格させ、HTML 側でクラスを付ける */
.cols-inset-lg .image-gallery {
  padding-inline: 4%;
}

.cols-inset-lg .image-gallery .item-1 {
  padding-right: 0.5rem;
}

.cols-inset-lg .image-gallery .item-2 {
  padding-left: 0.5rem;
}

@media (width >= 768px) {
  .cols-inset-lg .image-gallery {
    padding-inline: 8%;
  }

  .cols-inset-lg .image-gallery .item-1 {
    padding-right: 0.75rem;
  }

  .cols-inset-lg .image-gallery .item-2 {
    padding-left: 0.75rem;
  }
}
```

### モディファイア追加手順

1. 必要な見た目を「機能の言葉」で言語化する（例: 左右カラムの外側に大きな余白 → cols-inset-lg）
2. モディファイア節に汎用名で追加する。**SP 側の挙動も同時に定義する**（PC だけ書いて SP の打ち消しを後回しにしない）
3. 対象ブロックの HTML にクラスを追記する
4. 同じ内容の ID 上書きが既存 CSS にあれば、モディファイアに置換して削除する

### 例外の扱い

- どうしてもワンオフな調整（1 ブロック限り・再利用見込みなし）は、CSS 末尾に「例外」セクションを設けて隔離し、理由をコメントで残す
- 例外セクションがファイル全体の 1 割を超えたら、方式選定（SKILL.md の判断表）から見直す
