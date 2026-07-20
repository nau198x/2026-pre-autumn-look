# staff-credit — 撮影スタッフクレジットセクション

## 適用条件

撮影スタッフ（Photographer / Stylist / Hair & Make / Model 等）のクレジットをページ終盤に載せるセクション。2 変種から選ぶ:

- **中央型**: 役職 + 氏名のリストだけで静かに締める。オフショット素材が無い・ミニマルに終えたい場合の既定
- **画像 + リスト型**: 締めに使えるオフショット写真が支給されている場合。写真をグレースケール化してリストと横並びにする

役職（role）は英語表記・uppercase・muted カラーが定番。氏名は支給クレジットの表記（綴り・順序・敬称）と完全一致させる。

> 命名注意: 実案件ではルートが .staff / .staffCredit / .staffcredit 等に揺れていた。本ライブラリでは **.staff-credit に統一**する。過去案件からコピーする場合も必ずこの命名に読み替えること。

## 前提トークン

--spacing-sm/md/lg, --color-muted（lp-design-tokens スキル参照）。

## 変種 1: 中央型

### CSS（完全コード / staff-credit.css）

```css
/* ----------------------------------------------------------------
 Staff Credit
----------------------------------------------------------------- */
.staff-credit {
  padding: 4rem var(--spacing-sm);
  text-align: center;
}

.staff-credit__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.staff-credit__item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.staff-credit__role {
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-muted);
  line-height: 2;
}

.staff-credit__name {
  font-size: 0.8rem;
  letter-spacing: 0.1em;
}

@media (width >= 768px) {
  .staff-credit {
    padding: 8rem var(--spacing-md);
  }

  .staff-credit__list {
    gap: var(--spacing-lg);
  }

  .staff-credit__role {
    font-size: 0.7rem;
  }

  .staff-credit__name {
    font-size: 0.9rem;
  }
}
```

### HTML 例

```html
<section class="staff-credit" aria-label="Staff Credits">
  <ul class="staff-credit__list" data-animate>
    <li class="staff-credit__item">
      <p class="staff-credit__role">Photographer</p>
      <p class="staff-credit__name">PHOTOGRAPHER NAME</p>
    </li>
    <li class="staff-credit__item">
      <p class="staff-credit__role">Stylist</p>
      <p class="staff-credit__name">STYLIST NAME</p>
    </li>
    <li class="staff-credit__item">
      <p class="staff-credit__role">Hair &amp; Make</p>
      <p class="staff-credit__name">HAIR MAKE NAME</p>
    </li>
    <li class="staff-credit__item">
      <p class="staff-credit__role">Model</p>
      <p class="staff-credit__name">MODEL NAME</p>
    </li>
  </ul>
</section>
```

## 変種 2: 画像 + リスト型（--with-image）

オフショット画像を左、クレジットリストを右端揃えで横並びにする。画像はグレースケール + わずかな透過で「本編の写真より一段引いた」トーンにするのが定番。

### CSS（完全コード / staff-credit.css に追記）

```css
/* ----------------------------------------------------------------
 Staff Credit (with image)
----------------------------------------------------------------- */
.staff-credit--with-image {
  display: flex;
  flex-direction: row-reverse;
  justify-content: center;
  align-items: end;
  gap: 1.5rem;
  margin: 7.5rem auto 2.5rem;
  padding: 0;
  text-align: right;
}

.staff-credit--with-image .staff-credit__image {
  flex: 0.88;
  margin: 0;
}

.staff-credit--with-image .staff-credit__image img {
  width: 100%;
  height: auto;
  filter: grayscale(100%);
  opacity: 0.8;
}

.staff-credit--with-image .staff-credit__list {
  flex: 0.48;
  gap: var(--spacing-sm);
}

.staff-credit--with-image .staff-credit__item {
  align-items: flex-end;
}

@media (width >= 768px) {
  .staff-credit--with-image {
    gap: 3.75rem;
    margin: 15rem auto 8.75rem;
  }

  .staff-credit--with-image .staff-credit__image {
    flex: 0.4;
  }

  .staff-credit--with-image .staff-credit__list {
    flex: none;
    flex-shrink: 0;
    gap: var(--spacing-md);
  }
}
```

### HTML 例

```html
<section class="staff-credit staff-credit--with-image" aria-label="Staff Credits">
  <figure class="staff-credit__image" data-animate>
    <img
      src="src/assets/images/staff_offshot.webp"
      alt=""
      width="800"
      height="1000"
      loading="lazy"
      decoding="async"
    />
  </figure>
  <ul class="staff-credit__list" data-animate>
    <li class="staff-credit__item">
      <p class="staff-credit__role">Photographer</p>
      <p class="staff-credit__name">PHOTOGRAPHER NAME</p>
    </li>
    <li class="staff-credit__item">
      <p class="staff-credit__role">Stylist</p>
      <p class="staff-credit__name">STYLIST NAME</p>
    </li>
    <li class="staff-credit__item">
      <p class="staff-credit__role">Model</p>
      <p class="staff-credit__name">MODEL NAME</p>
    </li>
  </ul>
</section>
```

## 運用メモ

- 元実装は非 BEM（.credit-image / .credit-content / .staff-role 直下クラス）だったため、本ライブラリで .staff-credit__\* に正規化している。デザインは同一
- 役職ラベルの英語表記は支給クレジットに従う（Hair & Make / HairMake / Hair and Make 等、案件で表記が違う。勝手に統一しない）
- オフショット画像は装飾扱いなら alt="" で良いが、モデル本人のポートレートとして意味を持つ場合は alt に人物説明を入れる
- 中央型 ⇔ 画像 + リスト型の切替は、ルートに --with-image を付け外しし、figure を追加 / 削除するだけで完結する
