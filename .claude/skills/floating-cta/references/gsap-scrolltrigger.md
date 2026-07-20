# gsap-scrolltrigger — ScrollTrigger 版フローティング CTA

## 適用条件

- GSAP + ScrollTrigger がプロジェクトに導入済み（表示トリガーを ScrollTrigger に一本化する方針の LP）
- 表示開始 / 非表示の 2 トリガーを独立した ScrollTrigger で監視し、`.is-visible` クラスをトグルする
- HTML / CSS は references/css.md を併用する

## JS（floating-cta.js）

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const initFloatingCta = ({ showTrigger = ".hero", hideTrigger = ".footer" } = {}) => {
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
    root.toggleAttribute("inert", !visible); // 非表示中はフォーカス・読み上げからも除外
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

  // 非表示: 終端要素（フッター等）の上端がビューポート下端に触れた時点で隠す。
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

  // 初期状態を確定（リロード時にページ途中から始まった場合も inert が正しく付く）
  update();
};
```

`main.js` からの呼び出し:

```js
import { initFloatingCta } from "./floating-cta.js";

document.addEventListener("DOMContentLoaded", () => {
  initFloatingCta({ showTrigger: ".intro", hideTrigger: ".footer" });
});
```

## 設計メモ

- **2 トリガー独立 + AND 合成**: 表示と非表示を 1 本の ScrollTrigger で表現しようとすると、上方向スクロールの戻り・終端付近の往復で状態が壊れる。真偽値 2 つ（`pastShowPoint` / `insideHideZone`）を独立に更新して `update()` で合成するのが最も壊れない
- **`onLeaveBack` を両方に付ける**: これが無いと「上に戻ったのに出っぱなし / 消えっぱなし」になる。表示・非表示どちらの ScrollTrigger にも対で書く
- **`gsap.registerPlugin(ScrollTrigger)` はこのモジュール内で行う**: エントリポイント側の登録に依存すると、import 順の変更で静かに壊れる（元実装はエントリポイント登録に依存していたため、自己完結するよう修正）
- **`inert` トグル**: `opacity: 0` だけではキーボードフォーカスとスクリーンリーダーの読み上げ対象に残る。`toggleAttribute("inert", !visible)` で非表示中は完全に無効化する
- 発火位置を早めたい場合は `start: "bottom center"` を `"center center"` や `"bottom bottom"` に調整する。lazy 画像が多い LP では scrolltrigger-drift-fix スキルの refresh 対策を併用する
