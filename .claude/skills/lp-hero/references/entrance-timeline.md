# entrance-timeline — Ken Burns 入場＋段階テキスト表示＋rescue 処理

## 適用条件

- ヒーローが静止画（PC 1 枚 / SP はカルーセル等の出し分けも可）＋タイトル・サブタイトル・キャプションの構成
- GSAP がプロジェクトに導入済み
- ローディング演出がある場合は `loading:complete` / `loading:overlay-fade-start` を購読して開始する（無い場合の代替発火は event-contract.md 参照）

演出の内訳:

- **Ken Burns**: 画像を `scale 1.05 → 1.0` にゆっくりズームアウト（一回切り）。ローディングオーバーレイのフェード開始と同時に先行起動し、画像が見え始める瞬間と同期させる
- **タイトル**: 1 文字ずつ `<span>` 分割し、シード固定ランダム順で blur ＋フェードイン（シード固定なのでリロードしても同じ順序 = 検品可能）
- **サブタイトル / キャプション**: タイトルに続けてブロックフェード
- **rescue**: 入場未再生のまま PC ⇔ SP が切り替わったら、アニメを捨てて即座に完成状態へ

## JS（hero.js）

```js
import { gsap } from "gsap";

const TITLE_SHUFFLE_SEED = 7;
const TITLE_CHAR_EASE = "power1.out";
const TITLE_CHAR_BLUR_START = 8;
const SUBTITLE_EASE = "power1.out";
const CAPTION_EASE = "power1.out";
const HERO_START_DELAY = 0.2;
const HERO_KEN_BURNS_DURATION = 1.8;

// シード固定の疑似乱数（リロードしても同じシャッフル順になる）
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const seededShuffle = (array, seed) => {
  const rng = mulberry32(seed);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// タイトルを 1 文字ずつ <span> に分割（aria-label で読み上げテキストを保持）
const splitChars = (el) => {
  const text = el.textContent;
  const chars = Array.from(text);
  el.setAttribute("aria-label", text);
  el.innerHTML = chars.map((c) => `<span class="hero__titleChar">${c === " " ? "&nbsp;" : c}</span>`).join("");
  return el.querySelectorAll(".hero__titleChar");
};

export const initHero = () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return; // CSS 側の @media 条件により最初から表示される

  const pcMql = window.matchMedia("(min-width: 768px)");
  const hero = document.querySelector(".hero");
  const image = document.querySelector(".hero__image--pc");
  const swiperImages = document.querySelectorAll(".hero__swiper .hero__image"); // SP がカルーセルの場合
  const title = document.querySelector(".hero__title");
  const subtitle = document.querySelector(".hero__subtitle");
  const caption = document.querySelector(".hero__caption");
  const texts = document.querySelectorAll(".hero [data-hero-text]"); // subtitle + caption（rescue 用）
  if (!hero || !title) return;

  const titleChars = splitChars(title);
  const shuffledTitleChars = seededShuffle(Array.from(titleChars), TITLE_SHUFFLE_SEED);

  let played = false;
  const markReady = () => hero.classList.add("is-hero-ready");

  const start = () => {
    if (played) return;
    played = true;

    const isPc = pcMql.matches;

    const tl = gsap.timeline({
      delay: HERO_START_DELAY,
      defaults: { ease: "power1.out" },
      onComplete: () => {
        markReady();
        // 完了後は inline style を除去し、以降の CSS 制御と競合させない
        if (image) gsap.set(image, { clearProps: "transform,willChange" });
        if (swiperImages.length) gsap.set(swiperImages, { clearProps: "transform,willChange" });
        gsap.set(titleChars, { clearProps: "opacity,filter" });
        gsap.set(texts, { clearProps: "transform,opacity" });
        document.dispatchEvent(new Event("hero:animation-complete"));
      },
    });

    const titleStart = 0;

    // タイトル: 1 文字ずつ、シード固定ランダム順で blur + フェード
    tl.fromTo(
      shuffledTitleChars,
      { opacity: 0, filter: `blur(${TITLE_CHAR_BLUR_START}px)` },
      { opacity: 1, filter: "blur(0px)", duration: 1.4, stagger: 0.2, ease: TITLE_CHAR_EASE },
      titleStart,
    );

    // subtitle: ブロックフェード（PC/SP で移動量を変える）
    if (subtitle) {
      tl.fromTo(subtitle, { opacity: 0, x: isPc ? -10 : -5, y: 0 }, { opacity: 1, x: 0, y: 0, duration: 1.2, ease: SUBTITLE_EASE }, titleStart + 1.0);
    }

    // caption: subtitle と同時にブロックフェード
    if (caption) {
      tl.fromTo(caption, { opacity: 0, x: isPc ? -10 : -5, y: 0 }, { opacity: 1, x: 0, y: 0, duration: 1.2, ease: CAPTION_EASE }, titleStart + 1.0);
    }
  };

  // rescue: 未再生のままビューポート（PC⇔SP）が切り替わった場合、アニメを捨てて完成状態へ
  const onChange = () => {
    if (played) return;
    played = true;
    markReady();
    if (image) {
      gsap.killTweensOf(image);
      gsap.set(image, { clearProps: "transform,willChange" });
    }
    if (swiperImages.length) {
      gsap.killTweensOf(swiperImages);
      gsap.set(swiperImages, { clearProps: "transform,willChange" });
    }
    gsap.set(titleChars, { opacity: 1 });
    gsap.set(texts, { opacity: 1, y: 0 });
    document.dispatchEvent(new Event("hero:animation-complete")); // 後続（カルーセル等）を止めない
  };
  pcMql.addEventListener("change", onChange);

  // Ken Burns: オーバーレイのフェード開始と同時に独立発火（画像が見え始めるタイミングと一致させる）
  // PC は単独画像、SP はカルーセル内の画像群を対象に一回切りで zoom-out
  const startKenBurns = () => {
    const isPc = pcMql.matches;
    const target = isPc ? image : swiperImages;
    if (!target || target.length === 0) return;
    gsap.fromTo(
      target,
      { scale: 1.05 },
      { scale: 1.0, duration: HERO_KEN_BURNS_DURATION, ease: "power1.out" },
    );
  };
  document.addEventListener("loading:overlay-fade-start", startKenBurns, { once: true });

  document.addEventListener("loading:complete", start, { once: true });
};
```

