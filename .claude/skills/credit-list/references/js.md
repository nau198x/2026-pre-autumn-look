# js — 罫線の左→右描画 + 行 stagger の GSAP ScrollTrigger

## 適用条件

- html.md / css.md とセットで使う。GSAP 3.x + ScrollTrigger 必須
- 演出の順序: ① ul 上端の濃線が左→右に描かれる → ② 各行の下線が上から順（stagger）に描かれる → ③ 線と同じタイミングで各行のテキストがフェードイン
- 罫線の濃 / 薄は CSS 側の `:last-child` / `--group-end` で決まる。JS は `--line-scale` を 1 に動かすだけ

## JS（animations.js に追記、または独立モジュール）

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const initCreditLists = () => {
  const ROW_START = 0.5; // 上端濃線の描画開始から行アニメ開始までの遅延（秒）
  const ROW_STAGGER = 0.4; // 行と行の間隔（秒）
  const ROW_DURATION = 1.0; // 1 行あたりの線・テキストの所要時間（秒）

  for (const credits of gsap.utils.toArray(".credits")) {
    // Tag（小見出し）も同じ配列に含め、DOM 順どおりにアニメさせる。
    // :scope > で直下の li だけを拾う（入れ子構造の誤爆防止）
    const allLis = gsap.utils.toArray(credits.querySelectorAll(":scope > .credits__item, :scope > .credits__tag"));

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: credits,
        start: "top 85%",
        once: true,
        invalidateOnRefresh: true,
      },
    });

    // ul 自体の opacity を復活（CSS の初期非表示を解除）
    tl.set(credits, { opacity: 1 }, 0);

    // 1) 上端フレーム（ul::before の濃線）を左→右に描く
    tl.to(credits, { "--line-scale": 1, duration: 0.8, ease: "power2.out" }, 0);

    // 2) 各行の下線を上から順に stagger で描く
    tl.to(
      allLis,
      {
        "--line-scale": 1,
        duration: ROW_DURATION,
        stagger: ROW_STAGGER,
        ease: "power2.out",
      },
      ROW_START,
    );

    // 3) 行ごとのテキストフェード（線と同じタイミングに揃える）
    for (const [idx, li] of allLis.entries()) {
      // Tag は li 自身を、通常行は中の 3 スパンをフェード対象にする
      const fadeTargets = li.matches(".credits__tag")
        ? [li]
        : [...li.querySelectorAll(".credits__name, .credits__price, .credits__action")];
      if (fadeTargets.length === 0) continue;

      tl.to(
        fadeTargets,
        {
          opacity: 1,
          duration: ROW_DURATION,
          ease: "power1.out",
        },
        ROW_START + idx * ROW_STAGGER,
      );
    }
  }
};
```

`main.js` からの呼び出し:

```js
import { initCreditLists } from "./animations.js";

document.addEventListener("DOMContentLoaded", () => {
  initCreditLists();
});
```

## 設計メモ

- **CSS 変数 `--line-scale` を GSAP で直接 tween する**: GSAP 3.x は CSS カスタムプロパティをアニメーションできる。線の描画（scaleX）を CSS 変数 1 個に集約することで、濃線・薄線・Tag 下線を同じ 1 本の `tl.to()` で一括制御できる
- **fadeTargets を常に配列に正規化**: 元実装は Element と NodeList が混在する変数を `length === 0 && !(instanceof Element)` という複合条件で判定していた（動作はするが読み違えやすい）。Tag は `[li]`、通常行はスプレッドで配列化し、空チェックを単純化した
- **`once: true`**: クレジットの罫線描画は一度きりの演出。逆スクロールでの巻き戻しはしない
- **`invalidateOnRefresh: true`**: lazy 画像ロード等で `ScrollTrigger.refresh()` が走った際に発火位置を再計算させる保険。lazy 画像が多いページでは scrolltrigger-drift-fix スキルの refresh 対策も併用する
- **reduced-motion の分岐を JS に書かない**: CSS 側の `@media (prefers-reduced-motion: no-preference)` で初期非表示自体を無効化しているため、tween が走っても「1 → 1」で視覚変化なし。JS はそのままで安全
