// スクロールロック ユーティリティ
// wheel / touchmove を preventDefault し、body にクラスを付与して
// CSS 側の overflow:hidden + touch-action:none + overscroll-behavior:none を効かせる。
// （body の overflow:hidden だけでは iOS Safari のタッチスクロールが止まらない）

const CLASS_NAME = "is-scroll-locked";

const preventScroll = (e) => e.preventDefault();

export const lockScroll = () => {
  document.body.classList.add(CLASS_NAME);
  window.addEventListener("wheel", preventScroll, { passive: false });
  window.addEventListener("touchmove", preventScroll, { passive: false });
};

export const unlockScroll = () => {
  document.body.classList.remove(CLASS_NAME);
  window.removeEventListener("wheel", preventScroll);
  window.removeEventListener("touchmove", preventScroll);
};

export const isScrollLocked = () =>
  document.body.classList.contains(CLASS_NAME);