## CSS（初期非表示。JS 無効 / reduced-motion では隠さない）

```css
/* JS 有効かつモーション許可時のみ初期非表示。
   タイトル文字は JS 分割後に fromTo で制御するため、分割前の親を隠す */
@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  .hero__title,
  .hero [data-hero-text] {
    opacity: 0;
  }

  /* 入場完了後（is-hero-ready）は CSS 側の非表示を解除 */
  .hero.is-hero-ready .hero__title,
  .hero.is-hero-ready [data-hero-text] {
    opacity: 1;
  }
}
```

HTML 側は subtitle / caption に `data-hero-text` を付与する（1 行例）:
`<p class="hero__subtitle" data-hero-text>...</p>`

## バリエーション: blur 込み Ken Burns（複数画像の時間差入場）

画像が 2 枚以上並ぶヒーローで「ボケた状態からピントが合いながらズームアウト」させる場合。タイムライン冒頭で初期状態を `gsap.set` し、時間差で解除する:

```js
const heroImgs = document.querySelectorAll(".hero__figure img");
gsap.set(heroImgs, { scale: 1.08, filter: "blur(8px)" });

const tl = gsap.timeline();
tl.to(heroImgs, {
  scale: 1,
  filter: "blur(0px)",
  duration: 1.0,
  ease: "power1.inOut",
  stagger: 0.5, // 2 枚目以降を時間差で
}, 0.1);

// タイトル行はグループ分けして順に出す（1 行目 → 残り行）
const firstLine = document.querySelector(".hero__title span:first-child");
const restLines = document.querySelectorAll(".hero__title span:not(:first-child)");
const TITLE_DELAY = 0.6;
tl.to(firstLine, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, TITLE_DELAY);
tl.to(restLines, { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" }, TITLE_DELAY + 0.3);

// 全体をゆったりさせたいときはタイムラインごと減速できる
tl.timeScale(0.67);
```

`filter: blur()` は描画コストが高いので、対象はファーストビューの数枚に限定する。

## 注意

- `splitChars` は `textContent` を破壊的に置換する。多言語や `<br>` 入りタイトルには行ごとの `<span>` を HTML に直接書く方式へ切り替える
- Ken Burns の対象画像には CSS 側で `will-change: transform` を付けてよいが、完了後は必ず `clearProps` で除去する（合成レイヤーの持ちっぱなしを防ぐ）
- rescue 処理でも `hero:animation-complete` を必ず発火する。発火しないとカルーセル autoplay 等の後続が永久に始まらない
