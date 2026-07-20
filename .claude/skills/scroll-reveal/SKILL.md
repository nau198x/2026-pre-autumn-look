---
name: scroll-reveal
description: LP の各要素に `data-animate` 属性を付けるだけで、スクロールしてビューポートに入ったタイミングで下からふわっとフェードイン表示させる仕組みを導入する。GSAP + ScrollTrigger 版（標準）と、GSAP を使わない IntersectionObserver + CSS クラス版の 2 方式。CSS 初期非表示は `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)` で制御し、JS 無効・reduced-motion 環境でコンテンツが消えない設計。`gsap.from()` ではなく `gsap.fromTo()` を使う理由（CSS の opacity: 0 を from() が終値と誤読して要素が表示されないバグ）も含む。ユーザーが「スクロールしたらふわっと出す」「スクロール連動でフェードイン」「下から出てくるアニメーション」「画面に入ったら表示」「data-animate 付けて」「セクションを順番に見せたい」「inview アニメーション」等を言ったときや、LP のセクション・画像・テキストに入場演出を付ける文脈では必ずこのスキルを使うこと。導入済みのフェードインが「全く動かなくなった」「全要素が最初から表示されている」「JS を切ったら要素が消えた」等の不具合相談も、初期非表示ガードと初期化の診断を持つ本スキルが一次対応する（発火位置が徐々にズレていく症状だけは scrolltrigger-drift-fix へ）。
---

# scroll-reveal

`[data-animate]` 属性ベースのスクロールリビールを導入するスキル。HTML 側は属性を付けるだけ、JS 側は全要素を一括で拾う 1 ループのみ、という薄い規約で統一する。完全コードは references にある。

## いつ使うか

- LP のセクション・画像・見出し・クレジット等に「見えたら出る」入場演出を付けたいとき
- 要素ごとにバラバラに書かれたリビール処理を属性ベースの一括管理に整理したいとき
- 新規セクション追加時に JS を触らず演出を効かせたいとき（属性を付ければ自動対象）

## 実装方式の判断基準

| 方式 | 使う条件 | 参照 |
|---|---|---|
| GSAP + ScrollTrigger 版（標準） | プロジェクトで既に GSAP を使っている / duration・ease・stagger の細かい調整やタイムライン連携が要る | references/animations-template.md |
| IntersectionObserver + CSS 版 | GSAP を入れていない軽量静的ページ / 演出は単純フェードで十分 / バンドルを増やしたくない | references/intersection-observer-variant.md |

**混在させない**こと。GSAP を使うページでは表示トリガーを ScrollTrigger に一本化する（IntersectionObserver を併用すると発火タイミングの二重管理になり、`refresh()` の効かない片系統が残る）。

## 設計上の必須事項

### fromTo 必須（GSAP 版の最重要ルール）

初期非表示を CSS（`[data-animate] { opacity: 0 }`）で行う場合、`gsap.from()` は**現在の計算値 opacity: 0 を「アニメの終着値」として読んでしまい、要素が永久に表示されない**。必ず `gsap.fromTo()` で開始値・終了値の両方を明示する。

### 初期非表示 CSS の条件付け

初期非表示は必ず次のメディアクエリ内に置く（属性名は 1 行なので SKILL 内に記す）: `@media (scripting: enabled) and (prefers-reduced-motion: no-preference) { [data-animate] { opacity: 0; } }`。これで JS 無効環境と reduced-motion 環境では最初から表示され、コンテンツが消える事故がない。

### start 値の目安

- `top 85%`: 標準。テキスト・小さめの要素。「見え始めてすぐ」動く
- `top 75%〜80%`: 大きな画像ブロック・演出をしっかり見せたい要素。ある程度見えてから動かすことで発火の瞬間を目撃させる
- `top 90%`: クレジット行・細かい要素。隠れていた感を出さずさりげなく
- SP は画面が縦に短く 1 要素の占有率が高いので、PC より早め（% を大きく）に倒すことが多い

### その他

- `once: true` を必ず付ける（逆スクロールで消えると安っぽい + トリガーが残り続けない）
- 画像に `loading="lazy"` が多いページでは、遅延読込による高さ変動で発火位置がズレる。`invalidateOnRefresh: true` と、プリローダー完了後・主要画像確定後の `ScrollTrigger.refresh()` で対処
- プリローダー併用時は ScrollTrigger の初期化をスクロールロック解除後に行う（lp-preloader スキルの completion-contract 参照）

## 導入手順

1. 方式を決め、該当する references を読む
2. CSS: 初期非表示ルール（上記メディアクエリ付き）を global CSS に追加
3. JS: references のコードを animations.js（相当）として追加し、DOMContentLoaded またはプリローダーの onComplete から初期化
4. HTML: 演出対象（ファーストビュー外）に `data-animate` を付与。ファーストビュー内の要素には付けない（ヒーローは入場タイムラインの管轄）
5. 個別調整が要る要素はデータ属性の値やモディファイア（references 参照）で上書きする

## 検品チェックリスト

- [ ] JS 無効（DevTools で Disable JavaScript）でも全コンテンツが見える
- [ ] `prefers-reduced-motion: reduce` で全要素が動きなしで即時表示される
- [ ] `gsap.from()` が 1 箇所も残っていない（GSAP 版）
- [ ] 最下部までスクロールして発火しない要素がない（lazy 画像による位置ズレ確認。ページ中盤で急に発火しなくなるのは refresh 漏れの典型症状）
- [ ] 逆スクロールで要素が再び消えない（once: true）
- [ ] リサイズ（SP→PC 回転含む）後も発火位置が正しい
- [ ] ファーストビュー内の要素に data-animate が付いていない（初期表示で不自然に動く）
- [ ] プリローダー併用時、ロック解除前に ScrollTrigger が初期化されていない
