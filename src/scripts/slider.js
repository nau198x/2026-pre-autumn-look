import Swiper from "swiper";
import { EffectFade, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

// ヒーローのクロスフェードカルーセル（src/assets/images/hero の画像を自動切り替え）
export const initSlider = () => {
  const heroSwiperEl = document.querySelector(".hero__swiper");
  if (!heroSwiperEl) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const heroSwiper = new Swiper(heroSwiperEl, {
    modules: [EffectFade, Autoplay],
    effect: "fade",
    fadeEffect: { crossFade: false },
    slidesPerView: 1,
    loop: true,
    allowTouchMove: false,
    speed: prefersReducedMotion ? 0 : 1600,
    autoplay: {
      delay: 4500,
      disableOnInteraction: false,
    },
  });

  // オープニング（hero.js）が終わるまで autoplay を止めておく。
  // reduced-motion ではゲートしない（合図となる演出自体がスキップされるため）
  if (!prefersReducedMotion) {
    heroSwiper.autoplay.stop();
    document.addEventListener(
      "hero:animation-complete",
      () => heroSwiper.autoplay.start(),
      { once: true },
    );
  }
};
