# intersection-observer — IO 版フローティング CTA（依存ゼロ）

## 適用条件

- GSAP を使っていない軽量静的ページ（ビルドツール無し・script タグ直書きでも可）
- 表示 / 非表示の状態管理は ScrollTrigger 版と同一（真偽値 2 つの AND 合成）。判定を IntersectionObserver で行う
- HTML / CSS は references/css.md を併用する
- 注意: GSAP + ScrollTrigger 導入済みのプロジェクトでは references/gsap-scrolltrigger.md を使う（表示トリガーの一本化。SKILL.md 参照）

## JS（floating-cta.js）

ES Module 構成の場合は `export` を付けて main.js から呼ぶ。script タグ直書きなら DOMContentLoaded 後にそのまま実行してよい:

```js
export const initFloatingCta = ({ showTrigger = ".intro", hideTrigger = ".footer" } = {}) => {
  const root = document.querySelector(".floating-cta");
  if (!root) return; // ボタン自体が無いページでは何もしない

  let pastTrigger = false; // 表示開始トリガーを通過済みか
  let inHidden = false; // 終端の非表示ゾーンに入っているか

  const update = () => {
    const visible = pastTrigger && !inHidden;
    root.classList.toggle("is-visible", visible);
    root.toggleAttribute("inert", !visible); // 非表示中はフォーカス・読み上げからも除外
  };

  // 表示開始: トリガー要素が「画面外」かつ「上方向に抜けた」ときだけ表示。
  // boundingClientRect.top < 0 の条件が無いと、ページ下部で画面外になった
  // だけでも（= まだ到達していないのに）表示されてしまう
  const showEl = document.querySelector(showTrigger);
  if (showEl) {
    const showObserver = new IntersectionObserver(
      ([entry]) => {
        pastTrigger = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        update();
      },
      { threshold: 0 },
    );
    showObserver.observe(showEl);
  }

  // 非表示: 終端要素（フッター等）が少しでも見えたら隠す
  const hideEl = document.querySelector(hideTrigger);
  if (hideEl) {
    const hideObserver = new IntersectionObserver(
      ([entry]) => {
        inHidden = entry.isIntersecting;
        update();
      },
      { threshold: 0 },
    );
    hideObserver.observe(hideEl);
  }

  update();
};
```

## 設計メモ

- **上方向に抜けた判定（`!isIntersecting && top < 0`）**: IO は「見えているか」しか教えてくれないため、スクロール方向の情報を `boundingClientRect.top` の符号で補う。これが IO 版の肝で、ScrollTrigger 版の `onEnter` / `onLeaveBack` ペアに相当する
- **`threshold: 0`**: 1px でも見えたら / 完全に消えたら発火。表示開始を遅らせたい場合は `rootMargin`（例 `rootMargin: "0px 0px -20% 0px"`）で調整する。ScrollTrigger の `start` 文字列ほど直感的ではないので、細かい発火位置制御が要る案件は最初から ScrollTrigger 版を選ぶ
- **コールバックは初期化直後にも一度呼ばれる**: IO の仕様により observe 直後に現在状態で発火するため、リロードでページ途中から始まっても初期状態が正しく確定する（ScrollTrigger 版の明示的な `update()` 呼びと同等の効果。末尾の `update()` は root だけ存在しトリガーが無い場合の保険）
- **トリガー要素が無い場合の縮退**: showEl 無し → 永久に非表示（機能オフと同義）、hideEl 無し → フェードアウトだけ省略。どちらも例外は出ない
- observer は表示制御をページ滞在中ずっと続けるため `unobserve` しない（一度きりのスクロール演出とは違う点に注意）
