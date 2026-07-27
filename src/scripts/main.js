import "@fontsource/marcellus";

import "../styles/base.css";
import "../styles/global.css";
import "../styles/hero.css";
import "../styles/contents.css";
import "../styles/lead.css";
import "../styles/look.css";
import "../styles/staff-credit.css";
import "../styles/catalog.css";
import "../styles/ec.css";
import "../styles/footer.css";

import { initHeroParallax, initScrollAnimations } from "./animations.js";
import { initHero } from "./hero.js";
import { initSlider } from "./slider.js";

document.addEventListener("DOMContentLoaded", () => {
  initSlider();
  initHero();

  // ScrollTrigger 系はオープニングのスクロールロック解除後に初期化する
  // （overflow: hidden 中に初期化するとトリガー位置の計算が狂う）。
  // hero:animation-complete はスキップ経路（reduced-motion 等）でも必ず発火される
  document.addEventListener(
    "hero:animation-complete",
    () => {
      initHeroParallax();
      initScrollAnimations();
    },
    { once: true },
  );
});
