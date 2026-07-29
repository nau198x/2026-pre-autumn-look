import { lockScroll, unlockScroll } from "./utils/scroll-lock.js";

const LERP_ALPHA = 0.15; // 表示 % が目標に追いつく速さ（0-1、大きいほど速い）
const FINAL_FILL_MS = 200; // 完了時に残りを一気に埋める時間
const LOGO_FADE_MS = 600; // ロゴフェードアウト時間

const hidePreloader = (preloader) => {
  preloader.classList.add("is-hidden");
  // transitionend はバブルするので、子（.preloader__logo のフェード）の完了を
  // 拾わないよう自分自身のイベントに限定する。ロゴのフェード完了と
  // この登録はほぼ同時刻なので、絞らないと早期に remove されうる
  const onEnd = (e) => {
    if (e.target !== preloader) return;
    preloader.removeEventListener("transitionend", onEnd);
    preloader.remove();
  };
  preloader.addEventListener("transitionend", onEnd);
};

// ロゴが下から塗り上がるプリローダー。進捗は「画像の読み込み率」と
// 「最低表示時間に対する経過率」の低い方を採り、LERP で滑らかに追従させる。
// タイムアウトは「停滞ベース」: 進捗（画像 1 枚の完了・decode・フォント）が
// stallTimeoutMs の間まったく無いときだけ強制オープンする。固定時間で切ると
// 低速回線（Hero 6 枚 ≈ 1MB が間に合わない）でタイムアウトが通常経路になり、
// 未ロードの真っ白な写真のままイントロが始まってしまう。
// 「遅いが進んでいる」なら待ち続け、「壊れて止まった」ときだけ諦める
// requiredImgSelector を指定すると「開く判定」だけをその部分集合に絞れる。
// 進捗表示と停滞検知は heroImgSelector（全枚）のまま残すのが要点で、
// 待機対象そのものを 1 枚に減らすと進捗が 0/1 の二値になり、
// ロゴの塗りが 0% で固まってから最後に飛ぶ（低速回線ほど顕著）。
// 未指定なら heroImgSelector と同じ集合＝従来どおりの挙動
export const runPreloader = ({
  heroImgSelector = "",
  requiredImgSelector = "",
  fontSpec = "",
  minDisplayMs = 1500,
  stallTimeoutMs = 10000,
  maxWaitMs = 60000, // 暴走保険の絶対上限（進捗があり続けても超えたら開く）
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
  // 開く判定に使う必須集合。未指定なら全枚（＝従来どおり）
  const requiredImgs = requiredImgSelector
    ? [...document.querySelectorAll(requiredImgSelector)]
    : heroImgs;
  const requiredTotal = requiredImgs.length;
  let imageRatio = total === 0 ? 1 : 0;
  let requiredRatio = requiredTotal === 0 ? 1 : 0;
  let displayedPct = 0;
  let finishing = false;
  let fontsReady = false;
  const startTime = performance.now();

  // ダウンロード完了（complete）だけでなくデコード到達までを完了条件にする。
  // complete のみだと初回描画時にデコード待ちのカクつきが出るため。
  // decode() がハングしても停滞タイムアウトの安全網で必ず開く
  let requiredDecoded = requiredTotal === 0;
  Promise.allSettled(requiredImgs.map((img) => img.decode())).then(() => {
    requiredDecoded = true;
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
    if (total > 0) {
      imageRatio = heroImgs.filter((img) => img.complete).length / total;
    }
    if (requiredTotal > 0) {
      requiredRatio =
        requiredImgs.filter((img) => img.complete).length / requiredTotal;
    }
  };

  // 必須集合が heroImgs の外にある構成でも取りこぼさないよう、両方に張る
  for (const img of new Set([...heroImgs, ...requiredImgs])) {
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

  // 停滞検知: 進捗シグナルが変化した時刻を覚えておく。
  // 粒度は「画像 1 枚の完了」なので、1 枚（最大 ~256KB）が stallTimeoutMs 内に
  // 落ちない極端な回線（~200kbps 未満）では停滞と誤判定して開く。それは許容
  let lastProgressAt = startTime;
  let lastProgressSignature = "";

  const tick = () => {
    if (finishing) return;
    const now = performance.now();
    const elapsed = now - startTime;
    const timeRatio = Math.min(elapsed / minDisplayMs, 1);
    // 画像進捗と時間進捗の低い方 = 早すぎず、実態より進みすぎない
    const targetPct = Math.min(imageRatio, timeRatio) * 100;

    displayedPct += (targetPct - displayedPct) * LERP_ALPHA;
    setProgress(displayedPct);

    const signature = `${imageRatio}|${requiredRatio}|${requiredDecoded}|${fontsReady}`;
    if (signature !== lastProgressSignature) {
      lastProgressSignature = signature;
      lastProgressAt = now;
    }

    const timedOut =
      now - lastProgressAt >= stallTimeoutMs || elapsed >= maxWaitMs;
    const ready =
      timeRatio >= 1 && requiredRatio >= 1 && requiredDecoded && fontsReady;

    if (timedOut || ready) {
      finish();
      return;
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
};
