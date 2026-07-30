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
import "../styles/floating-cta.css";
import "../styles/footer.css";

import {
  initCreditsReveal,
  initLookHeadingReveal,
  initScrollAnimations,
} from "./animations.js";
import { initFloatingCta } from "./floating-cta.js";
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
    // ロゴ（ROPÉ）を 1 文字ずつ消すための分割。各要素は [左, 右]（ロゴ幅に対する %）。
    // ロゴを差し替えたら測り直すこと: SVG を開いて各 <path> の getBBox() を取り、
    // 隣り合う文字の「隙間の中間」で切ると 1 文字も欠けない
    //（この 4 値は R 0〜23.04% / O 27.16〜49.17% / P 53.93〜75.20% / É 79.58〜100% から算出）
    logoBands: [
      [0, 25.1],
      [25.1, 51.55],
      [51.55, 77.39],
      [77.39, 100],
    ],
    fontSpec: ["1rem Marcellus"],
    minDisplayMs: 1000,
    // タイムアウトは停滞ベース: 進捗が止まって 10 秒で強制オープン、
    // 進み続けても 60 秒で必ず開く。低速回線では進捗がある限り待つので
    // 未ロードの真っ白なイントロにはならない。
    // maxWaitMs を変えたら hero.js の LOADING_FALLBACK_MS も見直す
    stallTimeoutMs: 10000,
    maxWaitMs: 60000,
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
      // 一括で実行すると数十 ms メインスレッドが止まり、走行中の Hero の
      // Ken Burns がその瞬間だけコマ落ちして引っかかる。1 フレーム 1 init に
      // 分散する（順序は維持。ScrollTrigger は作成時に現在のスクロール位置で
      // 評価されるので、数フレーム遅れても通過済みのトリガーは即発火する）
      const steps = [
        // 文字分割で見出しの高さが動きうるので、[data-animate] の
        // ScrollTrigger を生成する initScrollAnimations より先に呼ぶ
        initLookHeadingReveal,
        initCreditsReveal,
        initScrollAnimations,
        // フローティング CTA も ScrollTrigger 製なので、他と同じくロック解除後に作る。
        // 上部の ONLINE STORE を通過したら出し、下部の ONLINE STORE が見えたら消す
        () =>
          initFloatingCta({
            showTrigger: '[data-floating-cta="show"]',
            hideTrigger: '[data-floating-cta="hide"]',
          }),
      ];
      const runStep = (index) => {
        if (index >= steps.length) return;
        steps[index]();
        requestAnimationFrame(() => runStep(index + 1));
      };
      runStep(0);
    },
    { once: true },
  );
});
