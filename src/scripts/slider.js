import gsap from "gsap";
import Swiper from "swiper";
import { EffectFade, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

// 切り替えの時間設計。Ken Burns の尺はこの 2 つから導出するので必ず定数経由で参照する
const AUTOPLAY_DELAY = 2000;
const FADE_SPEED = 1600;

// Ken Burns の拡大レート（scale / 秒）。承認済みの「3.6 秒（静止 2.0 + フェード 1.6）で
// 1.06 に到達」から導出した秒速。尺を変えても体感速度が変わらないようレートで持つ
const KEN_BURNS_RATE = 0.06 / 3.6;

// 1 枚のズーム尺 = 自分のフェードイン 1.6 + 静止 2.0 + 次の 1 枚に覆われていく 1.6。
// 最後の「覆われていく」区間を含めないと、次のフェードが始まる瞬間に手前で
// 大きく写っている画像が静止し、画面全体の動きが一瞬死ぬ（引っかかりになる）
const CYCLE_SECONDS = (AUTOPLAY_DELAY + FADE_SPEED * 2) / 1000;

// 引き継ぎ後、1 枚目が完全に隠れるまでの時間（autoplay 始動 2.0 + フェード 1.6）。
// hero.js がイントロ終わり際に始める先行ズームの尺の材料として使う
export const HANDOVER_VISIBLE_SECONDS = (AUTOPLAY_DELAY + FADE_SPEED) / 1000;

// 指定秒数ぶん、1.0 から等速で拡大し続ける（Ken Burns の数式はここに一元化）。
// 切り替えごとの再開と、hero.js のイントロ終わり際の先行開始の両方が使う。
// 対象は <img>。Swiper の effect-fade は .swiper-slide 側へ inline の
// transform / opacity を毎回書き込むので、slide を対象にすると取り合いになる
export const startKenBurnsZoom = (img, seconds) =>
  gsap.fromTo(
    img,
    { scale: 1 },
    {
      scale: 1 + KEN_BURNS_RATE * seconds,
      duration: seconds,
      ease: "none", // 等速。切り替えの前後で新旧の速度が揃い、動きが途切れない
      // "auto" = scale を書く既存 tween だけを消す。true だと hero.js の先行開始時に
      // まだ走っている回転戻し tween（rotation）まで即殺し、傾きが残留する
      overwrite: "auto",
    },
  );

// ヒーローのクロスフェードカルーセル（src/assets/images/hero の画像を自動切り替え）
export const initSlider = () => {
  const heroSwiperEl = document.querySelector(".hero__swiper");
  if (!heroSwiperEl) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // オープニング（hero.js の重なり演出）の最中は拡大させない。同じ <img> に
  // hero.js が rotation / xPercent を書いているため。hero:animation-complete で
  // true になる。reduced-motion ではそのリスナーを張らないので false のままとなり、
  // Ken Burns も自動的に無効になる（個別の判定を足さなくてよい）
  let handedOver = false;

  // 表示中の 1 枚のズームを開始する。
  // 切り替え開始時点で次の画像はまだ opacity 0（そこから speed かけて 1 へ）。
  // 等倍へのリセットはその不可視の間に済むので見えない
  const zoomActiveSlide = (swiper) => {
    if (!handedOver) return;

    // loop: true でスライドの並びが入れ替わっても、Swiper 自身が「今アクティブ」と
    // 見なす要素を辿るので DOM 順に依存しない
    const activeImg = swiper.slides[swiper.activeIndex]?.querySelector("img");
    if (!activeImg) return;

    startKenBurnsZoom(activeImg, CYCLE_SECONDS);
  };

  // ヒーロー画像すべてのロード完了を待つ。通常はプリローダーが全枚の decode まで
  // 待つので即解決する。停滞タイムアウトで早期に開いた場合に、未ロードのスライドへ
  // 切り替わって白飛びするのを防ぐ保険。
  // 失敗（error）も完了扱いにして、1 枚の破損で自動送りが永久に止まるのを防ぐ
  const waitForAllHeroImages = () =>
    Promise.all(
      [...heroSwiperEl.querySelectorAll("img")].map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            }),
      ),
    );

  const heroSwiper = new Swiper(heroSwiperEl, {
    modules: [EffectFade, Autoplay],
    effect: "fade",
    fadeEffect: { crossFade: false },
    slidesPerView: 1,
    loop: true,
    allowTouchMove: false,
    speed: prefersReducedMotion ? 0 : FADE_SPEED,
    autoplay: {
      delay: AUTOPLAY_DELAY,
      disableOnInteraction: false,
    },
    on: {
      // init では呼ばない。この時点はまだオープニング中で hero.js が同じ <img> を
      // 動かしており、書いた scale も完了時の clearProps で消える。
      // ハンドラを直接渡さず包むのは、第 2 引数（尺）に Swiper の引数が
      // 紛れ込まないようにするため
      slideChangeTransitionStart: (swiper) => zoomActiveSlide(swiper),
    },
  });

  // オープニング（hero.js）が終わるまで autoplay を止めておく。
  // reduced-motion ではゲートしない（合図となる演出自体がスキップされるため）
  if (!prefersReducedMotion) {
    heroSwiper.autoplay.stop();
    document.addEventListener(
      "hero:animation-complete",
      () => {
        handedOver = true;
        // 1 枚目のズームはここでは始めない。hero.js が拡大の終わり際から先行開始
        // しており、ここで startKenBurnsZoom を呼ぶと走行中の scale が 1 へ
        // スナップして逆に引っかかる。
        // 自動送りは全枚が揃ってから（停滞タイムアウトで早期に開いた場合の保険）
        waitForAllHeroImages().then(() => heroSwiper.autoplay.start());
      },
      { once: true },
    );
  }
};
