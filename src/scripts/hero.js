import gsap from "gsap";

import { HANDOVER_VISIBLE_SECONDS, startKenBurnsZoom } from "./slider.js";
import { lockScroll, unlockScroll } from "./utils/scroll-lock.js";
import { splitCharsByWord } from "./utils/split-text.js";

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
// キャッチ 1 文字の黒 → 白ブレンド時間。スイープ全体（duration + stagger の amount）は
// 拡大の EXPAND_DURATION にちょうど納め、拡大の完了と同時に染め終わる
const CHAR_COLOR_DURATION = 0.3;
// 冒頭のオーバーレイ（黒ロゴ・黒キャッチ）のフェードイン時間
const OVERLAY_FADE_DURATION = 0.6;
// オーバーレイのフェード完了後、写真の重なりが始まるまでの間
const OVERLAY_HOLD = 0.1;
// 写真群の開始オフセット。オーバーレイを先に見せ、ひと呼吸置いてから写真に入る
const PHOTOS_START = OVERLAY_FADE_DURATION + OVERLAY_HOLD;
// プリローダーが来ない場合の保険。内訳は preloader の maxWaitMs 60000
// + ロゴフェード 600 + カバーフェード 800 + バッファ 2000。
// main.js の maxWaitMs を変えたらこの値も連動して見直すこと
const LOADING_FALLBACK_MS = 63400;
const ROTATIONS = [-4, 3, -5, 3.5, -2.5, 2]; // フェード順（6→1）の着地角度。正負交互・最後は控えめ
// 着地 X（xPercent）。センター一列ではなく左右交互に散らして重ねる（ポラロイド風）。
// 符号は ROTATIONS と連動 = 入場方向と同じ側に着地して手前で止まる。
// 回転が最大の i=2（入場 −7°）には相対的に小さい値を充て、張り出しの偏りを抑える。
// この振り幅では SP（390x844 実測余白 58.5px/側）の入場瞬間だけ数 px はみ出すが、
// 画面端で刈られてよい合意済み（着地後は SP でも収まる）。
// PC はレターボックス（720px 幅）内で入場最悪時 97px < 余白 108px で切れない
const LANDING_X = [0, 4, -3, 5, -4, 3];
// 着地 Y（yPercent）。高さも散らして自然な山にする。縦の余白は潤沢
// （SP 126px / PC 135px に対し入場瞬間の最悪合算でも ~76 / ~90px）で切れの心配なし。
// 符号は X の交互パターン（−+−+−+）と意図的に揃えない: 両軸が連動すると
// 斜めジグザグの規則性が見えてしまうため、i=1→2 で同符号を挟むなど崩してある
const LANDING_Y = [-2, -4, 3, -2, 5, 0];
// 置かれるニュアンス: この分だけ深い角度から入り、回転しながら落ち着く。
// 入場最大角は ROTATIONS 最大 5° + この値。SP は入場の瞬間に最大 ~15px
// 画面端で刈られるが、はみ出しは許容の合意済み（着地後は画面内に収まる）
const SETTLE_ANGLE = 4;
// 入場時の振り（%）。着地 X からさらに左下 / 右下へ離れた位置から差し込まれる
// （LANDING_X からの相対値。移動量は常にこの値）。
// これ以上大きくすると .hero の overflow: hidden で角が切れる。余裕の計算は
// LANDING_X のコメントを参照（着地 X との合算で予算が決まる）
const SLIDE_X = 6;
const SLIDE_Y = 6;
const EXPAND_OVERLAP = 0.45; // 最後の 1 枚のフェード完了を待たずに拡大へ移る前倒し量
// Ken Burns（slider.js）を拡大が終わるこの秒数だけ手前から先行開始する。
// 拡大（power2.inOut）の減速テールとズームの等速が重なり、速度がゼロになる
// 瞬間が消える。0.3 は拡大の減速がほぼ済んでいる位置。効きすぎたら縮める
const KEN_BURNS_PRELUDE = 0.3;

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

