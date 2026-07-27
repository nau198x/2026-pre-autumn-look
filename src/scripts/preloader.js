import { lockScroll, unlockScroll } from "./utils/scroll-lock.js";

const LERP_ALPHA = 0.15; // 表示 % が目標に追いつく速さ（0-1、大きいほど速い）
const FINAL_FILL_MS = 200; // 完了時に残りを一気に埋める時間
const LOGO_FADE_MS = 600; // ロゴフェードアウト時間

const hidePreloader = (preloader) => {
  preloader.classList.add("is-hidden");
  preloader.addEventListener(
    "transitionend",
    () => {
      preloader.remove();
    },
    { once: true },
  );
};

// ロゴが下から塗り上がるプリローダー。進捗は「画像の読み込み率」と
// 「最低表示時間に対する経過率」の低い方を採り、LERP で滑らかに追従させる。
export const runPreloader = ({
  heroImgSelector = "",
  fontSpec = "",
  minDisplayMs = 1500,
  timeoutMs = 5000,
  onComplete = () => {},
} = {}) => {
  // リロード時のスクロール位置復元を無効化し、必ずページ先頭から始める。
  // 復元されたままだと Hero が画面外にあるのにイントロだけが進行し、
  // 何も見えないままスクロールがロックされた状態になる
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  const preloader = document.querySelector("[data-preloader]");

  // プリローダー DOM が無い構成でも後続を止めない
  if (!preloader) {
    onComplete();
    return;
  }

  lockScroll();

  const heroImgs = heroImgSelector
    ? [...document.querySelectorAll(heroImgSelector)]
    : [];
  const total = heroImgs.length;
  let imageRatio = total === 0 ? 1 : 0;
  let displayedPct = 0;
  let finishing = false;
  let fontsReady = false;
  const startTime = performance.now();

  // ダウンロード完了（complete）だけでなくデコード到達までを完了条件にする。
  // complete のみだと初回描画時にデコード待ちのカクつきが出るため。
  // decode() がハングしても timeoutMs の安全網で必ず開く
  let imagesDecoded = total === 0;
  Promise.allSettled(heroImgs.map((img) => img.decode())).then(() => {
    imagesDecoded = true;
  });

  // フォント待機（FOUT 対策）。"1rem Marcellus" 形式の文字列 or その配列
  const specs = Array.isArray(fontSpec) ? fontSpec : fontSpec ? [fontSpec] : [];
  const fontPromise =
    specs.length && document.fonts?.load
      ? Promise.all(specs.map((spec) => document.fonts.load(spec)))
      : Promise.resolve();

  fontPromise
    .catch(() => {})
    .finally(() => {
      fontsReady = true;
    });

  const setProgress = (pct) => {
    preloader.style.setProperty("--progress", `${pct}%`);
  };

  const recomputeImageRatio = () => {
    if (total === 0) return;
    imageRatio = heroImgs.filter((img) => img.complete).length / total;
  };

  for (const img of heroImgs) {
    if (!img.complete) {
      img.addEventListener("load", recomputeImageRatio, { once: true });
      img.addEventListener("error", recomputeImageRatio, { once: true }); // 失敗も完了扱い
    }
  }
  recomputeImageRatio();

  const finish = () => {
    if (finishing) return;
    finishing = true;
    const fillStart = performance.now();
    const fromPct = displayedPct;

    const fillStep = () => {
      const t = Math.min((performance.now() - fillStart) / FINAL_FILL_MS, 1);
      setProgress(fromPct + (100 - fromPct) * t);
      if (t < 1) {
        requestAnimationFrame(fillStep);
        return;
      }
      setProgress(100);
      preloader.classList.add("is-logo-hidden");
      setTimeout(() => {
        // スクロールロックを先に外してから後続へ引き渡す
        // （overflow: hidden のまま ScrollTrigger を初期化すると
        //   下方トリガーの位置計算が破綻するため）
        unlockScroll();
        onComplete();
        hidePreloader(preloader);
      }, LOGO_FADE_MS);
    };
    requestAnimationFrame(fillStep);
  };

  const tick = () => {
    if (finishing) return;
    const elapsed = performance.now() - startTime;
    const timeRatio = Math.min(elapsed / minDisplayMs, 1);
    // 画像進捗と時間進捗の低い方 = 早すぎず、実態より進みすぎない
    const targetPct = Math.min(imageRatio, timeRatio) * 100;

    displayedPct += (targetPct - displayedPct) * LERP_ALPHA;
    setProgress(displayedPct);

    const timedOut = elapsed >= timeoutMs;
    const ready =
      timeRatio >= 1 && imageRatio >= 1 && imagesDecoded && fontsReady;

    if (timedOut || ready) {
      finish();
      return;
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};
