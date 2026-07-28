import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// エントリポイント側の登録に依存すると import 順の変更で静かに壊れるので、
// このモジュール内で自己完結して登録する
gsap.registerPlugin(ScrollTrigger);

// スクロール位置に応じて出し入れするフローティング CTA。
// 表示 / 非表示は独立した 2 つの真偽値で持ち、AND で最終状態を決める。
// 1 本の ScrollTrigger にまとめると、上方向の戻りや終端付近の往復で状態が壊れる。
export const initFloatingCta = ({
  showTrigger = ".hero",
  hideTrigger = ".footer",
} = {}) => {
  const root = document.querySelector(".floating-cta");
  if (!root) return; // ボタン自体が無いページでは何もしない

  const showEl = document.querySelector(showTrigger);
  const hideEl = document.querySelector(hideTrigger);
  if (!showEl) return; // 表示トリガーが無いと永久に出せないため機能ごと無効化

  let pastShowPoint = false; // 表示開始トリガーを通過済みか
  let insideHideZone = false; // 終端の非表示ゾーンに入っているか

  const update = () => {
    const visible = pastShowPoint && !insideHideZone;
    root.classList.toggle("is-visible", visible);
    // opacity: 0 だけではフォーカスと読み上げの対象に残るので inert で完全に外す
    root.toggleAttribute("inert", !visible);
  };

  // 表示開始: トリガーの下端がビューポート中央を通過した時点で表示
  ScrollTrigger.create({
    trigger: showEl,
    start: "bottom center",
    onEnter: () => {
      pastShowPoint = true;
      update();
    },
    onLeaveBack: () => {
      pastShowPoint = false;
      update();
    },
  });

  // 非表示: 終端要素の上端がビューポート下端に触れた時点で隠す。
  // hideEl が無い場合はこのブロックごとスキップし、表示制御だけで動作継続する
  if (hideEl) {
    ScrollTrigger.create({
      trigger: hideEl,
      start: "top bottom",
      onEnter: () => {
        insideHideZone = true;
        update();
      },
      onLeaveBack: () => {
        insideHideZone = false;
        update();
      },
    });
  }

  // 初期状態を確定（リロードでページ途中から始まった場合も inert が正しく付く）
  update();
};
