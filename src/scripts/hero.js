import gsap from "gsap";

import { lockScroll, unlockScroll } from "./utils/scroll-lock.js";

// 調整レバー
const START_DELAY = 0.3; // 白背景で見せる間
const FADE_INTERVAL = 0.5; // 次の画像が出始めるまでの間隔（フェード時間の半分 = 同時 2 枚まで）
const FADE_DURATION = 1.2; // 1 枚あたりの移動・回転の時間
// opacity だけ移動より大幅に短くし、着地のかなり手前で不透明にし切る
// （不透明のまま中心へ滑り込む区間を作るため）。
// FADE_INTERVAL 以下であることが条件で、これにより「次の 1 枚が出始める時点で
// 前の 1 枚は不透明」= 半透明同士が重ならない。FADE_INTERVAL を縮めるときは要見直し
const FADE_OPACITY_DURATION = 0.35;
const EXPAND_DURATION = 1; // 7 割サイズ → 全画面への拡大
const OVERLAY_DURATION = 0.6; // ロゴ・キャッチのフェードイン
// プリローダーが来ない場合の保険。内訳は preloader の timeoutMs 8000
// + ロゴフェード 600 + カバーフェード 800 + バッファ 2000。
// main.js の timeoutMs を変えたらこの値も連動して見直すこと
const LOADING_FALLBACK_MS = 11500;
const ROTATIONS = [-4, 3, -5, 3.5, -2.5, 2]; // フェード順（6→1）の着地角度。正負交互・最後は控えめ
const SETTLE_ANGLE = 2; // 置かれるニュアンス: この分だけ深い角度から入って落ち着く
// 入場時のオフセット（%）。左下 / 右下から交互に差し込まれる。
// これ以上大きくすると .hero の overflow: hidden で角が切れる。余裕が最も薄いのは
// 縦長ビューポート（SP 390x844 実測で残り 7px）で、6% がほぼ上限。
// 内訳は scale(0.7) の余白 15% − 回転（最大 5°）の張り出し − このオフセット
const SLIDE_X = 6;
const SLIDE_Y = 6;
const EXPAND_OVERLAP = 0.45; // 最後の 1 枚のフェード完了を待たずに拡大へ移る前倒し量

const fireComplete = () =>
  document.dispatchEvent(new Event("hero:animation-complete"));

// loading:complete を 1 回だけ購読し、来なければフォールバックで実行する。
// イベントは発火時にリスナーが居なければ消えるため、購読登録は
// プリローダー起動より前（main.js の呼び出し順）に済ませておく必要がある
const onLoadingComplete = (fn) => {
  let done = false;
  const once = () => {
    if (done) return; // イベントとフォールバックの二重実行ガード
    done = true;
    fn();
  };
  document.addEventListener("loading:complete", once, { once: true });
  setTimeout(once, LOADING_FALLBACK_MS);
};

// オープニング: 白背景 → 6 枚が 7 割サイズで 1 枚ずつ重なりながらフェード出現
// （6 → 1 の逆順。1 枚目で締める）→ そのまま画面いっぱいへ拡大 → ロゴ・キャッチ表示。
// 初期非表示は hero.css の .hero:not(.is-hero-ready) ガードが担う（FOUC 防止）。
export const initHero = () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const root = document.querySelector(".hero");

  // スキップ経路でも下流（autoplay ゲート・ScrollTrigger 初期化）へのイベントは
  // 必ず発火する。ただしローディング完了を待つこと（プリローダー表示中は
  // スクロールがロックされており、その状態で ScrollTrigger を初期化すると
  // 下方トリガーの位置計算が破綻するため）
  if (!root || prefersReducedMotion) {
    onLoadingComplete(fireComplete);
    return;
  }

  const swiperEl = root.querySelector(".hero__swiper");
  const overlay = root.querySelector(".hero__overlay");
  const slides = [...root.querySelectorAll(".swiper-slide")];
  const images = slides.map((slide) => slide.querySelector("img"));

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

      // opacity と移動を別 tween に分ける（同時開始・長さ違い）。
      // 1 本にまとめると着地の瞬間まで半透明が続き、下の写真が透けて見えてしまう
      tl.fromTo(
        images[slideIndex],
        { opacity: 0 },
        {
          opacity: 1,
          duration: FADE_OPACITY_DURATION,
          ease: "none", // フェードは等速。移動・回転側にだけイージングを効かせる
        },
        i * FADE_INTERVAL,
      );
      tl.fromTo(
        images[slideIndex],
        {
          rotation: entryAngle,
          xPercent: entryX,
          yPercent: SLIDE_Y,
        },
        {
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

  // 画像のロード待ちはプリローダー（preloader.js）の責務。ここはその完了を
  // 待つだけにする。スクロールロックはロード中＝プリローダー、
  // イントロ中＝ここ、と持ち手を引き継ぐ
  onLoadingComplete(() => {
    // 直前まで残っているスクロール復元を最後に打ち消す（index.html の head で
    // scrollRestoration は manual にしてあるが、この時点の位置を先頭に確定させる）。
    // まだプリローダーのカバーがフェード中なので、この移動は見えない
    window.scrollTo(0, 0);
    lockScroll();

    // Swiper(fade) は非アクティブ slide に inline の opacity: 0 を書くため、
    // slide 親は全て可視化し、表示制御は CSS ガードで隠してある img 側で行う
    gsap.set(slides, { opacity: 1 });

    play();
  });
};
