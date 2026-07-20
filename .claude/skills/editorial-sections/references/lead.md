# lead — コンセプト導入文セクション

## 適用条件

ヒーロー直後、ページ冒頭で世界観・コンセプトを宣言するセクション。タグライン（.lead__tag）+ 英文リード（.lead__en）+ 和文リード（.lead__jp）の 3 要素を中央揃えで縦に積む。ページに 1 回だけ置く（商品ごとの解説は note を使う）。

英文・和文は片方だけでも成立する（実案件でも英文を省略する構成がある）。不要な要素は HTML ごと削除すればよく、CSS の変更は不要。

## 前提トークン

--spacing-sm/md/lg, --color-text, --color-bg（lp-design-tokens スキル参照）。

## CSS（完全コード / lead.css）

```css
/* ----------------------------------------------------------------
 Lead
----------------------------------------------------------------- */
.lead {
  padding: 4rem var(--spacing-sm) 2rem;
  text-align: center;
  color: var(--color-text);
  background-color: var(--color-bg);
}

.lead__inner {
  max-width: 720px;
  margin: 0 auto;
}

.lead__tag {
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin-bottom: var(--spacing-md);
}

.lead__en {
  font-size: 0.7rem;
  line-height: 1.9;
  letter-spacing: 0.1em;
  margin-bottom: var(--spacing-md);
}

.lead__jp {
  font-size: 0.7rem;
  line-height: 2;
  letter-spacing: 0.12em;
}

@media (width >= 768px) {
  .lead {
    padding: 6rem var(--spacing-md) 4rem;
  }

  .lead__tag {
    font-size: 1.2rem;
    margin-bottom: var(--spacing-lg);
  }

  .lead__en,
  .lead__jp {
    font-size: 1rem;
  }

  .lead__en {
    margin-bottom: var(--spacing-lg);
  }
}
```

## HTML 例

```html
<section class="lead" id="lead" aria-label="Concept">
  <div class="lead__inner" data-animate>
    <h2 class="lead__tag">– CONCEPT NAME –</h2>
    <p class="lead__en">
      English lead copy line one.<br />
      English lead copy line two,<br />
      closing the concept statement.
    </p>
    <p class="lead__jp" lang="ja">
      和文のリードコピーをここに入れる。<br />
      シーズンテーマや提案の背景を<br />
      2〜3 行で簡潔に述べる。
    </p>
  </div>
</section>
```

## 運用メモ

- タグ前後のダッシュ（– –）は文字として入れる（擬似要素にしない）。コピー支給時にダッシュ込みで来ることが多く、装飾を CSS に持たせると二重になる
- タグにブランドの見出し用フォントを当てる場合は、要素へ直接フォント名を書かず :root の {{DISPLAY_FONT}} 相当のトークン（例: --font-display）を参照する
- 改行位置（br）はカンプ指定に従う。SP で不自然に折り返す場合は br を SP 非表示にするのではなく、コピー側の調整を先に相談する
- スクロール演出は .lead__inner に data-animate を 1 つ付ける（子要素を個別に動かさない）
