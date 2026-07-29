import gsap from "gsap";

import { HANDOVER_VISIBLE_SECONDS, startKenBurnsZoom } from "./slider.js";
import { lockScroll, unlockScroll } from "./utils/scroll-lock.js";
import { splitCharsByWord } from "./utils/split-text.js";

// 調整レバー
// プリローダーのカバーが消えきる時刻。ロゴのフェードは
// 「ページが完全に見えた瞬間」＝ここから動き出す。
// preloader.css の .preloader { transition: transform 0.8s }（下方向へ退場）と
// 一致させること
//（onComplete() の直後に hidePreloader() が走るので、この時刻がカバーの消滅と揃う）
const COVER_EXIT_DURATION = 0.8;
// Ken Burns だけはカバーが退き切るのを待たず、この秒数ぶん手前から始めて退場に重ねる。
// カバーの動きは ease-out で前半に偏る（実測 0.2 秒で 6 割・0.4 秒で 9 割が退く）ため、
// 現れていく最中に重ねるにはこのくらい早める必要がある。
// 大きくすると露出前から拡大が進むので、上限は COVER_EXIT_DURATION
const KEN_BURNS_OVERLAP = 0.6;
// テキスト帯（画面の下 82〜94%）がカバーの下から現れる時刻（実測 SP 0.35s / PC 0.37s）。
// カバーは下方向へ退くのでテキストは最後に現れる。ここから reveal を始めると
// 「露出 → reveal」が途切れずに繋がり、現れてから空のまま待つ間が無くなる
const TEXT_REVEAL_AT = 0.35;
const CHAR_REVEAL_DURATION = 0.7; // 1 文字がマスクからせり上がる時間
// 全行が出そろうまでの尺。stagger の amount = この値 − CHAR_REVEAL_DURATION なので、
// 行の文字数に関係なく全行が同時に出そろう
const TEXT_REVEAL_DURATION = 1;
const LOGO_FADE_DURATION = 0.8;
// プリローダーが来ない場合の保険。内訳は preloader の maxWaitMs 60000
// + ロゴが 1 文字ずつ消える 900 と余韻 500 + カバー退場 800 + バッファ 2000。
// main.js の maxWaitMs を変えたらこの値も連動して見直すこと
const LOADING_FALLBACK_MS = 64200;

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

