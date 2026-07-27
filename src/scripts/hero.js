import gsap from "gsap";

import { lockScroll, unlockScroll } from "./utils/scroll-lock.js";

// 調整レバー
const START_DELAY = 0.3; // 白背景で見せる間
const FADE_INTERVAL = 0.5; // 次の画像が出始めるまでの間隔（フェード時間の半分 = 同時 2 枚まで）
const FADE_DURATION = 1.2; // 1 枚あたりのフェード時間（間隔より長く、重なりながら溶ける）
const EXPAND_DURATION = 1; // 7 割サイズ → 全画面への拡大
const OVERLAY_DURATION = 0.6; // ロゴ・キャッチのフェードイン
const DECODE_TIMEOUT = 3500; // 画像 decode 待ちの安全網
const ROTATIONS = [-4, 3, -5, 3.5, -2.5, 2]; // フェード順（6→1）の着地角度。正負交互・最後は控えめ
const SETTLE_ANGLE = 2; // 置かれるニュアンス: この分だけ深い角度から入って落ち着く
const SLIDE_X = 3; // 入場時の横オフセット（%）。左下 / 右下から交互に差し込まれる
const SLIDE_Y = 3; // 入場時の下オフセット（%）
const EXPAND_OVERLAP = 0.45; // 最後の 1 枚のフェード完了を待たずに拡大へ移る前倒し量

const fireComplete = () =>
  document.dispatchEvent(new Event("hero:animation-complete"));

// オープニング: 白背景 → 6 枚が 7 割サイズで 1 枚ずつ重なりながらフェード出現
// （6 → 1 の逆順。1 枚目で締める）→ そのまま画面いっぱいへ拡大 → ロゴ・キャッチ表示。
// 初期非表示は hero.css の .hero:not(.is-hero-ready) ガードが担う（FOUC 防止）。
export const initHero = () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const root = document.querySelector(".hero");

  // スキップ経路でも下流（autoplay ゲート・ScrollTrigger 初期化）へのイベントは
  // 必ず発火する。同期 dispatch だと購読登録前に流れるため rAF を 1 つ挟む
  if (!root || prefersReducedMotion) {
    requestAnimationFrame(fireComplete);
    return;
  }

  const swiperEl = root.querySelector(".hero__swiper");
  const overlay = root.querySelector(".hero__overlay");
  const slides = [...root.querySelectorAll(".swiper-slide")];
  const images = slides.map((slide) => slide.querySelector("img"));

  lockScroll();

  // Swiper(fade) は非アクティブ slide に inline の opacity: 0 を書くため、
  // slide 親は全て可視化し、表示制御は CSS ガードで隠してある img 側で行う
  gsap.set(slides, { opacity: 1 });

  const play = () => {
    const tl = gsap.timeline({
      delay: START_DELAY,
      onComplete: () => {
        // Swiper fade の静止状態（先頭のみ可視）へ戻してから z-index を解除する。
        // 全 slide 可視のまま解除すると DOM 順で 6 枚目が最前面に描かれてしまう
        gsap.set(slides.slice(1), { opacity: 0 });
        gsap.set(slides, { clearProps: "zIndex" });
        gsap.set(images, { clearProps: "opacity,transform" });
        gsap.set(swiperEl, { clearProps: "transform" });
        gsap.set(overlay, { clearProps: "opacity" });
        root.classList.add("is-hero-ready"); // CSS ガード解除（背景も既定色へ戻る）
        unlockScroll();
        fireComplete();
      },
    });

    // 出現順（6 → 1 の逆順）に z-index を積み、常に新しい画像が上に乗るようにする。
    // 各写真は着地角度よりやや深い角度から、かつ左下 / 右下から差し込まれ、
    // フェード中に定位置へ落ち着く（置かれるニュアンス）。
    // 入場方向は回転の符号と連動させる（負の角度＝左下から / 正の角度＝右下から）
    const fadeOrder = [...slides.keys()].reverse();
    for (const [i, slideIndex] of fadeOrder.entries()) {
      const angle = ROTATIONS[i % ROTATIONS.length];
      const entryAngle = angle + (angle >= 0 ? SETTLE_ANGLE : -SETTLE_ANGLE);
      const entryX = angle < 0 ? -SLIDE_X : SLIDE_X;
      tl.set(slides[slideIndex], { zIndex: i + 1 }, 0);
      tl.fromTo(
        images[slideIndex],
        {
          opacity: 0,
          rotation: entryAngle,
          xPercent: entryX,
          yPercent: SLIDE_Y,
        },
        {
          opacity: 1,
          rotation: angle,
          xPercent: 0,
          yPercent: 0,
          duration: FADE_DURATION,
          ease: "power2.out",
        },
        i * FADE_INTERVAL,
      );
    }

    // 1 枚目のフェードが載り切る少し前から全画面へ拡大（EXPAND_OVERLAP 分の前倒し）。
    // 並行して全枚の回転を正体に戻す → 仕上げにロゴ・キャッチ。
    // 1 枚目の rotation は着地 tween と重なるが、後着の戻し tween が勝つので滑らかに繋がる
    tl.to(
      swiperEl,
      {
        scale: 1,
        duration: EXPAND_DURATION,
        ease: "power2.inOut",
      },
      `-=${EXPAND_OVERLAP}`,
    );
    tl.to(
      images,
      { rotation: 0, duration: EXPAND_DURATION, ease: "power2.inOut" },
      "<",
    );
    tl.to(overlay, {
      opacity: 1,
      duration: OVERLAY_DURATION,
      ease: "power1.out",
    });
  };

  // 白背景での待機が実質ミニプリローダー。decode 失敗（404 等）でも allSettled で
  // 止まらず、タイムアウトの安全網で必ず開演する
  const decoded = Promise.allSettled(images.map((img) => img.decode()));
  const timeout = new Promise((resolve) => setTimeout(resolve, DECODE_TIMEOUT));
  Promise.race([decoded, timeout]).then(play);
};
