import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// 背面に sticky で留まる Hero を、コンテンツのせり上がりに合わせてゆっくり上へ逃がす。
// Hero 速度 0.15 対 コンテンツ速度 1 の差がパララックスになる。
export const initHeroParallax = () => {
  const hero = document.querySelector(".hero");
  const contents = document.querySelector(".contents");
  if (!hero || !contents || prefersReducedMotion) return;

  // トリガーは sticky な .hero ではなく通常フローの .contents を使う。
  // sticky 要素は「貼り付いた位置」で測られるため、スクロール途中の
  // ScrollTrigger.refresh()（リサイズ等）で start / end が狂う。
  gsap.to(hero, {
    yPercent: -15,
    ease: "none",
    scrollTrigger: {
      trigger: contents,
      start: "top bottom", // スクロール 0（.contents の上端が画面下端）
      end: "top top", // 1 画面ぶんスクロールし切り、Hero が覆い隠された地点
      scrub: true,
      invalidateOnRefresh: true,
    },
  });
};

export const initScrollAnimations = () => {
  if (prefersReducedMotion) return;

  for (const el of gsap.utils.toArray("[data-animate]")) {
    gsap.fromTo(
      el,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      },
    );
  }
};
