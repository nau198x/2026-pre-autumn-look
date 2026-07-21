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

  new Swiper(heroSwiperEl, {
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
};
