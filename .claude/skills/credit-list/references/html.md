# html — クレジットリストの構造

## 適用条件

- css.md / js.md とセットで使う。プレフィックス `credits` を変える場合は 3 ファイル全てで揃えて置換する
- 商品名・価格・URL は案件の実データに差し替える（以下はプレースホルダ）

## 基本構造

```html
<ul class="credits">
  <!-- オプション: 小見出し行（Tag）。<a> を持たない薄色テキスト -->
  <li class="credits__tag">RIGHT</li>

  <!-- 1 行のクレジット -->
  <li class="credits__item">
    <a class="credits__link" href="{{PRODUCT_URL}}" target="_blank" rel="noopener">
      <span class="credits__name">PULLOVER</span>
      <span class="credits__price">&yen;10,000</span>
      <span class="credits__action">CLICK</span>
    </a>
  </li>

  <!-- グループ境界を濃線で区切りたい行に --group-end を付ける -->
  <li class="credits__item credits__item--group-end">
    <a class="credits__link" href="{{PRODUCT_URL}}" target="_blank" rel="noopener">
      <span class="credits__name">SKIRT</span>
      <span class="credits__price">&yen;20,000</span>
      <span class="credits__action">CLICK</span>
    </a>
  </li>

  <li class="credits__item">
    <a class="credits__link" href="{{PRODUCT_URL}}" target="_blank" rel="noopener">
      <span class="credits__name">CARDIGAN</span>
      <span class="credits__price">&yen;30,000</span>
      <span class="credits__action">CLICK</span>
    </a>
  </li>
</ul>
```

## 複数グループを 1 つの ul に収める場合

1 つのルックに 2 系統の着こなし（LEFT / RIGHT 等）がある場合、Tag を複数置いて境界を作る。Tag 行自体に下線が付くので自然な区切りになる（`--group-end` と重複するなら省略可）:

```html
<ul class="credits">
  <li class="credits__tag">LEFT</li>
  <li class="credits__item">...</li>
  <li class="credits__item credits__item--group-end">...</li>
  <li class="credits__tag">RIGHT</li>
  <li class="credits__item">...</li>
  <li class="credits__item">...</li>
</ul>
```

## 構造のルール

- **最下段の li の下線は自動で濃線になる**（CSS の `:last-child` 判定）。最終行に `--group-end` を付ける必要はない
- **修飾子は `--group-end`（kebab-case）が正**。旧 `--groupEnd`（camelCase）からの移植時は必ず置換する
- 商品リンクは行全体（`<a class="credits__link">`）で包む。NAME だけをリンクにしない（タップ領域の確保）
- `target="_blank"` を使う場合は `rel="noopener"` を必ず付ける
- ul を入れ子にしない。グループが必要なら Tag / `--group-end` で表現する（JS の `:scope >` セレクタが直下の li だけを拾う前提）
