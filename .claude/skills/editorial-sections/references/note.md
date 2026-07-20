# note — 商品見出し + 解説文セクション

## 適用条件

特定の商品・トピックを文章で解説するセクション。見出し（.note__heading）+ 本文（.note__body）の左揃え構成で、写真ブロック（look）の合間に何度でも繰り返し置ける。ページ冒頭の世界観宣言には lead を使う。

## 前提トークン

--content-width-desktop, --spacing-sm/md（lp-design-tokens スキル参照）。

## CSS（完全コード / note.css）

```css
/* ----------------------------------------------------------------
 Note — 商品見出し + 文章
----------------------------------------------------------------- */
.note {
  max-width: var(--content-width-desktop);
  margin: 0 auto;
  padding: 2rem var(--spacing-sm);
}

.note__inner {
  width: 100%;
}

.note__heading {
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
}

.note__body {
  font-size: 0.8rem;
  line-height: 1.9;
  letter-spacing: 0.05em;
}

/* 本文のスクロールフェードイン演出（data-animate）用の初期非表示。
   演出を実装しない場合はこのブロックごと削除する */
@media (scripting: enabled) {
  .note__body {
    opacity: 0;
  }
}

@media (width >= 768px) {
  .note {
    padding: 4rem var(--spacing-md);
  }

  .note__inner {
    width: 100%;
    padding: 0 8rem;
  }

  .note__heading {
    font-size: 1.75rem;
    margin-bottom: var(--spacing-md);
  }

  .note__body {
    font-size: 1rem;
    line-height: 2;
  }
}
```

## HTML 例

```html
<section class="note" aria-label="ITEM NAME について">
  <div class="note__inner">
    <h3 class="note__heading">ITEM NAME</h3>
    <p class="note__body" lang="ja" data-animate>
      商品の解説文をここに入れる。構造・素材・容量などの特長を 2〜3 文、
      続けて使用シーンの提案を 1〜2 文。合計 4〜5 文・150〜200 字程度が
      読みやすい分量の目安。
    </p>
  </div>
</section>
```

## 運用メモ

- PC の .note__inner の左右 padding（8rem）が「本文をやや狭く読ませる」版面を作っている。写真ブロックの幅と揃えたい場合はここを調整する
- 直後に同じ商品の写真ブロック（lp-section-layouts）を置くのが定番の並び。note → look → note → look のリズムで章立てする
- 初期非表示（opacity: 0）は本文のみ。見出しまで隠すとアンカー遷移時に位置の目印を失うため広げない
- 見出しの h レベル（h2 / h3）はページの見出し階層に合わせて調整する
