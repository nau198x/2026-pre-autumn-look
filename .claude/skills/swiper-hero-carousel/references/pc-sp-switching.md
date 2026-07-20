# PC/SP 切替方式

PC と SP でカルーセルの有無・設定・DOM を切り替える 2 方式の実績コード。

## 方式 A: matchMedia 生成 / 破棄（DOM 共有・片側のみカルーセル）

同じ DOM を使い、SP ではカルーセル・PC では静止グリッド（CSS 側でレイアウト切替）のような構成に使う。ブレークポイントを跨ぐリサイズで確実に生成 / 破棄されるため、インスタンスの取り残しがない。**リサイズ耐性が必要な場合の推奨方式。**

```js
// slider.js
import Swiper from "swiper";
import { EffectFade, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

const BREAKPOINT = "(min-width: 768px)";

let heroSwiper = null;

const createHeroSwiper = () => {
  if (heroSwiper) return; // 二重初期化ガード

  const el = document.querySelector(".hero__swiper");
  if (!el) return;

  heroSwiper = new Swiper(el, {
    modules: [EffectFade, Autoplay],
    effect: "fade",
    fadeEffect: { crossFade: false },
    speed: 2000,
    loop: true,
    slidesPerView: 1,
    allowTouchMove: true,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
  });
};

const destroyHeroSwiper = () => {
  if (!heroSwiper) return;
  heroSwiper.destroy(true, true); // インスタンス削除 + 注入スタイル除去
  heroSwiper = null;
};

export const initSlider = () => {
  const mql = window.matchMedia(BREAKPOINT);

  const sync = () => {
    if (mql.matches) {
      destroyHeroSwiper(); // PC: カルーセルなし
    } else {
      createHeroSwiper(); // SP: カルーセルあり
    }
  };

  sync();
  mql.addEventListener("change", sync);
};
```

- PC 側でカルーセルを使いたい場合は `sync()` 内の分岐を入れ替えるだけ
- PC/SP 両方で設定違いのカルーセルにしたい場合は、`create` を 2 種類用意し change のたびに destroy → create し直す

## 方式 B: 別インスタンス（PC/SP で DOM を出し分け）

PC 用と SP 用の DOM を両方持ち、CSS で `display: none` により出し分ける構成（PC 専用要素に `--pc`、SP 専用要素に `--sp` のようなクラス / モディファイア）。それぞれの要素に対して別インスタンスを立てる。

### B-1: 両方初期化する（リサイズ跨ぎを気にしない簡易版）

非表示側の Swiper も初期化されるが、fade + autoplay 程度なら実害は小さい。設定を PC/SP で変えられるのが利点。

```js
const isSP = window.matchMedia("(max-width: 767px)").matches;

const swiperConfig = {
  effect: "fade",
  fadeEffect: { crossFade: false },
  autoplay: { delay: 4000, disableOnInteraction: false },
  loop: true,
  speed: isSP ? 1500 : 2000, // SP はやや速く
};

new Swiper(".hero__swiper--pc", swiperConfig);
new Swiper(".hero__swiper--sp", { ...swiperConfig /* SP 固有の on ハンドラ等を追加 */ });
```

### B-2: 表示側だけ初期化する（初回判定のみ）

ロード時のビューポートで片側のみ初期化。リサイズでブレークポイントを跨ぐ利用（DevTools・タブレット回転）ではスライダーが動かないため、実機ではほぼ跨がない前提のページで使う。UA 判定を併用してタブレット回転にもある程度対応できる。

```js
const isSP = window.innerWidth <= 768;
const isMobileUA = /iphone|ipad|ipod|android|mobile|tablet/.test(navigator.userAgent.toLowerCase());
const isSmartphone = isSP || isMobileUA;

if (isSmartphone) {
  new Swiper(".hero__swiper--sp", { /* SP 設定 */ });
} else {
  new Swiper(".hero__swiper--pc", { /* PC 設定 */ });
}
```

## 方式選択の指針

| 条件 | 推奨 |
|---|---|
| DOM を共有できる / リサイズ跨ぎに耐えたい | 方式 A |
| PC と SP で構図・枚数・演出が根本的に違う | 方式 B-1 |
| B 構成かつ非表示側の autoplay も止めたい | 方式 B-2（または B-1 + matchMedia change で非表示側 `autoplay.stop()`） |

注意: 方式 B では新しいスライドを追加するとき **PC 用・SP 用の両方の DOM に追加する**こと（片側だけ更新すると表示差異が出る）。