// オープニング: プリローダーのカバーが下へ退いて 1 枚目の写真が現れ、
// カバーが消えきる瞬間にキャッチが左から 1 文字ずつせり上がり（reveal）、
// ロゴがフェードインする。ロゴの位置は CSS の定位置（右上）のまま動かさない。
// 写真自体はフェードさせない（カバーの退場がそのまま「現す」演出になっている）。
// Ken Burns も同じ瞬間から始める（引き継ぎ前なのでここが持つ）
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

  // イントロで見せるのは表示中の 1 枚だけ。Swiper が loop でスライドを
  // 並べ替えても正しい 1 枚を掴めるよう、Swiper 自身が付ける active クラスを優先する
  const activeSlide =
    root.querySelector(".swiper-slide-active") ??
    root.querySelector(".swiper-slide");
  const heroImage = activeSlide?.querySelector("img");
  // オーバーレイまわり。欠けている要素があればその演出だけスキップする（テンプレ耐性）。
  // ロゴは位置を触らないので、フェードさせる <img> だけを直接引く
  const logoImg = root.querySelector("a.hero__logo img");
  const catchEl = root.querySelector(".hero__catch");
  const catchLineEls = [
    ".hero__catch-sub",
    ".hero__catch-line--a",
    ".hero__catch-line--b",
  ]
    .map((selector) => catchEl?.querySelector(selector))
    .filter(Boolean);

  const play = () => {
    // --- オーバーレイのイントロ状態（文字はマスク内へ退避・ロゴは透明）を先に作る ---
    // 分割で .word に aria-hidden が付くため、先に h1 へ読み上げ名を退避する
    // （role を持たない素の span の aria-label は無視されるため h1 に付ける）
    if (catchEl && !catchEl.hasAttribute("aria-label")) {
      catchEl.setAttribute(
        "aria-label",
        catchEl.textContent.trim().replace(/\s+/g, " "),
      );
    }
    const lineCharGroups = catchLineEls.map((el) => [...splitCharsByWord(el)]);
    // PC はメイン 2 span が 1 行に連結される（hero.css で display: block）ため、
    // 1 本の連続した reveal に束ねる。SP は 3 行が縦積みなので行ごとに並走させ、
    // 「全行が同時に左から出てくる」を保つ
    const isPcCatch = window.matchMedia("(width >= 768px)").matches;
    const revealGroups =
      isPcCatch && lineCharGroups.length === 3
        ? [lineCharGroups[0], [...lineCharGroups[1], ...lineCharGroups[2]]]
        : lineCharGroups;
    const allChars = lineCharGroups.flat();

    // 文字は .char-mask（overflow: hidden）の外＝下へ退避させておく。
    // ロゴは透明から。どちらも CSS には最終状態しか持たせていないので、
    // JS 無効・reduced-motion ではこのイントロ状態は一切作られない
    gsap.set(allChars, { yPercent: 100 });
    if (logoImg) gsap.set(logoImg, { opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        // イントロ用の inline 値を CSS の完成状態へ解く。
        // 各 tween は最終値 = CSS 値で終わっているので見た目は変わらない。
        // heroImage は Ken Burns の scale が走行中なので触らない
        if (allChars.length) gsap.set(allChars, { clearProps: "transform" });
        if (logoImg) gsap.set(logoImg, { clearProps: "opacity" });
        root.classList.add("is-hero-ready"); // CSS ガード解除（背景も既定色へ戻る）
        unlockScroll();
        fireComplete();
      },
    });

    // キャッチはカバーの下から現れ始める瞬間に合わせて、左から 1 文字ずつせり上げる。
    // stagger: { amount } なので行の文字数に関係なく
    // duration + amount = TEXT_REVEAL_DURATION に揃い、全行が同時に出そろう
    for (const chars of revealGroups) {
      tl.to(
        chars,
        {
          yPercent: 0,
          duration: CHAR_REVEAL_DURATION,
          ease: "power2.out",
          stagger: { amount: TEXT_REVEAL_DURATION - CHAR_REVEAL_DURATION },
        },
        TEXT_REVEAL_AT,
      );
    }
    // ロゴは画面上部なので露出自体はほぼ即座だが、フェードはカバーが
    // 消えきってから始める（位置も色も動かさない）
    if (logoImg) {
      tl.to(
        logoImg,
        { opacity: 1, duration: LOGO_FADE_DURATION, ease: "power1.out" },
        COVER_EXIT_DURATION,
      );
    }

    // Ken Burns はカバーの退場に重ねて先に走らせる（写真が現れた時点で既に動いている）。
    // 引き継ぎ前に始まるので slider.js ではなくここが持つ
    //（タイムラインに乗せると onComplete がズーム完了まで遅れるため .call で切り離す。
    // 0 尺なのでタイムラインの終端は変わらない）。
    // 尺は「引き継ぎまでの残り + 引き継ぎ後に完全に隠れるまで」。終端も開始も
    // レバーから導出しているので、尺を変えてもズームの終わりが 1 枚目の消滅に追従する
    if (heroImage) {
      // 終端はテキストとロゴの、終わりが遅い方
      const introEnd = Math.max(
        TEXT_REVEAL_AT + TEXT_REVEAL_DURATION,
        COVER_EXIT_DURATION + LOGO_FADE_DURATION,
      );
      const zoomStart = Math.max(0, COVER_EXIT_DURATION - KEN_BURNS_OVERLAP);
      tl.call(
        () =>
          startKenBurnsZoom(
            heroImage,
            introEnd - zoomStart + HANDOVER_VISIBLE_SECONDS,
          ),
        null,
        zoomStart,
      );
    }
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
    play();
  });
};
