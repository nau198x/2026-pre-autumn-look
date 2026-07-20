# canvas-scale — 固定 px アートボードの transform scale フィット

## 適用条件

- ヒーローを「固定 px のキャンバス（アートボード）」として設計し、どのビューポートでもキャンバス全体を切らさずに収めたい
- 子要素（画像・タイトル・バッジ等）はキャンバス座標系の絶対配置で組む（デザインカンプの px 値をそのまま書ける。エディトリアル / アートディレクション重視の LP 向き）
- レスポンシブ可変レイアウト（% / rem で流動する構成）のヒーローには使わない（SKILL.md の併用ガイド参照）

仕組みの内訳:

- **`.hero`**: キャンバスと同じ `aspect-ratio` を持つ実寸コンテナ。`max-height: 90svh` で「ヒーローがビューポート高さを超えない」保護をかける
- **`.hero__inner`**: 固定 px のキャンバス本体。中央配置し `transform: scale(var(--hero-scale))` で均一縮小する
- **`--hero-scale`**: `min(実寸幅 / キャンバス幅, 実寸高さ / キャンバス高さ)`（= contain 相当）。初期値は CSS の `min(calc(...))` で近似しておき（JS ロード前の FOUC 防止）、JS が実測値で精密に上書きする
- キャンバス比率 = hero 比率なので、どのビューポートでも大きな空白は発生しない（横に広い場合のみ側面に背景色の余白）

## JS（hero-scale.js）

```js
/**
 * Hero canvas scaling
 *
 * `.hero__inner` は固定サイズのキャンバス（px 指定）。hero 要素の実寸に対して
 * キャンバス全体が収まるように `--hero-scale` を計算し transform: scale() する。
 */
export const initHeroScale = () => {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const getCanvasSize = () => {
    const styles = getComputedStyle(hero);
    // フォールバック値は CSS 側の定義と揃えること
    const w = parseFloat(styles.getPropertyValue("--hero-canvas-w")) || 1200;
    const h = parseFloat(styles.getPropertyValue("--hero-canvas-h")) || 950;
    return { w, h };
  };

  const updateScale = () => {
    const rect = hero.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const { w, h } = getCanvasSize();
    const scale = Math.min(rect.width / w, rect.height / h);
    hero.style.setProperty("--hero-scale", scale.toFixed(4));
  };

  // 初期計算（DOMContentLoaded 時点でレイアウトは確定している）
  updateScale();

  // 画像 / フォント読込完了後に再計算（hero 実寸が変わる可能性）
  window.addEventListener("load", updateScale);

  // リサイズは debounce（scroll 中の URL バー伸縮では svh 固定なので通常 fire しない）
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateScale, 100);
  });

  // 回転時: iOS は innerHeight の更新が遅れるので delay を入れる
  window.addEventListener("orientationchange", () => {
    setTimeout(updateScale, 200);
  });
};
```

## CSS（hero.css）

キャンバス定義（`--hero-canvas-w/h`・`aspect-ratio`）は PC / SP でメディアクエリごと切り替える。子要素の配置座標もキャンバスごとに書き直す:

```css
.hero {
  position: relative;
  width: 100%;
  aspect-ratio: 1200 / 950; /* キャンバスと同一比率にする */
  max-height: 90vh;
  max-height: 90svh; /* svh 対応ブラウザ用の上書き */
  overflow: hidden;
  background: var(--color-bg);

  --hero-canvas-w: 1200;
  --hero-canvas-h: 950;

  /* 初期 scale を CSS 側で近似計算（JS ロード前の FOUC 防止。JS が実測値で上書きする） */
  --hero-scale: min(calc(100vw / (var(--hero-canvas-w) * 1px)), calc(90vh / (var(--hero-canvas-h) * 1px)));
  --hero-scale: min(calc(100vw / (var(--hero-canvas-w) * 1px)), calc(90svh / (var(--hero-canvas-h) * 1px)));
}

.hero__inner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--hero-canvas-w) * 1px);
  height: calc(var(--hero-canvas-h) * 1px);
  transform: translate(-50%, -50%) scale(var(--hero-scale));
  transform-origin: center center;
  will-change: transform;
}

/* 子要素はキャンバス座標系で絶対配置（カンプの px 値をそのまま書く） */
.hero__figure {
  position: absolute;
  margin: 0;
}

.hero__figure img {
  width: 100%;
  height: auto;
  display: block;
}

.hero__figure--1 {
  top: 30px;
  left: 130px;
  width: 500px;
  z-index: 1;
}

.hero__figure--2 {
  top: 520px;
  left: 540px;
  width: 500px;
  z-index: 2;
}

.hero__title {
  position: absolute;
  top: 40px;
  left: 820px;
  margin: 0;
  font-size: 64px;
  z-index: 3;
}

/* SP はキャンバス自体を別定義に切り替える */
@media (width < 768px) {
  .hero {
    aspect-ratio: 400 / 420;
    --hero-canvas-w: 400;
    --hero-canvas-h: 420;
  }

  .hero__figure--1 {
    top: 20px;
    left: 20px;
    width: 210px;
  }

  .hero__figure--2 {
    top: 260px;
    left: 180px;
    width: 200px;
  }

  .hero__title {
    top: 28px;
    left: 290px;
    font-size: 28px;
  }
}
```

HTML 構造の骨子:

```html
<section class="hero">
  <div class="hero__inner">
    <figure class="hero__figure hero__figure--1"><img src="..." alt="..." width="1028" height="1285" /></figure>
    <figure class="hero__figure hero__figure--2"><img src="..." alt="..." width="1028" height="694" /></figure>
    <h1 class="hero__title">TITLE</h1>
  </div>
</section>
```

## 設計メモ

- **`min(w比, h比)` を使う理由**: `object-fit: contain` と同じ「全体が必ず収まる」スケーリング。片軸だけで計算すると縦長 / 横長端末のどちらかで切れる
- **CSS 初期値 + JS 精密値の二段構え**: CSS の `min(calc(...))` は `100vw`（スクロールバー幅を含む）基準の近似。JS が `getBoundingClientRect()` の実測幅で上書きすることで、スクロールバーや親レイアウトの影響を吸収する。JS が読み込まれる前の 1 フレームも CSS 近似値でほぼ正しく表示され、FOUC が出ない
- **`resize` は debounce、`orientationchange` は遅延**: resize の連続発火での再計算を間引く。iOS Safari は回転直後 `innerHeight` が旧値のままのことがあるため 200ms 待つ
- **`max-height: 90svh`**: `vh` フォールバック → `svh` 上書きの 2 行書き。svh 基準にしておくと iOS の URL バー伸縮で hero 高さが動かず、scroll 中に resize→再計算が走らない
- 子要素のフォント指定・配色はプロジェクトのデザイントークン（`var(--font-primary)` 等）を参照する。キャンバス内は px 固定で書いてよい（scale で一括縮小されるため rem にする意味がない）
- 入場アニメ（entrance-timeline.md）と併用する場合、Ken Burns 等の transform は `.hero__inner` ではなくキャンバス内の `img` に書く。`.hero__inner` の transform は scale フィット専用に保つ