// オープニング: 白背景に黒のロゴ（センター）・黒のキャッチをフェードインで見せてから、
// 6 枚が 7 割サイズで 1 枚ずつ重なりながらフェード出現（6 → 1 の逆順。1 枚目で締める）
// → 画面いっぱいへ拡大しつつ、キャッチを左から 1 文字ずつ白へ・ロゴを右隅へ移す。
// 写真の初期非表示は hero.css の .hero:not(.is-hero-ready) ガードが担う（FOUC 防止）。
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
  const slides = [...root.querySelectorAll(".swiper-slide")];
  const images = slides.map((slide) => slide.querySelector("img"));
  // オーバーレイまわり。欠けている要素があればその演出だけスキップする（テンプレ耐性）
  const overlay = root.querySelector(".hero__overlay");
  const logoLink = root.querySelector("a.hero__logo");
  const logoImg = logoLink?.querySelector("img");
  const catchEl = root.querySelector(".hero__catch");
  const catchLineEls = [
    ".hero__catch-sub",
    ".hero__catch-line--a",
    ".hero__catch-line--b",
  ]
    .map((selector) => catchEl?.querySelector(selector))
    .filter(Boolean);

  const play = () => {
    // --- オーバーレイのイントロ状態（黒テキスト・ロゴセンター）を先に作る ---
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
    // 1 本の連続スイープに束ねる。SP は 3 行が縦積みなので行ごとに並走させ、
    // 「全行が同時に左から染まる」を保つ
    const isPcCatch = window.matchMedia("(width >= 768px)").matches;
    const sweepGroups =
      isPcCatch && lineCharGroups.length === 3
        ? [lineCharGroups[0], [...lineCharGroups[1], ...lineCharGroups[2]]]
        : lineCharGroups;
    const allChars = lineCharGroups.flat();

    // デザイントークンは実値へ解決してから GSAP に渡す
    const rootStyle = getComputedStyle(document.documentElement);
    const textColor = rootStyle.getPropertyValue("--color-text").trim();
    const inverseColor = rootStyle.getPropertyValue("--color-inverse").trim();

    // 白背景に載るイントロ中は黒テキスト・黒ロゴ。ロゴは X だけセンターへ寄せる
    // （白 SVG は brightness(0) で黒になり、テキストの --color-text #000 と揃う）。
    // CSS には最終状態（白・右隅）だけを持たせてあるので、
    // JS 無効・reduced-motion ではこのイントロ状態は一切作られない
    gsap.set(allChars, { color: textColor });
    // オーバーレイ自体は冒頭でフェードインさせるため、いったん透明にしておく
    if (overlay) gsap.set(overlay, { opacity: 0 });
    if (logoImg) gsap.set(logoImg, { filter: "brightness(0)" });
    if (logoLink) {
      const heroRect = root.getBoundingClientRect();
      const logoRect = logoLink.getBoundingClientRect();
      gsap.set(logoLink, {
        x:
          heroRect.left +
          heroRect.width / 2 -
          (logoRect.left + logoRect.width / 2),
      });
    }

    const tl = gsap.timeline({
      delay: START_DELAY,
      onComplete: () => {
        // Swiper fade の静止状態（先頭のみ可視）へ戻してから z-index を解除する。
        // 全 slide 可視のまま解除すると DOM 順で 6 枚目が最前面に描かれてしまう
        gsap.set(slides.slice(1), { opacity: 0 });
        gsap.set(slides, { clearProps: "zIndex" });
        // 1 枚目（images[0]）は先行開始した Ken Burns の scale が走行中なので
        // transform を消さない（rotation 等は 0 に着地済みで実害なし）
        gsap.set(images.slice(1), { clearProps: "opacity,transform" });
        gsap.set(images[0], { clearProps: "opacity" });
        gsap.set(swiperEl, { clearProps: "transform" });
        // オーバーレイのイントロ用 inline 値を CSS の完成状態（白・右隅）へ解く。
        // 各 tween は最終値 = CSS 値で終わっているので見た目は変わらない
        if (allChars.length) gsap.set(allChars, { clearProps: "color" });
        if (logoLink) gsap.set(logoLink, { clearProps: "transform" });
        if (logoImg) gsap.set(logoImg, { clearProps: "filter" });
        if (overlay) gsap.set(overlay, { clearProps: "opacity" });
        root.classList.add("is-hero-ready"); // CSS ガード解除（背景も既定色へ戻る）
        unlockScroll();
        fireComplete();
      },
    });

    // 冒頭: オーバーレイ（黒ロゴ・黒キャッチ）をフェードインで見せる。
    // 白背景の間（START_DELAY）は透明のまま、1 枚目の写真の入場と同時に現れ始める
    if (overlay) {
      tl.to(
        overlay,
        { opacity: 1, duration: OVERLAY_FADE_DURATION, ease: "power1.out" },
        0,
      );
    }

    // 出現順（6 → 1 の逆順）に z-index を積み、常に新しい画像が上に乗るようにする。
    // 各写真は着地角度よりやや深い角度から、かつ左下 / 右下から差し込まれ、
    // フェード中に定位置へ落ち着く（置かれるニュアンス）。
    // 入場方向は回転の符号と連動させる（負の角度＝左下から / 正の角度＝右下から）
    const fadeOrder = [...slides.keys()].reverse();
    for (const [i, slideIndex] of fadeOrder.entries()) {
      const angle = ROTATIONS[i % ROTATIONS.length];
      const landingX = LANDING_X[i % LANDING_X.length];
      const landingY = LANDING_Y[i % LANDING_Y.length];
      const entryAngle = angle + (angle >= 0 ? SETTLE_ANGLE : -SETTLE_ANGLE);
      const entryX = landingX + (angle < 0 ? -SLIDE_X : SLIDE_X);
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
        PHOTOS_START + i * FADE_INTERVAL,
      );
      tl.fromTo(
        images[slideIndex],
        {
          rotation: entryAngle,
          xPercent: entryX,
          yPercent: landingY + SLIDE_Y, // 着地点よりさらに下から持ち上がる（X と同じ相対扱い）
        },
        {
          rotation: angle,
          xPercent: landingX,
          yPercent: landingY,
          duration: FADE_DURATION,
          ease: "power2.out",
        },
        PHOTOS_START + i * FADE_INTERVAL,
      );
    }

    // 1 枚目のフェードが載り切る少し前から全画面へ拡大（EXPAND_OVERLAP 分の前倒し）。
    // 並行して全枚の回転を正体に戻す。
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
    // 回転と一緒に、散らした着地 X / Y もセンターへ揃え直す（全画面で 1 枚に見せるため）
    tl.to(
      images,
      {
        rotation: 0,
        xPercent: 0,
        yPercent: 0,
        duration: EXPAND_DURATION,
        ease: "power2.inOut",
      },
      "<",
    );

    // 拡大に合わせてキャッチを左から 1 文字ずつ白へ染める。
    // stagger: { amount } なので行の文字数に関係なく duration + amount =
    // EXPAND_DURATION となり、全行が拡大の完了と同時に染め終わる。
    // 白化した文字が白地に載る瞬間は無い: 写真は拡大開始 ~0.2 秒でテキスト帯を
    // 覆うのに対し、先頭の文字が白になり切るのは CHAR_COLOR_DURATION 後
    for (const chars of sweepGroups) {
      tl.to(
        chars,
        {
          color: inverseColor,
          duration: CHAR_COLOR_DURATION,
          ease: "none",
          stagger: { amount: EXPAND_DURATION - CHAR_COLOR_DURATION },
        },
        "<",
      );
    }
    // ロゴはセンターから CSS の定位置（右隅）へ、色も黒 → 白へ。
    // どちらも拡大と同尺・同イージングにして 3 つの動きを一体化させる
    if (logoLink) {
      tl.to(
        logoLink,
        { x: 0, duration: EXPAND_DURATION, ease: "power2.inOut" },
        "<",
      );
    }
    if (logoImg) {
      tl.to(
        logoImg,
        {
          filter: "brightness(1)",
          duration: EXPAND_DURATION,
          ease: "power2.inOut",
        },
        "<",
      );
    }

    // 1 枚目の Ken Burns を拡大の終わり際から独立 tween で先行開始する
    // （タイムラインに乗せると onComplete がズーム完了まで遅れるため .call で切り離す。
    // 0 尺なのでタイムラインの終端 = 拡大終了のまま変わらない）。
    // 尺 = 前倒し 0.3 + 引き継ぎ後に完全に隠れるまで 3.6。
    // onComplete の clearProps はこの scale を対象外にしてある
    tl.call(
      () =>
        startKenBurnsZoom(
          images[0],
          KEN_BURNS_PRELUDE + HANDOVER_VISIBLE_SECONDS,
        ),
      null,
      `-=${KEN_BURNS_PRELUDE}`,
    );
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
