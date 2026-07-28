import "@fontsource/marcellus";

import "../styles/base.css";
import "../styles/global.css";
import "../styles/preloader.css";
import "../styles/hero.css";
import "../styles/contents.css";
import "../styles/lead.css";
import "../styles/look.css";
import "../styles/staff-credit.css";
import "../styles/catalog.css";
import "../styles/ec.css";
import "../styles/footer.css";

import {
  initCreditsReveal,
  initHeroParallax,
  initLookHeadingReveal,
  initScrollAnimations,
} from "./animations.js";
import { initHero } from "./hero.js";
import { runPreloader } from "./preloader.js";
import { initSlider } from "./slider.js";

document.addEventListener("DOMContentLoaded", () => {
  // 購読側（initHero の loading:complete 待ち）を先に登録してから
  // プリローダーを起動する。イベントは発火時にリスナーが居ないと消えるため
  initSlider();
  initHero();

  runPreloader({
    heroImgSelector: ".hero__swiper img",
    fontSpec: ["1rem Marcellus"],
    minDisplayMs: 1000,
    timeoutMs: 8000, // 変えたら hero.js の LOADING_FALLBACK_MS も見直す
    onComplete: () => document.dispatchEvent(new Event("loading:complete")),
  });

  // ScrollTrigger 系はオープニングのスクロールロック解除後に初期化する
  // （overflow: hidden 中に初期化するとトリガー位置の計算が狂う）。
  // hero.js は unlockScroll() の後に hero:animation-complete を発火するので
  // この購読でも「ロック解除済み」の要件は満たされる。
  // スキップ経路（reduced-motion 等）でもこのイベントは必ず発火される
  document.addEventListener(
    "hero:animation-complete",
    () => {
      initHeroParallax();
      // 文字分割で見出しの高さが動きうるので、[data-animate] の
      // ScrollTrigger を生成する initScrollAnimations より先に呼ぶ
      initLookHeadingReveal();
      initCreditsReveal();
      initScrollAnimations();
    },
    { once: true },
  );
});
