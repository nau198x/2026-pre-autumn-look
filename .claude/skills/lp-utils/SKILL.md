---
name: lp-utils
description: LP 定番の小型ユーティリティ 3 点セットを導入する。1)「--vh fix」= iOS の URL バー伸縮で 100vh レイアウトが崩れる問題への CSS カスタムプロパティ対策（orientationchange のみ更新する設計理由込み）、2)「scroll-restoration」= リロード時にブラウザがスクロール位置を復元して入場アニメが空振りする問題への scrollRestoration='manual' + 二重 rAF 対策、3)「smooth-anchor」= ページ内アンカーを GSAP ScrollToPlugin でヘッダーオフセット付きスムーススクロールさせる実装。ユーザーが「スマホでヒーローの高さがガタつく」「100vh が崩れる」「アドレスバーで高さが変わる」「下に隙間 / 見切れができる」「リロードするとページ途中から始まる」「必ずページ先頭から開始したい」「入場アニメが見えないことがある」「ページ内リンクをスルッと移動させたい」「アンカーで飛ぶときヘッダーに隠れる」「スムーススクロール入れて」等を言ったときは必ずこのスキルを使うこと。
---

# lp-utils

LP 制作でほぼ毎回入れる小型ユーティリティを 3 点に定型化したスキル。各ユーティリティは独立していて、必要なものだけ選んで入れる。完全コードは references にある。

## いつ使うか

- SP 実機でヒーロー（100vh 系レイアウト）の高さがスクロール中にガタつく・見切れるとき
- 入場アニメーション / プリローダーがあるページで、リロード時の開始位置を必ず先頭に固定したいとき
- ページ内ナビ（目次・セクションジャンプ）にスムーススクロールを付けたいとき

## ユーティリティの判断基準

| 症状 / 要件 | 入れるもの | 参照 |
|---|---|---|
| ヒーローを 100vh で組んだら SP でガタつく・下に隙間が出る | vh-fix | references/vh-fix.md |
| 入場アニメ・プリローダーがあるのに、リロードでページ途中から再開して演出が空振りする | scroll-restoration | references/scroll-restoration.md |
| ページ内アンカー（目次 / ナビ / TOP へ戻る）があり、瞬間ジャンプでは味気ない | smooth-anchor | references/smooth-anchor.md |

### 適用条件の詳細

- **vh-fix**: まず CSS の `svh` 単位で解決できないか検討する（`100svh` が使える要件なら JS 不要）。`svh` 非対応ブラウザまでケアする、または「URL バーが縮んだ後の高さ」ではなく初期表示の高さで固定したい場合にこのユーティリティを使う。**resize では更新しない**のが肝（更新すると URL バー伸縮のたびにヒーローの高さが動き、対策前より悪化する）
- **scroll-restoration**: 入場アニメ・プリローダー・ヒーロータイムラインがあるページはほぼ必須。ブラウザのスクロール復元は module スクリプトの実行より早いことがあるため、`<head>` 内の同期スクリプト + DOMContentLoaded 後の二重 rAF の**多層防御**で入れる
- **smooth-anchor**: GSAP を既に使っているページなら ScrollToPlugin 版（ヘッダーオフセット・PC/SP duration 切替・イージング制御ができる）。GSAP を入れていない軽量ページなら CSS `scroll-behavior: smooth` + `scroll-padding-top` で済ませる判断もあり（references 内に併記）

## 設計上の必須事項

- vh-fix の更新タイミングは**初期化時 + orientationchange のみ**。resize / scroll に紐付けない（iOS の URL バー伸縮で頻発してレイアウトシフトを招く）。iOS は orientationchange 直後の innerHeight が古いため遅延を挟む
- scroll-restoration は `history.scrollRestoration = "manual"` を **module ではなく head 内同期スクリプト**で設定する（module では復元に間に合わない）
- smooth-anchor は `autoKill: false` を付ける（スクロール中のわずかなユーザー操作で移動が中断されるのを防ぐ。ただし長距離移動でユーザーが止めたい場合もあるので、ページが長大なら true も検討）
- いずれも「なくてもページは動く」防御層なので、既存の動作を書き換えるのではなく追加する形で入れる

## 導入手順

1. 上の判断表から必要なユーティリティを選び、該当する references を読む
2. vh-fix: viewport.js（相当）を追加して main.js の初期化に載せ、対象 CSS の 100vh を `calc(var(--vh, 1vh) * 100)` に置き換える
3. scroll-restoration: head 内同期スクリプトを index.html に追加し、DOMContentLoaded ハンドラの先頭に二重 rAF ブロックを追加する
4. smooth-anchor: ScrollToPlugin を registerPlugin してから initSmoothScroll を初期化に載せる。ヘッダーが固定ヘッダーならオフセット値を実測して設定する
5. 各ユーティリティは機能ごとに別ファイル（viewport.js / main.js 内ブロック / smooth-scroll.js）に分け、main.js から初期化する

## 検品チェックリスト

- [ ] （vh-fix）iOS Safari 実機でスクロールして URL バーが伸縮しても、ヒーローの高さが動かない
- [ ] （vh-fix）実機を横→縦→横と回転して、各向きで高さが正しく更新される
- [ ] （vh-fix）`--vh` 未設定でも壊れない（`var(--vh, 1vh)` のフォールバック確認）
- [ ] （scroll-restoration）ページ中腹までスクロール → リロードで、必ず先頭から表示され入場アニメが再生される
- [ ] （scroll-restoration）別ページへ遷移 → ブラウザバックでも先頭に戻る挙動が要件と合っている（バックで位置復元したい要件なら beforeunload の 0 保存は外す）
- [ ] （smooth-anchor）アンカー着地位置がヘッダーに隠れない（オフセット値）
- [ ] （smooth-anchor）`href="#"` だけのリンクで例外が出ない・ページ先頭に飛ばない
- [ ] （smooth-anchor）移動中に軽くホイールを触っても中断されない（autoKill: false の確認）
- [ ] （smooth-anchor）`prefers-reduced-motion: reduce` でスムース移動が即時ジャンプに縮退する
