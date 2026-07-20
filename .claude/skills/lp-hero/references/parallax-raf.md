# parallax-raf — rAF ＋ LERP のヒーローパララックス（iOS ラバーバンド対策込み）

## 適用条件

- スクロールに応じてヒーロー画像がゆっくり追従し、ロゴ・サブタイトルが逆方向に流れつつフェードアウトする演出
- GSAP 不要（素の requestAnimationFrame ＋ LERP）。scroll イベントに直接演出を書かないことでカクつきを防ぐ
- 進捗は「画面 1 枚分スクロールで完了」に正規化しているため、端末の高さに依らず同じ体感になる

## JS（hero-parallax.js）

```js
export const initHeroParallax = () => {
  const image = document.querySelector(".hero__image");
  const hero = document.querySelector(".hero");
  if (!image || !hero) return;

  // フェードイン + Ken Burns 入場演出発火（CSS transition 側で定義。下記 CSS 参照）
  requestAnimationFrame(() => {
    hero.classList.add("is-ready");
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const MAX_TRANSLATE = -32; // 画像の最大移動量（% 単位）
  const EASE = 0.2; // LERP 係数（小さいほど遅れて追従）
  const FADE_SPEED = 2.0; // progress * FADE_SPEED で opacity 1 → 0、progress = 0.5 で完全消失
  const OVERLAY_BASE_RATIO = -0.55; // viewport 高さに対するロゴ + サブタイトルの移動量比（SP / PC を viewport 連動で揃える）

  const logo = document.querySelector(".hero__logo");
  const subtitle = document.querySelector(".hero__subtitle");

  let current = 0;
  let opacityCurrent = 1;
  let overlayCurrent = 0;
  let viewportHeight = window.innerHeight;
  let maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);

  const onResize = () => {
    viewportHeight = window.innerHeight;
    maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight);
  };
  window.addEventListener("resize", onResize, { passive: true });

  const loop = () => {
    // iOS のラバーバンド時に scrollY が負 / 最大超過に飛ぶことがある。
    // クランプして異常値を排除しないと、その瞬間に <img object-fit:cover> が
    // 再ラスタライズされて拡大固定される iOS Safari のバグを誘発する。
    const safeScrollY = Math.max(0, Math.min(window.scrollY, maxScroll));
    // 進捗は viewport 高さ基準（端末問わず「画面 1 枚スクロールで完了」に正規化）
    const progress = Math.min(safeScrollY / viewportHeight, 1);

    // 画像のパララックス
    const targetTranslate = progress * MAX_TRANSLATE;
    current += (targetTranslate - current) * EASE;
    image.style.transform = `translate3d(0, ${current}%, 0)`;

    // ロゴ + サブタイトル: viewport 高さに比例した同方向・同距離のパララックス
    const overlayTarget = progress * viewportHeight * OVERLAY_BASE_RATIO;
    overlayCurrent += (overlayTarget - overlayCurrent) * EASE;
    const overlayTransform = `translate3d(0, ${overlayCurrent}px, 0)`;
    if (logo) {
      logo.style.transform = overlayTransform;
    }
    if (subtitle) {
      subtitle.style.transform = overlayTransform;
    }

    // ロゴ + サブタイトルのスクロールフェード
    // filter: opacity() を使うことで、CSS 側の入場用 opacity transition と独立制御できる
    const opacityTarget = Math.max(0, 1 - progress * FADE_SPEED);
    opacityCurrent += (opacityTarget - opacityCurrent) * EASE;
    if (logo) {
      logo.style.filter = `opacity(${opacityCurrent})`;
    }
    if (subtitle) {
      subtitle.style.filter = `opacity(${opacityCurrent})`;
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};
```

## CSS（入場フェード側の例）

`is-ready` 付与で CSS transition による入場フェード＋ズームアウトを開始する。JS の rAF ループは `transform`（translate）と `filter` のみを書き、入場用の `opacity` / `scale` とはプロパティを分離しているので競合しない:

```css
.hero__image {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

.hero__logo,
.hero__subtitle {
  opacity: 0;
  transition: opacity 1.2s ease-out;
}

.hero.is-ready .hero__logo,
.hero.is-ready .hero__subtitle {
  opacity: 1;
}

/* 入場 Ken Burns を CSS だけでやる場合の例 */
.hero__image {
  scale: 1.06;
  transition: scale 1.8s ease-out;
}

.hero.is-ready .hero__image {
  scale: 1;
}
```

## 設計メモ

- **LERP（`current += (target - current) * EASE`）**: scroll イベント直結より滑らかで、慣性スクロール中も破綻しない。`EASE` を下げるほど「重い」質感になる
- **scrollY のクランプは必須**: 上記コメントの iOS Safari バグ対策。削ると実機のラバーバンドで画像がズレたまま固定される事故が起きる
- **`filter: opacity()` と `style.opacity` の使い分け**: 入場フェード（CSS transition の `opacity`）とスクロールフェード（JS の `filter: opacity()`）を別プロパティにすることで、両者が互いを上書きしない
- rAF ループは常時回り続けるが、書き込みは transform / filter のみでレイアウトは発生しない。それでも気になる場合は `document.hidden` 時にループを止める分岐を足してよい
