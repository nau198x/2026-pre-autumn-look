# css — 罫線・行スタイルと初期非表示

## 適用条件

- html.md の構造とセットで使う
- 罫線は border ではなく疑似要素 + `transform: scaleX(var(--line-scale))` で描く（border を animate するとレイアウトが発生する。疑似要素 + scaleX なら GPU 合成で処理され、左→右に伸びる演出も自然に出る）
- CSS 変数 `--line-scale` を JS（GSAP）から動かす。GSAP 3.x 必須

## デザイントークン（未定義のプロジェクトのみ追加）

```css
:root {
  --color-rule: #111; /* 濃線: 枠・グループ境界 */
  --color-rule-light: #aaa; /* 薄線: 行間 */
  --color-text: #000;
  --color-link: #000;
  --color-muted: #888; /* Tag（小見出し）用 */
  --font-display: serif; /* 価格・数字の差別化用。標準は欧文ディスプレイ + 明朝フォールバック（lp-design-tokens 参照） */
  --ease-out: cubic-bezier(0.215, 0.61, 0.355, 1); /* 標準カーブ（easeOutCubic）。同名別値を作らない */
}
```

## CSS（credit-list.css）

```css
/* ul 本体: 上端に濃線 */
.credits {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 0 auto;
  width: 70%; /* 100% やカスタム幅も可。70% + 右寄せがエディトリアルの定番 */
  position: relative;
  --line-scale: 1;
}

.credits::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--color-rule);
  transform: scaleX(var(--line-scale));
  transform-origin: left center;
}

/* 各 li: 下端に薄線（:last-child と --group-end は濃線で上書き） */
.credits__item {
  position: relative;
  --line-scale: 1;
}

.credits__item::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--color-rule-light);
  transform: scaleX(var(--line-scale));
  transform-origin: left center;
  z-index: 1;
}

.credits__item:last-child::after,
.credits__item--group-end::after {
  background-color: var(--color-rule);
}

/* リンク行: NAME を左端に寄せ、PRICE / CLICK を右に寄せる */
.credits__link {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 1.5rem;
  padding: 0.5rem;
  font-size: 0.75rem;
  letter-spacing: 0.05rem;
  color: inherit;
  text-decoration: none;
  transition: background-color 0.2s var(--ease-out);
}

.credits__name {
  color: var(--color-text);
  margin-right: auto; /* flex で片側だけ auto margin = 左寄せの定番技 */
  transition: color 0.2s var(--ease-out);
}

.credits__price {
  font-family: var(--font-display);
  color: var(--color-text);
  transition: color 0.2s var(--ease-out);
}

.credits__action {
  color: var(--color-link);
  letter-spacing: 0.15rem;
  transition: color 0.2s var(--ease-out);
}

/* hover 白黒反転（オプション。控えめ版は末尾参照） */
.credits__link:hover {
  background-color: var(--color-text);
}

.credits__link:hover .credits__name,
.credits__link:hover .credits__price,
.credits__link:hover .credits__action {
  color: #fff;
}

/* Tag（小見出し）: <a> を持たないため hover 反転は当たらない */
.credits__tag {
  padding: 0.5rem;
  font-size: 0.7rem;
  letter-spacing: 0.15rem;
  color: var(--color-muted);
  position: relative;
  --line-scale: 1;
}

.credits__tag::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: var(--color-rule-light);
  transform: scaleX(var(--line-scale));
  transform-origin: left center;
  z-index: 1;
}

/* JS 有効かつモーション許可時のみ初期非表示。
   JS 無効 / reduced-motion 環境ではデフォルト表示のまま（隠さない） */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  .credits {
    opacity: 0;
  }

  .credits,
  .credits__item,
  .credits__tag {
    --line-scale: 0;
  }

  .credits__name,
  .credits__price,
  .credits__action,
  .credits__tag {
    opacity: 0;
  }
}
```

## 変種

### hover を控えめにする（反転が強すぎる場合）

```css
.credits__link {
  transition: opacity 0.2s var(--ease-out);
}

.credits__link:hover {
  opacity: 0.6;
}

/* 白黒反転の 2 ルール（background-color と子要素 color）は削除する */
```

### SP 縦積み / PC 横並び（3 列 grid 内など狭い場合）

```css
.credits__link {
  display: flex;
  flex-direction: column; /* SP デフォルト: 縦積み */
  align-items: center;
  gap: 0.2rem;
}

@media (width >= 768px) {
  .credits__link {
    flex-direction: row; /* PC: 横並び */
    justify-content: flex-end;
    align-items: baseline;
    gap: 0.5rem;
  }
}
```

縦積みでは `margin-right: auto` が効かないので、`.credits__name` の当該行も SP では外す。

## 注意

- 複数の ul を縦に密着して並べると、上の ul の下端濃線と下の ul の上端濃線が二重に見える。ul 間に margin を入れるか、2 段目以降の `::before` を無効化する
- `@media (scripting: enabled)` 未対応の古いブラウザで初期フラッシュが出る場合は、JS で `document.body.classList.add("js-ready")` を付けてから隠す方式に切り替える
