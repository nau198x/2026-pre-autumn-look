# 行 stagger 変種（backdrop-filter 1 層方式）

行（row）単位で要素を stagger フェードさせつつ、各画像に被せたグレーのマスクを**上→下に退かせて**色をリビールする変種。img の 2 枚重ねが不要（`backdrop-filter: grayscale(1)` のマスク 1 枚で済む）ため、グリッド状に画像が多数並ぶセクションで DOM と記述量を節約できる。

適用条件: 同一行に複数枚の画像が並ぶルック / グリッドセクション。クレジット行など画像以外の要素も同じ行タイミングに乗せたい場合。Safari 対応のため `-webkit-backdrop-filter` の併記が必須。

## HTML

行単位で同期発火させたい要素に `data-reveal-row="N"` を付与し、色リビール対象には子として grayMask を置く。

```html
<section class="lookSection">
  <article class="lookSection__item">
    <!-- row 1: 2 枚が stagger 0.3s で時間差出現 -->
    <a class="lookSection__imageLink" href="{{PRODUCT_URL}}" data-reveal-row="1">
      <img src="images/look_01.webp" alt="{{ALT_TEXT}}" width="800" height="1000" loading="lazy" />
      <div class="reveal-graymask" aria-hidden="true"></div>
    </a>
    <a class="lookSection__imageLink" href="{{PRODUCT_URL}}" data-reveal-row="1">
      <img src="images/look_02.webp" alt="{{ALT_TEXT}}" width="800" height="1000" loading="lazy" />
      <div class="reveal-graymask" aria-hidden="true"></div>
    </a>

    <!-- row 2: クレジット行。grayMask なし = opacity フェードのみで row stagger に乗る -->
    <ul class="lookSection__credit" data-reveal-row="2">
      <li>Item {{PRICE}}</li>
    </ul>
  </article>
</section>
```

- `data-reveal-row` の値は article 内でユニークな行番号。別 article では 1 から振り直してよい
- リベール対象の要素自体は `position: relative` にして grayMask を absolute で重ねる

## CSS

```css
.lookSection__imageLink {
  position: relative; /* grayMask の inset 基準 */
  display: block;
}

.lookSection__imageLink img {
  display: block;
  width: 100%;
  height: auto;
}

.reveal-graymask {
  /* backdrop-filter のトーン調整パラメータ */
  --graymask-contrast: 0.8;
  --graymask-brightness: 2;
  --graymask-blur: 0px;
  --graymask-sepia: 0;

  /* リベール位置（上→下）と境界ぼかし。
     デフォルト 110% = マスク透明 = カラー表示（JS 無効 / reduced-motion 時の最終形） */
  --reveal-y: 110%;
  --reveal-feather: 5%;

  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;

  backdrop-filter: grayscale(1) contrast(var(--graymask-contrast)) brightness(var(--graymask-brightness)) blur(var(--graymask-blur)) sepia(var(--graymask-sepia));
  -webkit-backdrop-filter: grayscale(1) contrast(var(--graymask-contrast)) brightness(var(--graymask-brightness)) blur(var(--graymask-blur)) sepia(var(--graymask-sepia));

  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    transparent calc(var(--reveal-y) - var(--reveal-feather)),
    black calc(var(--reveal-y) + var(--reveal-feather)),
    black 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    transparent calc(var(--reveal-y) - var(--reveal-feather)),
    black calc(var(--reveal-y) + var(--reveal-feather)),
    black 100%
  );
}

/* JS 有効 + 動き許容時のみ初期状態を「全面グレー (--reveal-y: -10%)」+「行を透明」にする。
   それ以外の環境ではデフォルト値（カラー表示・opacity 1）のまま = コンテンツが消えない */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  [data-reveal-row] {
    opacity: 0;
  }
  [data-reveal-row] > .reveal-graymask {
    --reveal-y: -10%;
  }
}
```

- `--reveal-y` を `-10% → 110%` と上下に少しはみ出させるのは、要素端にグレーの取り残しを作らないため
- `--reveal-feather: 5%` で境界がほんのりぼけてフィルム調になる。0% にするとシャープな直線ワイプ

## JS

```js
// animations.js（行 stagger リビール）
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const COLOR_REVEAL_DURATION = 1.0;   // マスク退き時間（s）
const COLOR_REVEAL_EASE = "linear";  // 位置マスクは linear が一番「現像」らしい
const ROW_STAGGER = 0.3;             // 同一行内の要素間ずらし（s）

export const initRowReveal = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (const article of gsap.utils.toArray(".lookSection__item")) {
    // 行番号ごとに要素をグループ化
    const rowMap = new Map();
    for (const el of article.querySelectorAll("[data-reveal-row]")) {
      const key = el.dataset.revealRow;
      if (!rowMap.has(key)) rowMap.set(key, []);
      rowMap.get(key).push(el);
    }

    for (const elements of rowMap.values()) {
      const grayMasks = elements
        .map((el) => el.querySelector(":scope > .reveal-graymask"))
        .filter(Boolean);

      const tl = gsap.timeline({
        scrollTrigger: { trigger: elements[0], start: "top 70%", once: true },
      });

      // 行内要素の opacity フェード（stagger 付き）
      tl.fromTo(
        elements,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power1.inOut", stagger: ROW_STAGGER },
        0,
      );

      // grayMask の退き（同じ stagger 値でフェードと同期させる）
      if (grayMasks.length) {
        tl.fromTo(
          grayMasks,
          { "--reveal-y": "-10%" },
          {
            "--reveal-y": "110%",
            duration: COLOR_REVEAL_DURATION,
            ease: COLOR_REVEAL_EASE,
            stagger: ROW_STAGGER,
          },
          0,
        );
      }
    }
  }
};
```

## 2 層方式（css-layers.md）との使い分け

| 観点 | 行 stagger（この変種） | 2 層ワイプ / クロスフェード |
|---|---|---|
| DOM | img 1 枚 + マスク div | img 2 枚（同一 src） |
| グレーの向き | 上→下に色が現れる | 左→右（ワイプ）/ その場（フェード） |
| カラーオーバーレイ | sepia 変数で近似 | ::after + mix-blend-mode で自由 |
| 行単位の同期 | data-reveal-row で構造的に対応 | ブロック単位（行概念なし） |
| ブラウザ注意 | backdrop-filter（Safari は -webkit- 必須） | 特になし |

## 調整ポイント

| パラメータ | 既定値 | 説明 |
|---|---|---|
| `COLOR_REVEAL_DURATION` | 1.0 | マスク退き時間。フェード（0.8）よりわずかに長いと余韻が出る |
| `ROW_STAGGER` | 0.3 | 行内の要素間ずらし。フェードとマスクの両方に同値を渡して同期させる |
| `--graymask-contrast` / `--graymask-brightness` | 0.8 / 2 | グレーのトーン。ヒーローに使うなら 1.2 / 0.92 のような濃いめも合う |
| `--reveal-feather` | 5% | 境界ぼかし幅。0% でシャープ、10% で霧っぽく |
| ScrollTrigger `start` | top 70% | 演出をしっかり見せるため深め |
